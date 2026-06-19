package com.nexhire.api.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Order(1)
@Slf4j
public class RateLimitingFilter implements Filter {

    private static final int MAX_REQUESTS = 10;
    private static final long WINDOW_MS = 60_000L;
    private final ConcurrentHashMap<String, Deque<Long>> requestMap = new ConcurrentHashMap<>();

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpReq = (HttpServletRequest) req;
        String path = httpReq.getRequestURI();
        if ("POST".equals(httpReq.getMethod()) && (path.endsWith("/auth/login") || path.endsWith("/auth/register"))) {
            String ip = httpReq.getRemoteAddr();
            long now = System.currentTimeMillis();
            Deque<Long> timestamps = requestMap.computeIfAbsent(ip, k -> new ArrayDeque<>());
            synchronized (timestamps) {
                while (!timestamps.isEmpty() && now - timestamps.peekFirst() > WINDOW_MS) timestamps.pollFirst();
                if (timestamps.size() >= MAX_REQUESTS) {
                    HttpServletResponse httpRes = (HttpServletResponse) res;
                    httpRes.setStatus(429);
                    httpRes.setContentType("application/json");
                    httpRes.getWriter().write("{\"status\":429,\"message\":\"Too many requests. Please try again later.\"}");
                    return;
                }
                timestamps.addLast(now);
            }
        }
        chain.doFilter(req, res);
    }
}
