package com.eventhub.ticketservice.consumer;

import com.eventhub.ticketservice.event.PaymentCompletedEvent;
import com.eventhub.ticketservice.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class TicketKafkaConsumer {

    private final TicketService ticketService;

    @KafkaListener(topics = "payment-completed", groupId = "ticket-group")
    public void consumePaymentCompleted(PaymentCompletedEvent event) {
        log.info("Ticket Service consumed payment-completed for booking ID: {}", event.getBookingId());
        ticketService.generateTicketsForBooking(event);
    }
}