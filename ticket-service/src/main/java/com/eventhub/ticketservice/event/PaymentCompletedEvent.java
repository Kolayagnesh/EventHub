package com.eventhub.ticketservice.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentCompletedEvent {
    private Long bookingId;
    private Long paymentId;
    private Long userId;
    private Long eventId;
    private List<Long> seatIds;
    private BigDecimal amount;
    private String transactionId;
}