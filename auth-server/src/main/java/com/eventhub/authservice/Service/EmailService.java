package com.eventhub.authservice.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(senderEmail);
            helper.setTo(toEmail);
            helper.setSubject("EventHub Account Verification OTP");

            String html = """
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #1976d2;">Verify Your EventHub Account</h2>
                    <p>Thank you for registering. Use the code below to verify your email address:</p>
                    <div style="background-color: #f1f3f4; padding: 12px; border-radius: 6px; text-align: center; margin: 20px 0;">
                        <span style="font-size: 30px; font-weight: bold; letter-spacing: 5px; color: #222;">%s</span>
                    </div>
                    <p style="color: #666; font-size: 12px;">This code is valid for 5 minutes. If you did not register, please ignore this email.</p>
                </div>
                """.formatted(otp);

            helper.setText(html, true);
            mailSender.send(message);
            log.info("Verification email sent to {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Could not send verification email. Please check your email address.");
        }
    }
}