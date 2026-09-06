package com.eventhub.eventservice.scheduler;

import com.eventhub.eventservice.entity.Event;
import com.eventhub.eventservice.repository.EventRepository;
import com.eventhub.eventservice.repository.EventSeatRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class EventSeatCleanupScheduler {

    private final EventRepository eventRepository;
    private final EventSeatRepository eventSeatRepository;

    // Runs periodically (e.g., every 60 seconds)
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void cleanupSeatsForStartedOrCompletedEvents() {
        LocalDateTime now = LocalDateTime.now();

        // Target events that have already started (or use findByEndTimeBefore(now) if you want after completion)
        List<Event> targetEvents = eventRepository.findByStartTimeBefore(now);

        for (Event event : targetEvents) {
            // Delete only this event's seat rows from event_seats
            eventSeatRepository.deleteByEventId(event.getId());
            log.info("Purged seat records for event ID: {} ({})", event.getId(), event.getTitle());
        }
    }
}