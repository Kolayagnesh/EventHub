package com.eventhub.ticketservice.repository;

import com.eventhub.ticketservice.entity.TicketScan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketScanRepository extends JpaRepository<TicketScan, Long> {}