package com.eventhub.eventservice.repository;

import com.eventhub.eventservice.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByVenueCityIgnoreCase(String city);

    // Fetch events where the event has already started
    List<Event> findByStartTimeBefore(LocalDateTime currentTime);

    // Alternatively, fetch events where the entire event is completed
    List<Event> findByEndTimeBefore(LocalDateTime currentTime);
}