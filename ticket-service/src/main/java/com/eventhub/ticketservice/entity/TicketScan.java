package com.eventhub.ticketservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_scans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketScan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @Column(nullable = false)
    private LocalDateTime scannedAt;

    @Column(nullable = false)
    private String scanResult;
}