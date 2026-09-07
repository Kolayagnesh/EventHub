package com.eventhub.ticketservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketGeneratedEvent {
    private Long bookingId;
    private Long userId;
    private Long eventId;
    private List<Long> ticketIds;
    private List<String> ticketCodes;
}