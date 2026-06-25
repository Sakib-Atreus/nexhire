package com.nexhire.api.modules.users;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexhire.api.exception.ResourceNotFoundException;
import com.nexhire.api.modules.users.dto.UpdateUserRequest;
import com.nexhire.api.modules.users.dto.UserDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    public UserDTO getById(UUID id) {
        return userRepository.findById(id)
            .map(this::toDTO)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    public UserDTO getByEmail(String email) {
        return userRepository.findByEmail(email)
            .map(this::toDTO)
            .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    public Page<UserDTO> getAll(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toDTO);
    }

    public Page<UserDTO> getByRole(Role role, Pageable pageable) {
        return userRepository.findByRole(role, pageable).map(this::toDTO);
    }

    @Transactional
    public UserDTO update(UUID id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (request.firstName() != null) user.setFirstName(request.firstName());
        if (request.lastName() != null) user.setLastName(request.lastName());
        if (request.phone() != null) user.setPhone(request.phone());
        if (request.bio() != null) user.setBio(request.bio());
        if (request.avatarUrl() != null) user.setAvatarUrl(request.avatarUrl());
        if (request.skills() != null) user.setSkills(toJsonString(request.skills()));
        if (request.headline() != null) user.setHeadline(request.headline());
        if (request.portfolioLinks() != null) user.setPortfolioLinks(toJsonString(request.portfolioLinks()));
        if (request.openToWork() != null) user.setOpenToWork(request.openToWork());

        return toDTO(userRepository.save(user));
    }

    @Transactional
    public void delete(UUID id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User", "id", id);
        }
        userRepository.deleteById(id);
    }

    @Transactional
    public UserDTO banUser(UUID id, boolean enable) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        user.setEnabled(enable);
        return toDTO(userRepository.save(user));
    }

    @Transactional
    public UserDTO promoteUser(UUID id, Role newRole) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        user.setRole(newRole);
        return toDTO(userRepository.save(user));
    }

    public UserDTO toDTO(User user) {
        return new UserDTO(
            user.getId(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getFullName(),
            user.getRole(),
            user.getPhone(),
            user.getBio(),
            user.getAvatarUrl(),
            user.isEmailVerified(),
            user.getCreatedAt(),
            parseJsonList(user.getSkills()),
            user.getHeadline(),
            parseJsonList(user.getPortfolioLinks()),
            user.isEnabled(),
            user.isOpenToWork()
        );
    }

    private List<String> parseJsonList(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return new ObjectMapper().readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private String toJsonString(List<String> list) {
        if (list == null) return "[]";
        try {
            return new ObjectMapper().writeValueAsString(list);
        } catch (Exception e) {
            return "[]";
        }
    }
}
