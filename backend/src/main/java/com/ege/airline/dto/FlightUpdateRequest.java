package com.ege.airline.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FlightUpdateRequest {

    @NotBlank(message = "Flight number is required")
    private String flightNumber;

    @NotNull(message = "Departure date time is required")
    private LocalDateTime departureDateTime;

    @NotNull(message = "Arrival date time is required")
    private LocalDateTime arrivalDateTime;

    @NotBlank(message = "Departure airport is required")
    private String airportFrom;

    @NotBlank(message = "Arrival airport is required")
    private String airportTo;

    @NotNull(message = "Duration is required")
    @Min(value = 1, message = "Duration must be at least 1 minute")
    private Integer duration;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;
}