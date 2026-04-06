package com.ege.airline.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FileUploadResponse {
    private String transactionStatus;
    private int totalRecords;
    private int successfulRecords;
}