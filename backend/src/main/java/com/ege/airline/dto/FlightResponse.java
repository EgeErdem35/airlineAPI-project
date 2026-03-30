package com.ege.airline.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class FlightResponse {

    private Long id;
    private String flightNumber;
    private LocalDateTime departureDateTime;
    private LocalDateTime arrivalDateTime;
    private String airportFrom;
    private String airportTo;
    private Integer duration;
    private Integer capacity;
    private Integer availableSeats;
}