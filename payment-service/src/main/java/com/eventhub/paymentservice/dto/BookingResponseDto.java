package com.eventhub.paymentservice.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class BookingResponseDto {
    private Long id;
    private Long userId;
    private Long eventId;
    private List<BookingItemDto> items;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class BookingItemDto {
        private Long eventSeatId;
    }
}