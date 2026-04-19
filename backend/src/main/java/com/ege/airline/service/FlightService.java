package com.ege.airline.service;

import com.ege.airline.dto.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

public interface FlightService {
    FlightResponse addFlight(FlightCreateRequest request);
    List<FlightResponse> getAllFlights();
    FlightResponse getFlightById(Long id);
    void deleteFlight(Long id);
    FlightResponse updateFlight(Long id, FlightUpdateRequest request);
    List<FlightResponse> searchFlights(String from, String to);

    FlightQueryResultResponse queryFlights(
            LocalDate dateFrom,
            LocalDate dateTo,
            LocalDate returnDateFrom,
            LocalDate returnDateTo,
            String airportFrom,
            String airportTo,
            Integer numberOfPeople,
            String tripType,
            int page,
            int size
    );

    TicketPurchaseResponse buyTicket(TicketPurchaseRequest request);

    CheckInResponse checkIn(CheckInRequest request);

    PagedResponse<PassengerListResponse> getFlightPassengerList(
            String flightNumber,
            String date,
            int page,
            int size
    );

    FileUploadResponse addFlightsByFile(MultipartFile file);
}