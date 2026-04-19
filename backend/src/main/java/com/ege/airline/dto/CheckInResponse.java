package com.ege.airline.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CheckInResponse {
    private String transactionStatus;
    private String seatNumber;
    private String passengerName;
    private String flightNumber;
    private String date;
}