package com.nexhire.api.users;

import com.nexhire.api.modules.users.AdminBootstrap;
import com.nexhire.api.modules.users.Role;
import com.nexhire.api.modules.users.User;
import com.nexhire.api.modules.users.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminBootstrapTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @InjectMocks private AdminBootstrap bootstrap;

    private void configure(String email, String password) {
        ReflectionTestUtils.setField(bootstrap, "adminEmail", email);
        ReflectionTestUtils.setField(bootstrap, "adminPassword", password);
    }

    @Test
    void skipsWhenAnAdminAlreadyExists() {
        configure("admin@test.com", "Password123!");
        when(userRepository.existsByRole(Role.ADMIN)).thenReturn(true);

        bootstrap.run(null);

        verify(userRepository, never()).save(any());
    }

    @Test
    void skipsWhenVariablesAreNotSet() {
        configure("", "");
        when(userRepository.existsByRole(Role.ADMIN)).thenReturn(false);

        bootstrap.run(null);

        verify(userRepository, never()).save(any());
    }

    @Test
    void skipsWhenPasswordIsTooShort() {
        configure("admin@test.com", "short");
        when(userRepository.existsByRole(Role.ADMIN)).thenReturn(false);

        bootstrap.run(null);

        verify(userRepository, never()).save(any());
    }

    @Test
    void createsAdminWhenNoneExists() {
        configure(" admin@test.com ", "Password123!");
        when(userRepository.existsByRole(Role.ADMIN)).thenReturn(false);
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("Password123!")).thenReturn("hashed");

        bootstrap.run(null);

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertThat(saved.getValue().getEmail()).isEqualTo("admin@test.com");
        assertThat(saved.getValue().getRole()).isEqualTo(Role.ADMIN);
        assertThat(saved.getValue().getPassword()).isEqualTo("hashed");
        assertThat(saved.getValue().isEmailVerified()).isTrue();
    }

    @Test
    void promotesExistingUserWithThatEmail() {
        configure("me@test.com", "Password123!");
        User existing = User.builder().id(UUID.randomUUID()).email("me@test.com")
            .firstName("Sam").lastName("Lee").role(Role.CANDIDATE).password("old").build();
        when(userRepository.existsByRole(Role.ADMIN)).thenReturn(false);
        when(userRepository.findByEmail("me@test.com")).thenReturn(Optional.of(existing));
        when(passwordEncoder.encode("Password123!")).thenReturn("hashed");

        bootstrap.run(null);

        verify(userRepository).save(existing);
        assertThat(existing.getRole()).isEqualTo(Role.ADMIN);
        assertThat(existing.getFirstName()).isEqualTo("Sam");
        assertThat(existing.getPassword()).isEqualTo("hashed");
    }
}
