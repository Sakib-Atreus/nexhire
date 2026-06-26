package com.nexhire.api.auth;

import com.nexhire.api.exception.BadRequestException;
import com.nexhire.api.modules.auth.AuthService;
import com.nexhire.api.modules.auth.EmailVerificationTokenRepository;
import com.nexhire.api.modules.auth.PasswordResetTokenRepository;
import com.nexhire.api.modules.auth.dto.LoginRequest;
import com.nexhire.api.modules.auth.dto.RegisterRequest;
import com.nexhire.api.modules.users.Role;
import com.nexhire.api.modules.users.User;
import com.nexhire.api.modules.users.UserRepository;
import com.nexhire.api.modules.users.UserService;
import com.nexhire.api.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private UserService userService;
    @Mock private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock private EmailVerificationTokenRepository emailVerificationTokenRepository;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "jwtExpiration", 86400000L);
    }

    @Test
    void register_withNewEmail_returnsAuthResponse() {
        RegisterRequest request = new RegisterRequest("test@test.com", "password123", "John", "Doe", Role.CANDIDATE);
        User savedUser = User.builder()
            .email("test@test.com")
            .firstName("John")
            .lastName("Doe")
            .role(Role.CANDIDATE)
            .build();

        when(userRepository.existsByEmail("test@test.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtTokenProvider.generateToken(any())).thenReturn("access-token");
        when(jwtTokenProvider.generateRefreshToken(any())).thenReturn("refresh-token");
        when(userService.toDTO(any(User.class))).thenCallRealMethod();

        var response = authService.register(request);

        assertThat(response.accessToken()).isEqualTo("access-token");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_withExistingEmail_throwsBadRequestException() {
        RegisterRequest request = new RegisterRequest("existing@test.com", "password123", "John", "Doe", Role.CANDIDATE);
        when(userRepository.existsByEmail("existing@test.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Email already in use");
    }

    @Test
    void login_withValidCredentials_returnsAuthResponse() {
        LoginRequest request = new LoginRequest("test@test.com", "password123");
        User user = User.builder()
            .email("test@test.com")
            .firstName("John")
            .lastName("Doe")
            .role(Role.CANDIDATE)
            .build();

        when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.of(user));
        when(jwtTokenProvider.generateToken(user)).thenReturn("access-token");
        when(jwtTokenProvider.generateRefreshToken(user)).thenReturn("refresh-token");
        when(userService.toDTO(any(User.class))).thenCallRealMethod();

        var response = authService.login(request);

        assertThat(response.accessToken()).isEqualTo("access-token");
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }
}
