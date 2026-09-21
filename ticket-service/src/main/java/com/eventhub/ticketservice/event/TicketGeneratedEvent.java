package com.eventhub.ticketservice.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class TicketGeneratedEvent {
    private Long bookingId;
    private Long userId;
    private String userEmail;
    private Long eventId;
    private List<Long> ticketIds;
    private List<String> ticketCodes;
}