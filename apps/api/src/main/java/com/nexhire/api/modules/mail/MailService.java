package com.nexhire.api.modules.mail;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

/**
 * Transactional email. Sending is enabled when SMTP is configured (SPRING_MAIL_HOST etc.);
 * otherwise messages are logged so local development and email-less deployments keep working.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MailService {

    private final ObjectProvider<JavaMailSender> mailSender;

    @Value("${app.mail.from:NexHire <no-reply@nexhire.local>}")
    private String from;

    @Value("${app.base-url:http://localhost:3000}")
    private String baseUrl;

    public boolean isEnabled() {
        return mailSender.getIfAvailable() != null;
    }

    /** Absolute link into the web app, e.g. link("/jobs/123"). */
    public String link(String path) {
        return baseUrl.replaceAll("/+$", "") + path;
    }

    /**
     * Send a simple branded email with an optional call-to-action button.
     * paragraphs are plain text (escaped); the plain-text part is generated from the same content.
     */
    @Async
    public void send(String to, String subject, String heading, java.util.List<String> paragraphs, String buttonText, String buttonUrl) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null) {
            log.info("Email not configured; would send '{}' to {}{}", subject, to, buttonUrl != null ? " with link " + buttonUrl : "");
            return;
        }
        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(plainText(heading, paragraphs, buttonText, buttonUrl), html(heading, paragraphs, buttonText, buttonUrl));
            sender.send(message);
        } catch (Exception e) {
            log.warn("Could not send '{}' to {}: {}", subject, to, e.getMessage());
        }
    }

    private String plainText(String heading, java.util.List<String> paragraphs, String buttonText, String buttonUrl) {
        StringBuilder sb = new StringBuilder(heading).append("\n\n");
        paragraphs.forEach(p -> sb.append(p).append("\n\n"));
        if (buttonUrl != null) sb.append(buttonText).append(": ").append(buttonUrl).append("\n\n");
        return sb.append("— NexHire").toString();
    }

    private String html(String heading, java.util.List<String> paragraphs, String buttonText, String buttonUrl) {
        StringBuilder body = new StringBuilder();
        for (String p : paragraphs) {
            body.append("<p style=\"margin:0 0 14px;font-size:15px;line-height:1.6;color:#334155\">")
                .append(HtmlUtils.htmlEscape(p).replace("\n", "<br>")).append("</p>");
        }
        String button = buttonUrl == null ? "" :
            "<p style=\"margin:24px 0\"><a href=\"" + HtmlUtils.htmlEscape(buttonUrl) + "\" style=\"background:#4f46e5;color:#ffffff;"
                + "text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:14px;display:inline-block\">"
                + HtmlUtils.htmlEscape(buttonText) + "</a></p>";
        return "<!doctype html><html><body style=\"margin:0;background:#f8fafc;font-family:Inter,Segoe UI,Arial,sans-serif\">"
            + "<div style=\"max-width:560px;margin:0 auto;padding:32px 20px\">"
            + "<p style=\"font-weight:700;font-size:18px;color:#4f46e5;margin:0 0 20px\">NexHire</p>"
            + "<div style=\"background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:28px\">"
            + "<h1 style=\"margin:0 0 16px;font-size:20px;color:#0f172a\">" + HtmlUtils.htmlEscape(heading) + "</h1>"
            + body + button + "</div>"
            + "<p style=\"font-size:12px;color:#94a3b8;margin:16px 4px 0\">You received this email because of your NexHire account.</p>"
            + "</div></body></html>";
    }
}
