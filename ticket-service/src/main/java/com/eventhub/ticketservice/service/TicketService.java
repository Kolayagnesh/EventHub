package com.eventhub.ticketservice.service;

import com.eventhub.ticketservice.entity.Ticket;
import com.eventhub.ticketservice.entity.TicketScan;
import com.eventhub.ticketservice.entity.TicketStatus;
import com.eventhub.ticketservice.event.PaymentCompletedEvent;
import com.eventhub.ticketservice.event.TicketGeneratedEvent;
import com.eventhub.ticketservice.repository.TicketRepository;
import com.eventhub.ticketservice.repository.TicketScanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketScanRepository ticketScanRepository;
    private final QRCodeService qrCodeService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Transactional
    public void generateTicketsForBooking(PaymentCompletedEvent event) {
        // Idempotency: skip if already generated for this booking
        List<Ticket> existing = ticketRepository.findByBookingId(event.getBookingId());
        if (!existing.isEmpty()) {
            log.warn("Tickets already exist for booking ID: {}", event.getBookingId());
            return;
        }

        List<Ticket> generatedTickets = new ArrayList<>();
        List<Long> seatIds = (event.getSeatIds() != null && !event.getSeatIds().isEmpty())
                ? event.getSeatIds()
                : List.of(0L);

        for (Long seatId : seatIds) {
            String ticketCode = "TICK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            String qrPayload = String.format("eventhub://ticket/%s?event=%d&seat=%d", ticketCode, event.getEventId(), seatId);
            String qrBase64 = qrCodeService.generateQRCodeImageBase64(qrPayload);

            Ticket ticket = Ticket.builder()
                    .bookingId(event.getBookingId())
                    .userId(event.getUserId() != null ? event.getUserId() : 1L)
                    .eventId(event.getEventId() != null ? event.getEventId() : 1L)
                    .seatId(seatId)
                    .ticketCode(ticketCode)
                    .qrCodeData(qrBase64)
                    .status(TicketStatus.VALID)
                    .createdAt(LocalDateTime.now())
                    .build();

            generatedTickets.add(ticket);
        }

        List<Ticket> savedTickets = ticketRepository.saveAll(generatedTickets);
        log.info("Generated {} ticket(s) for booking ID: {}", savedTickets.size(), event.getBookingId());

        TicketGeneratedEvent ticketGeneratedEvent = TicketGeneratedEvent.builder()
                .bookingId(event.getBookingId())
                .userId(event.getUserId() != null ? event.getUserId() : 1L)
                .eventId(event.getEventId() != null ? event.getEventId() : 1L)
                .ticketIds(savedTickets.stream().map(Ticket::getId).toList())
                .ticketCodes(savedTickets.stream().map(Ticket::getTicketCode).toList())
                .build();

        kafkaTemplate.send("ticket-generated", String.valueOf(event.getBookingId()), ticketGeneratedEvent);
    }

    @Transactional
    public Ticket validateTicket(String ticketCode) {
        Ticket ticket = ticketRepository.findByTicketCode(ticketCode)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + ticketCode));

        String result;
        if (ticket.getStatus() == TicketStatus.VALID) {
            ticket.setStatus(TicketStatus.USED);
            ticketRepository.save(ticket);
            result = "SUCCESS";
        } else {
            result = "FAILED: " + ticket.getStatus().name();
        }

        TicketScan scan = TicketScan.builder()
                .ticket(ticket)
                .scannedAt(LocalDateTime.now())
                .scanResult(result)
                .build();

        ticketScanRepository.save(scan);
        return ticket;
    }
}