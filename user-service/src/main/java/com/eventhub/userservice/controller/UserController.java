package com.eventhub.userservice.controller;

import com.eventhub.userservice.dto.UserProfileRequest;
import com.eventhub.userservice.entity.User;
import com.eventhub.userservice.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // Reads the X-User-Id header injected automatically by the API Gateway AuthenticationFilter
    @GetMapping("/profile")
    public ResponseEntity<User> getMyProfile(@RequestHeader("X-User-Id") Long authUserId) {
        return ResponseEntity.ok(userService.getProfileByAuthId(authUserId));
    }

    @PostMapping("/profile")
    public ResponseEntity<User> saveMyProfile(
            @RequestHeader("X-User-Id") Long authUserId,
            @Valid @RequestBody UserProfileRequest request) {
        return ResponseEntity.ok(userService.createOrUpdateProfile(authUserId, request));
    }
}