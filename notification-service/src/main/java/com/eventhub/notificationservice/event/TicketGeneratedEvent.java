package com.eventhub.notificationservice.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketGeneratedEvent {
    private Long bookingId;
    private Long userId;
    private String email;
    private Long eventId;
    private List<Long> ticketIds;
    private List<String> ticketCodes;
}