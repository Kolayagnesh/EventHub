package com.eventhub.bookingservice.consumer;

import com.eventhub.bookingservice.event.PaymentCompletedEvent;
import com.eventhub.bookingservice.event.PaymentFailedEvent;
import com.eventhub.bookingservice.service.BookingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingSagaConsumer {

    private final BookingService bookingService;

    @KafkaListener(topics = "payment-completed", groupId = "booking-group")
    public void handlePaymentCompleted(PaymentCompletedEvent event) {
        log.info("Received PaymentCompletedEvent for booking ID: {}", event.getBookingId());
        bookingService.confirmBooking(event.getBookingId());
    }

    @KafkaListener(topics = "payment-failed", groupId = "booking-group")
    public void handlePaymentFailed(PaymentFailedEvent event) {
        log.warn("Received PaymentFailedEvent for booking ID: {}. Reason: {}", event.getBookingId(), event.getReason());
        bookingService.cancelBookingAndReleaseSeats(event.getBookingId(), event.getEventId(), event.getSeatIds());
    }
}