package com.eventhub.ticketservice.controller;

import com.eventhub.ticketservice.entity.Ticket;
import com.eventhub.ticketservice.repository.TicketRepository;
import com.eventhub.ticketservice.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final TicketRepository ticketRepository;

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<Ticket>> getTicketsByBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(ticketRepository.findByBookingId(bookingId));
    }

    @PostMapping("/validate")
    public ResponseEntity<Ticket> validateTicket(@RequestParam String ticketCode) {
        return ResponseEntity.ok(ticketService.validateTicket(ticketCode));
    }
}