package com.eventhub.paymentservice.event;

import com.fasterxml.jackson.annotation.JsonAlias;
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
public class PaymentFailedEvent {
    private Long bookingId;
    private Long userId;
    private Long eventId;
    private List<Long> seatIds;
    private String reason;

    @JsonAlias({"userEmail", "recipientEmail"})
    private String email;
}