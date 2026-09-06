package com.eventhub.eventservice.repository;

import com.eventhub.eventservice.entity.EventSeat;
import com.eventhub.eventservice.entity.SeatStatus;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventSeatRepository extends JpaRepository<EventSeat, Long> {
    List<EventSeat> findByEventId(Long eventId);
    List<EventSeat> findByEventIdAndStatus(Long eventId, SeatStatus status);
    List<EventSeat> findByEventIdAndVenueSectionId(Long eventId, Long venueSectionId);
    @Modifying
    @Transactional
    @Query("DELETE FROM EventSeat es WHERE es.eventId = :eventId")
    void deleteByEventId(@Param("eventId") Long eventId);
}