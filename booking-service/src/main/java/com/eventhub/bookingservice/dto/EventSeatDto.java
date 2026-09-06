package com.eventhub.bookingservice.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class EventSeatDto {
    private Long id;
    private Long eventId;
    private Long venueSectionId;
    private String rowLabel;
    private Integer seatNumber;
    private String fullSeatCode;
    private BigDecimal price;
    private String status;
}