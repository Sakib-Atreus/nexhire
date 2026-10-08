package com.nexhire.api.modules.users;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Creates the first administrator on startup from ADMIN_EMAIL / ADMIN_PASSWORD.
 *
 * Runs only while the platform has no admin at all, so once an admin exists these
 * variables are ignored (and can be removed). If the email already belongs to a user,
 * that account is promoted and its password set to ADMIN_PASSWORD.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminBootstrap implements ApplicationRunner {

    private static final int MIN_PASSWORD_LENGTH = 8;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.email:}")
    private String adminEmail;

    @Value("${admin.password:}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.existsByRole(Role.ADMIN)) {
            log.debug("Admin account already exists; skipping admin bootstrap");
            return;
        }

        String email = adminEmail == null ? "" : adminEmail.trim();
        if (email.isEmpty() || adminPassword == null || adminPassword.isBlank()) {
            log.warn("No admin account exists. Set ADMIN_EMAIL and ADMIN_PASSWORD to create one on startup.");
            return;
        }
        if (!email.contains("@")) {
            log.warn("ADMIN_EMAIL '{}' is not a valid email address; admin not created", email);
            return;
        }
        if (adminPassword.length() < MIN_PASSWORD_LENGTH) {
            log.warn("ADMIN_PASSWORD must be at least {} characters; admin not created", MIN_PASSWORD_LENGTH);
            return;
        }

        User admin = userRepository.findByEmail(email).orElseGet(() -> User.builder()
            .email(email)
            .firstName("Platform")
            .lastName("Admin")
            .build());
        boolean existed = admin.getId() != null;

        admin.setRole(Role.ADMIN);
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setEnabled(true);
        admin.setEmailVerified(true);
        userRepository.save(admin);

        log.info("{} admin account {}", existed ? "Promoted existing user to" : "Created", email);
    }
}
