package com.eventhub.notificationservice.consumer;

import com.eventhub.notificationservice.client.AuthServiceClient;
import com.eventhub.notificationservice.event.PaymentCompletedEvent;
import com.eventhub.notificationservice.event.PaymentFailedEvent;
import com.eventhub.notificationservice.event.TicketGeneratedEvent;
import com.eventhub.notificationservice.service.EmailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationConsumer {

    private final EmailService emailService;
    private final ObjectMapper objectMapper;
    private final AuthServiceClient authServiceClient;

    @KafkaListener(topics = "ticket-generated", groupId = "notification-group")
    public void handleTicketGenerated(String message) {
        try {
            TicketGeneratedEvent event = objectMapper.readValue(message, TicketGeneratedEvent.class);
            String recipientEmail = resolveEmail(event.getUserId());

            List<String> codes = (event.getTicketCodes() != null) ? event.getTicketCodes() : Collections.emptyList();
            emailService.sendTicketPassesEmail(recipientEmail, event.getBookingId(), codes);
            log.info("Ticket email dispatched to {}", recipientEmail);
        } catch (Exception e) {
            log.error("Failed to process ticket email: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "payment-completed", groupId = "notification-group")
    public void handlePaymentCompleted(String message) {
        try {
            PaymentCompletedEvent event = objectMapper.readValue(message, PaymentCompletedEvent.class);
            String recipientEmail = resolveEmail(event.getUserId());

            emailService.sendPaymentSuccessEmail(
                    recipientEmail,
                    event.getBookingId(),
                    event.getAmount(),
                    event.getTransactionId()
            );
            log.info("Payment success email dispatched to {}", recipientEmail);
        } catch (Exception e) {
            log.error("Failed to process payment success email: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "payment-failed", groupId = "notification-group")
    public void handlePaymentFailed(String message) {
        try {
            log.info(message);
            PaymentFailedEvent event = objectMapper.readValue(message, PaymentFailedEvent.class);
            String recipientEmail = resolveEmail(event.getUserId());

            emailService.sendPaymentFailedEmail(
                    recipientEmail,
                    event.getBookingId(),
                    event.getReason() != null ? event.getReason() : "Payment Declined"
            );
            log.info("Payment failure alert dispatched to {}", recipientEmail);
        } catch (Exception e) {
            log.error("Failed to process payment failed email: {}", e.getMessage(), e);
        }
    }

    private String resolveEmail(Long userId) {
        log.info("Resolving email for user {}", userId);
        try {
            if (userId != null) {

                String email = authServiceClient.getUserEmailById(userId);
                if (email != null && !email.isBlank()) {
                    return email;
                }
            }
        } catch (Exception ex) {
            log.warn("Feign lookup failed for userId {}: {}", userId, ex.getMessage());
        }
        return "testuser@example.com";
    }
}