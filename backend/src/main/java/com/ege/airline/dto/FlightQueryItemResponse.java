package com.ege.airline.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FlightQueryItemResponse {
    private Long id;
    private String flightNumber;
    private Integer duration;
    private Integer availableSeats;
    private String airportFrom;
    private String airportTo;
    private java.time.LocalDateTime departureDateTime;
    private java.time.LocalDateTime arrivalDateTime;
}