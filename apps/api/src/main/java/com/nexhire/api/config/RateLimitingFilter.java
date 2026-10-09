package com.nexhire.api.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

/**
 * Per-client sliding-window limits on endpoints that are expensive or abusable (sign-in, emails,
 * applying, reporting, messages, the notification stream). In-memory, so limits are per instance.
 */
@Component
@Order(1)
@Slf4j
public class RateLimitingFilter implements Filter {

    private record Rule(String name, String method, Pattern path, int max, long windowMs) {}

    private static final long MINUTE = 60_000L;
    private static final List<Rule> RULES = List.of(
        new Rule("login", "POST", Pattern.compile(".*/auth/login$"), 10, MINUTE),
        new Rule("register", "POST", Pattern.compile(".*/auth/register$"), 10, MINUTE),
        // Each of these sends an email: keep it low to prevent mail bombing.
        new Rule("email", "POST", Pattern.compile(".*/auth/(forgot-password|resend-verification)$"), 5, 10 * MINUTE),
        new Rule("token", "POST", Pattern.compile(".*/auth/(reset-password|verify-email|refresh)$"), 30, MINUTE),
        new Rule("apply", "POST", Pattern.compile(".*/applications$"), 20, MINUTE),
        new Rule("report", "POST", Pattern.compile(".*/jobs/[^/]+/report$"), 10, 10 * MINUTE),
        new Rule("message", "POST", Pattern.compile(".*/applications/[^/]+/messages$"), 60, MINUTE),
        new Rule("stream", "GET", Pattern.compile(".*/notifications/stream$"), 30, MINUTE)
    );
    /** Hard cap on tracked clients, so a flood of distinct addresses can't exhaust memory. */
    private static final int MAX_KEYS = 50_000;

    private final ConcurrentHashMap<String, Deque<Long>> requestMap = new ConcurrentHashMap<>();

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpReq = (HttpServletRequest) req;
        Rule rule = match(httpReq);
        if (rule != null && !allow(rule, clientIp(httpReq))) {
            HttpServletResponse httpRes = (HttpServletResponse) res;
            httpRes.setStatus(429);
            httpRes.setHeader("Retry-After", String.valueOf(rule.windowMs() / 1000));
            httpRes.setContentType("application/json");
            httpRes.getWriter().write("{\"status\":429,\"message\":\"Too many requests. Please wait a moment and try again.\"}");
            return;
        }
        chain.doFilter(req, res);
    }

    private static Rule match(HttpServletRequest req) {
        String path = req.getRequestURI();
        for (Rule r : RULES) {
            if (r.method().equals(req.getMethod()) && r.path().matcher(path).matches()) return r;
        }
        return null;
    }

    private boolean allow(Rule rule, String ip) {
        if (requestMap.size() >= MAX_KEYS) requestMap.clear();
        long now = System.currentTimeMillis();
        Deque<Long> timestamps = requestMap.computeIfAbsent(rule.name() + '|' + ip, k -> new ArrayDeque<>());
        synchronized (timestamps) {
            while (!timestamps.isEmpty() && now - timestamps.peekFirst() > rule.windowMs()) timestamps.pollFirst();
            if (timestamps.size() >= rule.max()) return false;
            timestamps.addLast(now);
            return true;
        }
    }

    /**
     * The visitor's IP. With server.forward-headers-strategy=native, Tomcat resolves it from X-Forwarded-For,
     * reading from the right and skipping trusted private-network proxies, so client-sent values can't spoof it.
     */
    private static String clientIp(HttpServletRequest req) {
        return req.getRemoteAddr();
    }

    /** Drop clients with no requests in the longest window. */
    @Scheduled(fixedDelay = 5 * MINUTE)
    void evictIdle() {
        long cutoff = System.currentTimeMillis() - 10 * MINUTE;
        requestMap.entrySet().removeIf(e -> {
            synchronized (e.getValue()) {
                return e.getValue().isEmpty() || e.getValue().peekLast() < cutoff;
            }
        });
    }
}
