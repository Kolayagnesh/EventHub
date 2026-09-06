package com.eventhub.paymentservice.consumer;

import com.eventhub.paymentservice.event.BookingCreatedEvent;
import com.eventhub.paymentservice.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentConsumer {

    private final PaymentService paymentService;

    @KafkaListener(topics = "booking-created", groupId = "payment-group")
    public void handleBookingCreated(BookingCreatedEvent event) {
        log.info("Consuming booking-created for booking ID: {}", event.getBookingId());
        paymentService.createRazorpayOrder(event);
    }
}