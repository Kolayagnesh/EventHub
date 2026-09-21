package com.eventhub.eventservice.controller;

import com.eventhub.eventservice.dto.CreateEventRequest;
import com.eventhub.eventservice.dto.CreateVenueRequest;
import com.eventhub.eventservice.entity.Event;
import com.eventhub.eventservice.entity.EventSeat;
import com.eventhub.eventservice.entity.SeatStatus;
import com.eventhub.eventservice.entity.Venue;
import com.eventhub.eventservice.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    // --- VENUE BLUEPRINTS ---
    @PostMapping("/venues")
    public ResponseEntity<Venue> createVenue(@Valid @RequestBody CreateVenueRequest request) {
        return new ResponseEntity<>(eventService.createVenue(request), HttpStatus.CREATED);
    }

    @GetMapping("/venues")
    public ResponseEntity<List<Venue>> getAllVenues() {
        return ResponseEntity.ok(eventService.getAllVenues());
    }

    // --- SCHEDULED EVENTS ---
    @PostMapping
    public ResponseEntity<Event> createEvent(@Valid @RequestBody CreateEventRequest request) {
        return new ResponseEntity<>(eventService.createEventWithSeats(request), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Event>> getAllEvents() {
        return ResponseEntity.ok(eventService.getAllEvents());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Event> getEventById(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.getEventById(id));
    }

    // --- BOOKABLE SEATS ---
    @GetMapping("/{eventId}/seats")
    public ResponseEntity<List<EventSeat>> getSeatsForEvent(@PathVariable Long eventId) {
        return ResponseEntity.ok(eventService.getSeatsForEvent(eventId));
    }

    @GetMapping("/{eventId}/seats/available")
    public ResponseEntity<List<EventSeat>> getAvailableSeats(@PathVariable Long eventId) {
        return ResponseEntity.ok(eventService.getAvailableSeatsForEvent(eventId));
    }

    @PutMapping("/{eventId}/seats/status")
    public ResponseEntity<Void> updateSeatsStatus(
            @PathVariable Long eventId,
            @RequestBody List<Long> seatIds,
            @RequestParam("status") SeatStatus status
    ) {
        eventService.updateSeatsStatus(eventId, seatIds, status);
        return ResponseEntity.ok().build();
    }
}