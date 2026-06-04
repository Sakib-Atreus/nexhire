package com.nexhire.api.modules.users;

import com.nexhire.api.modules.users.dto.UpdateUserRequest;
import com.nexhire.api.modules.users.dto.UserDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management endpoints")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<UserDTO> getMe(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(userService.toDTO(currentUser));
    }

    @PatchMapping("/me")
    @Operation(summary = "Update current user profile")
    public ResponseEntity<UserDTO> updateMe(
        @AuthenticationPrincipal User currentUser,
        @Valid @RequestBody UpdateUserRequest request
    ) {
        return ResponseEntity.ok(userService.update(currentUser.getId(), request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all users (ADMIN only)")
    public ResponseEntity<Page<UserDTO>> getAll(Pageable pageable) {
        return ResponseEntity.ok(userService.getAll(pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get user by ID (ADMIN only)")
    public ResponseEntity<UserDTO> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getById(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete user (ADMIN only)")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
