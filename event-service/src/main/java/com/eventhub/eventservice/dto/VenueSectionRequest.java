package com.eventhub.eventservice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VenueSectionRequest {
    @NotBlank(message = "Section name is required")
    private String name;

    @Min(value = 1, message = "Total rows must be at least 1")
    private Integer totalRows;

    @Min(value = 1, message = "Seats per row must be at least 1")
    private Integer seatsPerRow;
}