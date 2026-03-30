package com.ege.airline.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class TicketPurchaseRequest {

    @NotBlank(message = "Flight number is required")
    private String flightNumber;

    @NotNull(message = "Date is required")
    private LocalDate date;

    @NotEmpty(message = "Passenger names are required")
    private List<String> passengerNames;
}