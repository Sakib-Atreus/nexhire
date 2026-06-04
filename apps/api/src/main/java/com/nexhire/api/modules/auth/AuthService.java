package com.nexhire.api.modules.auth;

import com.nexhire.api.exception.BadRequestException;
import com.nexhire.api.modules.auth.dto.AuthResponse;
import com.nexhire.api.modules.auth.dto.LoginRequest;
import com.nexhire.api.modules.auth.dto.RegisterRequest;
import com.nexhire.api.modules.users.User;
import com.nexhire.api.modules.users.UserRepository;
import com.nexhire.api.modules.users.UserService;
import com.nexhire.api.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final UserService userService;

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
}
