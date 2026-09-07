package com.eventhub.notificationservice.consumer;

import com.eventhub.notificationservice.event.PaymentCompletedEvent;
import com.eventhub.notificationservice.event.PaymentFailedEvent;
import com.eventhub.notificationservice.event.TicketGeneratedEvent;
import com.eventhub.notificationservice.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationConsumer {

    private final EmailService emailService;

    @KafkaListener(topics = "payment-completed", groupId = "notification-group")
    public void consumePaymentCompleted(PaymentCompletedEvent event) {
        log.info("Processing payment-completed email for booking #{}", event.getBookingId());
        String recipient = (event.getEmail() != null && !event.getEmail().isBlank())
                ? event.getEmail()
                : "testuser@example.com"; // Fallback for testing

        emailService.sendPaymentSuccessEmail(
                recipient,
                event.getBookingId(),
                event.getAmount(),
                event.getTransactionId()
        );
    }

    @KafkaListener(topics = "payment-failed", groupId = "notification-group")
    public void consumePaymentFailed(PaymentFailedEvent event) {
        log.warn("Processing payment-failed email for booking #{}", event.getBookingId());
        String recipient = (event.getEmail() != null && !event.getEmail().isBlank())
                ? event.getEmail()
                : "testuser@example.com";

        emailService.sendPaymentFailedEmail(
                recipient,
                event.getBookingId(),
                event.getReason()
        );
    }

    @KafkaListener(topics = "ticket-generated", groupId = "notification-group")
    public void consumeTicketGenerated(TicketGeneratedEvent event) {
        log.info("Processing ticket delivery email for booking #{}", event.getBookingId());
        String recipient = (event.getEmail() != null && !event.getEmail().isBlank())
                ? event.getEmail()
                : "testuser@example.com";

        emailService.sendTicketPassesEmail(
                recipient,
                event.getBookingId(),
                event.getTicketCodes()
        );
    }
}