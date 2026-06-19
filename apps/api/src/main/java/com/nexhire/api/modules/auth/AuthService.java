package com.nexhire.api.modules.auth;

import com.nexhire.api.exception.BadRequestException;
import com.nexhire.api.modules.auth.dto.AuthResponse;
import com.nexhire.api.modules.auth.dto.ForgotPasswordRequest;
import com.nexhire.api.modules.auth.dto.LoginRequest;
import com.nexhire.api.modules.auth.dto.MessageResponse;
import com.nexhire.api.modules.auth.dto.RefreshTokenRequest;
import com.nexhire.api.modules.auth.dto.RegisterRequest;
import com.nexhire.api.modules.auth.dto.ResetPasswordRequest;
import com.nexhire.api.modules.auth.dto.VerifyEmailRequest;
import com.nexhire.api.modules.users.User;
import com.nexhire.api.modules.users.UserRepository;
import com.nexhire.api.modules.users.UserService;
import com.nexhire.api.security.JwtTokenProvider;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BadRequestException("Email already in use: " + request.email());
        }

        User user = User.builder()
            .email(request.email())
            .password(passwordEncoder.encode(request.password()))
            .firstName(request.firstName())
            .lastName(request.lastName())
            .role(request.role())
            .build();

        userRepository.save(user);

        sendVerificationEmail(user);

        String accessToken = jwtTokenProvider.generateToken(user);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user);

        return new AuthResponse(accessToken, refreshToken, jwtExpiration, userService.toDTO(user));
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userRepository.findByEmail(request.email())
            .orElseThrow(() -> new BadRequestException("Invalid credentials"));

        String accessToken = jwtTokenProvider.generateToken(user);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user);

        return new AuthResponse(accessToken, refreshToken, jwtExpiration, userService.toDTO(user));
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String username;
        try {
            username = jwtTokenProvider.extractUsername(request.refreshToken());
        } catch (JwtException e) {
            throw new BadRequestException("Invalid or malformed refresh token");
        }
        User user = userRepository.findByEmail(username)
            .orElseThrow(() -> new BadRequestException("Invalid refresh token"));
        if (!jwtTokenProvider.isTokenValid(request.refreshToken(), user)) {
            throw new BadRequestException("Invalid or expired refresh token");
        }
        String accessToken = jwtTokenProvider.generateToken(user);
        return new AuthResponse(accessToken, request.refreshToken(), jwtExpiration, userService.toDTO(user));
    }

    @Transactional
    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.email()).ifPresent(user -> {
            passwordResetTokenRepository.deleteByUserId(user.getId());
            String token = UUID.randomUUID().toString();
            PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .token(token)
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
            passwordResetTokenRepository.save(resetToken);
            log.info("PASSWORD_RESET_TOKEN for {}: {}", user.getEmail(), token);
        });
        return new MessageResponse("If an account exists for this email, reset instructions have been logged");
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.token())
            .orElseThrow(() -> new BadRequestException("Invalid or expired reset token"));
        if (resetToken.isUsed() || Instant.now().isAfter(resetToken.getExpiresAt())) {
            throw new BadRequestException("Reset token has expired");
        }
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        return new MessageResponse("Password reset successfully. Please log in with your new password.");
    }

    @Transactional
    public void sendVerificationEmail(User user) {
        emailVerificationTokenRepository.deleteByUserId(user.getId());
        String token = UUID.randomUUID().toString();
        EmailVerificationToken verifyToken = EmailVerificationToken.builder()
            .user(user)
            .token(token)
            .expiresAt(Instant.now().plusSeconds(86400))
            .build();
        emailVerificationTokenRepository.save(verifyToken);
        log.info("EMAIL_VERIFICATION_TOKEN for {}: {}", user.getEmail(), token);
    }

    @Transactional
    public MessageResponse verifyEmail(VerifyEmailRequest request) {
        EmailVerificationToken verifyToken = emailVerificationTokenRepository.findByToken(request.token())
            .orElseThrow(() -> new BadRequestException("Invalid verification token"));
        if (Instant.now().isAfter(verifyToken.getExpiresAt())) {
            throw new BadRequestException("Verification token has expired");
        }
        User user = verifyToken.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);
        emailVerificationTokenRepository.deleteByUserId(user.getId());
        return new MessageResponse("Email verified successfully!");
    }

    @Transactional
    public MessageResponse resendVerification(User currentUser) {
        sendVerificationEmail(currentUser);
        return new MessageResponse("Verification email has been sent (check server logs for the token)");
    }
}
