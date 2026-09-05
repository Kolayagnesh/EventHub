package com.eventhub.authservice.Service;

import com.eventhub.authservice.DTO.AuthRequest;
import com.eventhub.authservice.DTO.AuthResponse;
import com.eventhub.authservice.Entity.UserCredential;
import com.eventhub.authservice.Repository.UserCredentialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserCredentialRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final com.eventhub.authservice.Service.JwtService jwtService;

    public AuthResponse register(AuthRequest request) {
        if (repository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already registered");
        }

        String assignedRole = (request.getRole() != null && !request.getRole().isBlank())
                ? request.getRole()
                : "ROLE_CUSTOMER";

        UserCredential credential = UserCredential.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(assignedRole)
                .build();

        UserCredential savedUser = repository.save(credential);
        String token = jwtService.generateToken(savedUser.getId(), savedUser.getEmail(), savedUser.getRole());

        return AuthResponse.builder()
                .token(token)
                .userId(savedUser.getId())
                .email(savedUser.getEmail())
                .role(savedUser.getRole())
                .build();
    }

    public AuthResponse login(AuthRequest request) {
        UserCredential user = repository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    public void validateToken(String token) {
        jwtService.validateToken(token);
    }
}