package com.eventhub.ticketservice.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class PaymentCompletedEvent {
    private Long bookingId;
    private Long paymentId;
    private Long userId;
    private String userEmail;
    private Long eventId;
    private List<Long> seatIds;
    private BigDecimal amount;
    private String transactionId;
}