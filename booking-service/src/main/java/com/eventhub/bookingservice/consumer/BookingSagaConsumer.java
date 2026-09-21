package com.eventhub.bookingservice.consumer;

import com.eventhub.bookingservice.event.PaymentCompletedEvent;
import com.eventhub.bookingservice.event.PaymentFailedEvent;
import com.eventhub.bookingservice.service.BookingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingSagaConsumer {

    private final BookingService bookingService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "payment-completed", groupId = "booking-group")
    public void handlePaymentCompleted(String message) {
        try {
            PaymentCompletedEvent event = objectMapper.readValue(message, PaymentCompletedEvent.class);
            log.info("Processing PaymentCompletedEvent for booking ID: {}", event.getBookingId());
            bookingService.confirmBooking(event.getBookingId());
        } catch (Exception e) {
            log.error("Failed to parse payment-completed payload: {}", message, e);
        }
    }

    @KafkaListener(topics = "payment-failed", groupId = "booking-group")
    public void handlePaymentFailed(String message) {
        try {
            PaymentFailedEvent event = objectMapper.readValue(message, PaymentFailedEvent.class);
            log.warn("Processing PaymentFailedEvent for booking ID: {}", event.getBookingId());
            bookingService.cancelBookingAndReleaseSeats(event.getBookingId(), event.getEventId(), event.getSeatIds());
        } catch (Exception e) {
            log.error("Failed to parse payment-failed payload: {}", message, e);
        }
    }
}