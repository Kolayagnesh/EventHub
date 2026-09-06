package com.eventhub.eventservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Data
public class CreateEventRequest {
    @NotBlank(message = "Event title is required")
    private String title;

    private String description;

    @NotNull(message = "Venue ID is required")
    private Long venueId;

    @NotNull(message = "Start time is required")
    private LocalDateTime startTime;

    @NotNull(message = "End time is required")
    private LocalDateTime endTime;

    // Maps Section Name -> Event-specific Price
    // Example: { "VIP Pavilion": 5000.00, "East Stand": 1200.00 }
    private Map<String, BigDecimal> sectionPricing;
}