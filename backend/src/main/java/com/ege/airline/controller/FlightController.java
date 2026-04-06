package com.ege.airline.controller;

import com.ege.airline.dto.*;
import com.ege.airline.service.FlightService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/v1/flights")
@RequiredArgsConstructor
// ÖNEMLİ: Gateway kullandığımız için buradaki @CrossOrigin kaldırıldı. 
// İzinleri artık sadece Gateway projesindeki application.properties yönetiyor.
public class FlightController {

    private final FlightService flightService;

    @Operation(summary = "Add a new flight", description = "Creates a new flight. Authentication is required.")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FlightResponse addFlight(@Valid @RequestBody FlightCreateRequest request) {
        return flightService.addFlight(request);
    }

    @Operation(summary = "Get all flights")
    @GetMapping
    public List<FlightResponse> getAllFlights() {
        return flightService.getAllFlights();
    }

    @Operation(summary = "Get flight by ID")
    @GetMapping("/{id}")
    public FlightResponse getFlightById(@PathVariable Long id) {
        return flightService.getFlightById(id);
    }

    @Operation(summary = "Delete flight by ID")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteFlight(@PathVariable Long id) {
        flightService.deleteFlight(id);
    }

    @Operation(summary = "Update flight by ID")
    @PutMapping("/{id}")
    public FlightResponse updateFlight(@PathVariable Long id, @Valid @RequestBody FlightUpdateRequest request) {
        return flightService.updateFlight(id, request);
    }

    @Operation(summary = "Search flights")
    @GetMapping("/search")
    public List<FlightResponse> searchFlights(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        return flightService.searchFlights(from, to);
    }

    @Operation(summary = "Query flights", description = "Queries flights by date, airports, etc.")
    @GetMapping("/query")
    public FlightQueryResultResponse queryFlights(
            // @DateTimeFormat notasyonu 500 hatalarını çözen en kritik kısımdır.
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) String dateFrom,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) String dateTo,
            @RequestParam String airportFrom,
            @RequestParam String airportTo,
            @RequestParam(defaultValue = "1") Integer numberOfPeople,
            @RequestParam(defaultValue = "ONE_WAY") String tripType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request
    ) {
        return flightService.queryFlights(
                dateFrom, dateTo, airportFrom, airportTo,
                numberOfPeople, tripType, page, size
        );
    }

    @Operation(summary = "Buy ticket")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/tickets")
    public TicketPurchaseResponse buyTicket(@Valid @RequestBody TicketPurchaseRequest request) {
        return flightService.buyTicket(request);
    }

    @Operation(summary = "Check in")
    @PostMapping("/check-in")
    public CheckInResponse checkIn(@Valid @RequestBody CheckInRequest request) {
        return flightService.checkIn(request);
    }

    @Operation(summary = "Get flight passenger list")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/passengers")
    public PagedResponse<PassengerListResponse> getFlightPassengerList(
            @RequestParam String flightNumber,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) String date,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return flightService.getFlightPassengerList(flightNumber, date, page, size);
    }

    @Operation(summary = "Upload flights by file")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/upload")
    public FileUploadResponse addFlightsByFile(
            @Parameter(description = "CSV file containing flight data", required = true,
                    content = @Content(mediaType = "multipart/form-data",
                            schema = @Schema(type = "string", format = "binary"))
            )
            @RequestParam("file") MultipartFile file) {
        return flightService.addFlightsByFile(file);
    }
}