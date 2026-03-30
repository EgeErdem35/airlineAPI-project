package com.ege.airline.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FlightQueryResultResponse {
    private PagedResponse<FlightQueryItemResponse> outboundFlights;
    private PagedResponse<FlightQueryItemResponse> returnFlights;
    private String tripType;
}