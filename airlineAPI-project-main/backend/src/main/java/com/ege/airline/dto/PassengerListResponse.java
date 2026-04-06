package com.ege.airline.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PassengerListResponse {
    private String passengerName;
    private String seatNumber;
}