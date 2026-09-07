package com.eventhub.authservice.Service;

import com.eventhub.authservice.DTO.AuthRequest;
import com.eventhub.authservice.DTO.AuthResponse;
import com.eventhub.authservice.DTO.RegisterRequest;
import com.eventhub.authservice.DTO.VerifyOtpRequest;
import com.eventhub.authservice.entity.UserCredential;
import com.eventhub.authservice.Repository.UserCredentialRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserCredentialRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    // STEP 1: Process Page 1 (Email + Password)
    @Transactional
    public String register(RegisterRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        var existingUserOpt = repository.findByEmail(email);
        if (existingUserOpt.isPresent()) {
            UserCredential existing = existingUserOpt.get();
            // If already verified, do not allow re-registration
            if (Boolean.TRUE.equals(existing.getIsVerified())) {
                throw new RuntimeException("Email is already registered and verified. Please login.");
            }
            // If registered previously but never verified, update password & reissue new OTP
            return issueOtpToPendingUser(existing, request.getPassword());
        }

        // Generate 6-digit numeric OTP
        String otp = String.format("%06d", new SecureRandom().nextInt(1000000));
        String assignedRole = (request.getRole() != null && !request.getRole().isBlank())
                ? request.getRole()
                : "ROLE_CUSTOMER";

        UserCredential credential = UserCredential.builder()
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(assignedRole)
                .otp(otp)
                .otpExpiry(LocalDateTime.now().plusMinutes(5))
                .isVerified(false)
                .build();

        repository.save(credential);
        emailService.sendOtpEmail(email, otp);

        log.info("Registered unverified credentials for email: {}. OTP dispatched.", email);
        return "Registration successful. Please enter the OTP sent to your email.";
    }

    private String issueOtpToPendingUser(UserCredential user, String newPassword) {
        String otp = String.format("%06d", new SecureRandom().nextInt(1000000));
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
        repository.save(user);

        emailService.sendOtpEmail(user.getEmail(), otp);
        return "A new verification OTP has been sent to your email.";
    }

    // STEP 2: Process Page 2 (OTP Entry)
    @Transactional
    public AuthResponse verifyOtpAndAuthenticate(VerifyOtpRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        UserCredential user = repository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        if (Boolean.TRUE.equals(user.getIsVerified())) {
            throw new RuntimeException("Account is already verified. Please log in.");
        }

        if (user.getOtp() == null || user.getOtpExpiry() == null) {
            throw new RuntimeException("No verification code found. Please re-register to request a code.");
        }

        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP has expired. Please re-register or request a new code.");
        }

        if (!user.getOtp().equals(request.getOtp().trim())) {
            throw new RuntimeException("Invalid OTP code. Please verify the code sent to your inbox.");
        }

        // Verification successful: mark verified and wipe OTP fields to prevent replay
        user.setIsVerified(true);
        user.setOtp(null);
        user.setOtpExpiry(null);
        repository.save(user);

        // Generate signed JWT
        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole());

        log.info("User {} verified successfully. Account activated.", email);
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    // Standard Login
    public AuthResponse login(AuthRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        UserCredential user = repository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (Boolean.FALSE.equals(user.getIsVerified())) {
            throw new RuntimeException("Account is unverified. Please verify your email before logging in.");
        }

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