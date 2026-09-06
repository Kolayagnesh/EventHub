package com.eventhub.eventservice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class CreateVenueRequest {
    @NotBlank(message = "Venue name is required")
    private String name;

    @NotBlank(message = "City is required")
    private String city;

    private String address;
    private Integer totalCapacity;

    @NotEmpty(message = "Venue must have at least one section")
    @Valid
    private List<VenueSectionRequest> sections;
}