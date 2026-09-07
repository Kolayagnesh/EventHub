package com.eventhub.ticketservice.repository;

import com.eventhub.ticketservice.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findByBookingId(Long bookingId);
    List<Ticket> findByUserId(Long userId);
    Optional<Ticket> findByTicketCode(String ticketCode);
}