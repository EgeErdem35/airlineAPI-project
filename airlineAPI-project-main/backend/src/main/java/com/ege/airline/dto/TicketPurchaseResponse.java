package com.ege.airline.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TicketPurchaseResponse {
    private String transactionStatus;
    private String ticketNumber;
}