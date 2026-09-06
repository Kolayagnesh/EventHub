package com.eventhub.eventservice.service;

import com.eventhub.eventservice.dto.CreateEventRequest;
import com.eventhub.eventservice.dto.CreateVenueRequest;
import com.eventhub.eventservice.entity.*;
import com.eventhub.eventservice.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final VenueRepository venueRepository;
    private final VenueSectionRepository venueSectionRepository;
    private final EventSeatRepository eventSeatRepository;

    @Transactional
    public Venue createVenue(CreateVenueRequest request) {
        Venue venue = Venue.builder()
                .name(request.getName())
                .city(request.getCity())
                .address(request.getAddress())
                .totalCapacity(request.getTotalCapacity())
                .build();

        List<VenueSection> sections = request.getSections().stream().map(secReq -> VenueSection.builder()
                .venue(venue)
                .name(secReq.getName())
                .totalRows(secReq.getTotalRows())
                .seatsPerRow(secReq.getSeatsPerRow())
                .build()
        ).toList();

        venue.setSections(sections);
        return venueRepository.save(venue);
    }

    public List<Venue> getAllVenues() {
        return venueRepository.findAll();
    }

    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    public Event getEventById(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found with ID: " + id));
    }

    @Transactional
    public Event createEventWithSeats(CreateEventRequest request) {
        Venue venue = venueRepository.findById(request.getVenueId())
                .orElseThrow(() -> new RuntimeException("Venue not found with ID: " + request.getVenueId()));

        Event event = Event.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .venue(venue)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .build();

        Event savedEvent = eventRepository.save(event);

        // Fetch physical template geometry
        List<VenueSection> sections = venueSectionRepository.findByVenueId(venue.getId());
        List<EventSeat> eventSeats = new ArrayList<>();

        for (VenueSection section : sections) {
            BigDecimal price = (request.getSectionPricing() != null && request.getSectionPricing().containsKey(section.getName()))
                    ? request.getSectionPricing().get(section.getName())
                    : BigDecimal.valueOf(1000.00); // Default fallback price

            for (int r = 1; r <= section.getTotalRows(); r++) {
                String rowLabel = String.valueOf((char) ('A' + r - 1));

                for (int s = 1; s <= section.getSeatsPerRow(); s++) {
                    eventSeats.add(EventSeat.builder()
                            .eventId(savedEvent.getId())
                            .venueSectionId(section.getId())
                            .rowLabel(rowLabel)
                            .seatNumber(s)
                            .fullSeatCode(section.getName() + "-" + rowLabel + s)
                            .price(price)
                            .status(SeatStatus.AVAILABLE)
                            .build());
                }
            }
        }

        eventSeatRepository.saveAll(eventSeats);
        return savedEvent;
    }

    public List<EventSeat> getSeatsForEvent(Long eventId) {
        return eventSeatRepository.findByEventId(eventId);
    }

    public List<EventSeat> getAvailableSeatsForEvent(Long eventId) {
        return eventSeatRepository.findByEventIdAndStatus(eventId, SeatStatus.AVAILABLE);
    }
}