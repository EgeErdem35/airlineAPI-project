package com.ege.airline.service;

import com.ege.airline.dto.*;
import com.ege.airline.entity.Flight;
import com.ege.airline.entity.Passenger;
import com.ege.airline.entity.Ticket;
import com.ege.airline.entity.TicketStatus;
import com.ege.airline.exception.DuplicatePassengerException;
import com.ege.airline.exception.ResourceNotFoundException;
import com.ege.airline.repository.FlightRepository;
import com.ege.airline.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FlightServiceImpl implements FlightService {

    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int MAX_PAGE_SIZE = 10;

    private final FlightRepository flightRepository;
    private final TicketRepository ticketRepository;

    @Override
    @Transactional
    public FlightResponse addFlight(FlightCreateRequest request) {
        validateFlightTimes(request.getDepartureDateTime(), request.getArrivalDateTime());
        validateDuplicateFlight(request.getFlightNumber(), request.getDepartureDateTime(), null);

        Flight flight = Flight.builder()
                .flightNumber(request.getFlightNumber().trim())
                .departureDateTime(request.getDepartureDateTime())
                .arrivalDateTime(request.getArrivalDateTime())
                .airportFrom(request.getAirportFrom().trim())
                .airportTo(request.getAirportTo().trim())
                .duration(request.getDuration())
                .capacity(request.getCapacity())
                .availableSeats(request.getCapacity())
                .build();

        Flight savedFlight = flightRepository.save(flight);
        return mapToResponse(savedFlight);
    }

    @Override
    public List<FlightResponse> getAllFlights() {
        return flightRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public FlightResponse getFlightById(Long id) {
        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + id));
        return mapToResponse(flight);
    }

    @Override
    @Transactional
    public void deleteFlight(Long id) {
        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + id));
        flightRepository.delete(flight);
    }

    @Override
    @Transactional
    public FlightResponse updateFlight(Long id, FlightUpdateRequest request) {
        validateFlightTimes(request.getDepartureDateTime(), request.getArrivalDateTime());

        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + id));

        validateDuplicateFlight(request.getFlightNumber(), request.getDepartureDateTime(), id);

        int soldSeats = flight.getCapacity() - flight.getAvailableSeats();
        if (request.getCapacity() < soldSeats) {
            throw new IllegalArgumentException(
                    "Capacity cannot be smaller than sold seats. Minimum allowed capacity is " + soldSeats
            );
        }

        flight.setFlightNumber(request.getFlightNumber().trim());
        flight.setDepartureDateTime(request.getDepartureDateTime());
        flight.setArrivalDateTime(request.getArrivalDateTime());
        flight.setAirportFrom(request.getAirportFrom().trim());
        flight.setAirportTo(request.getAirportTo().trim());
        flight.setDuration(request.getDuration());
        flight.setCapacity(request.getCapacity());
        flight.setAvailableSeats(request.getCapacity() - soldSeats);

        Flight updatedFlight = flightRepository.save(flight);
        return mapToResponse(updatedFlight);
    }

    @Override
    public List<FlightResponse> searchFlights(String from, String to) {
        List<Flight> flights;

        if (from != null && !from.isBlank() && to != null && !to.isBlank()) {
            flights = flightRepository.findByAirportFromIgnoreCaseAndAirportToIgnoreCase(from.trim(), to.trim());
        } else if (from != null && !from.isBlank()) {
            flights = flightRepository.findByAirportFromIgnoreCase(from.trim());
        } else if (to != null && !to.isBlank()) {
            flights = flightRepository.findByAirportToIgnoreCase(to.trim());
        } else {
            flights = flightRepository.findAll();
        }

        return flights.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public FlightQueryResultResponse queryFlights(
            String dateFrom,
            String dateTo,
            String airportFrom,
            String airportTo,
            Integer numberOfPeople,
            String tripType,
            int page,
            int size
    ) {
        LocalDate parsedDateFrom = LocalDate.parse(dateFrom.trim());
        LocalDate parsedDateTo = LocalDate.parse(dateTo.trim());

        LocalDateTime fromDateTime = parsedDateFrom.atStartOfDay();
        LocalDateTime toDateTime = parsedDateTo.atTime(LocalTime.MAX);

        validateDateRange(fromDateTime, toDateTime);

        int normalizedPage = normalizePage(page);
        int normalizedSize = normalizeSize(size);
        Pageable pageable = PageRequest.of(normalizedPage, normalizedSize);

        String normalizedAirportFrom = airportFrom.trim();
        String normalizedAirportTo = airportTo.trim();
        String normalizedTripType = tripType.trim().replace("-", "_").toUpperCase();

        Page<Flight> outboundPage =
                flightRepository.findByDepartureDateTimeBetweenAndAirportFromIgnoreCaseAndAirportToIgnoreCaseAndAvailableSeatsGreaterThanEqual(
                        fromDateTime,
                        toDateTime,
                        normalizedAirportFrom,
                        normalizedAirportTo,
                        numberOfPeople,
                        pageable
                );

        PagedResponse<FlightQueryItemResponse> outboundFlights = buildFlightQueryPage(outboundPage);

        if (TripType.ROUND_TRIP.name().equals(normalizedTripType)) {
            Page<Flight> returnPage =
                    flightRepository.findByDepartureDateTimeBetweenAndAirportFromIgnoreCaseAndAirportToIgnoreCaseAndAvailableSeatsGreaterThanEqual(
                            fromDateTime,
                            toDateTime,
                            normalizedAirportTo,
                            normalizedAirportFrom,
                            numberOfPeople,
                            pageable
                    );

            return FlightQueryResultResponse.builder()
                    .outboundFlights(outboundFlights)
                    .returnFlights(buildFlightQueryPage(returnPage))
                    .tripType(TripType.ROUND_TRIP.name())
                    .build();
        }

        return FlightQueryResultResponse.builder()
                .outboundFlights(outboundFlights)
                .returnFlights(null)
                .tripType(TripType.ONE_WAY.name())
                .build();
    }

    @Override
    @Transactional
    public TicketPurchaseResponse buyTicket(TicketPurchaseRequest request) {
        LocalDateTime startOfDay = request.getDate().atStartOfDay();
        LocalDateTime endOfDay = request.getDate().atTime(LocalTime.MAX);

        Flight flight = flightRepository.findByFlightNumberAndDepartureDateTimeBetween(
                        request.getFlightNumber().trim(),
                        startOfDay,
                        endOfDay
                )
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Flight not found for flightNumber: " + request.getFlightNumber() + " and date: " + request.getDate()
                ));

        int requestedSeats = request.getPassengerNames().size();

        if (flight.getAvailableSeats() < requestedSeats) {
            return TicketPurchaseResponse.builder()
                    .transactionStatus("SOLD_OUT")
                    .ticketNumber(null)
                    .build();
        }

        List<Ticket> existingTickets = ticketRepository.findByFlightId(flight.getId());

        List<String> existingPassengerNames = existingTickets.stream()
                .flatMap(ticket -> ticket.getPassengers().stream())
                .map(passenger -> passenger.getFullName().trim().toLowerCase())
                .toList();

        List<String> duplicateNames = request.getPassengerNames().stream()
                .map(name -> name.trim().toLowerCase())
                .filter(existingPassengerNames::contains)
                .distinct()
                .toList();

        if (!duplicateNames.isEmpty()) {
            throw new DuplicatePassengerException(
                    "Passenger(s) already have ticket for this flight: " + String.join(", ", duplicateNames)
            );
        }

        List<Passenger> passengers = request.getPassengerNames().stream()
                .map(name -> Passenger.builder()
                        .fullName(name.trim())
                        .checkedIn(false)
                        .seatNumber(null)
                        .build())
                .collect(Collectors.toCollection(ArrayList::new));

        String generatedTicketNumber = "TCK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Ticket ticket = Ticket.builder()
                .ticketNumber(generatedTicketNumber)
                .flight(flight)
                .purchaseDate(LocalDateTime.now())
                .status(TicketStatus.SUCCESS)
                .passengers(passengers)
                .build();

        flight.setAvailableSeats(flight.getAvailableSeats() - requestedSeats);

        flightRepository.save(flight);
        ticketRepository.save(ticket);

        return TicketPurchaseResponse.builder()
                .transactionStatus("SUCCESS")
                .ticketNumber(generatedTicketNumber)
                .build();
    }

    @Override
    @Transactional
    public CheckInResponse checkIn(CheckInRequest request) {
        LocalDateTime startOfDay = request.getDate().atStartOfDay();
        LocalDateTime endOfDay = request.getDate().atTime(LocalTime.MAX);

        Flight flight = flightRepository.findByFlightNumberAndDepartureDateTimeBetween(
                        request.getFlightNumber().trim(),
                        startOfDay,
                        endOfDay
                )
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Flight not found for flightNumber: " + request.getFlightNumber() + " and date: " + request.getDate()
                ));

        List<Ticket> tickets = ticketRepository.findByFlightId(flight.getId());

        Ticket matchedTicket = tickets.stream()
                .filter(ticket -> ticket.getPassengers().stream()
                        .anyMatch(passenger -> passenger.getFullName().equalsIgnoreCase(request.getPassengerName().trim())))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Passenger not found on this flight: " + request.getPassengerName()
                ));

        Passenger matchedPassenger = matchedTicket.getPassengers().stream()
                .filter(passenger -> passenger.getFullName().equalsIgnoreCase(request.getPassengerName().trim()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Passenger not found on this flight: " + request.getPassengerName()
                ));

        if (matchedPassenger.isCheckedIn()) {
            return CheckInResponse.builder()
                    .transactionStatus("ALREADY_CHECKED_IN")
                    .seatNumber(matchedPassenger.getSeatNumber())
                    .build();
        }

        long checkedInCount = tickets.stream()
                .flatMap(ticket -> ticket.getPassengers().stream())
                .filter(Passenger::isCheckedIn)
                .count();

        String generatedSeatNumber = String.valueOf(checkedInCount + 1);

        matchedPassenger.setCheckedIn(true);
        matchedPassenger.setSeatNumber(generatedSeatNumber);

        ticketRepository.save(matchedTicket);

        return CheckInResponse.builder()
                .transactionStatus("SUCCESS")
                .seatNumber(generatedSeatNumber)
                .build();
    }

    @Override
    public PagedResponse<PassengerListResponse> getFlightPassengerList(
            String flightNumber,
            String date,
            int page,
            int size
    ) {
        LocalDateTime startOfDay = LocalDateTime.parse(date + "T00:00:00");
        LocalDateTime endOfDay = LocalDateTime.parse(date + "T23:59:59");

        Flight flight = flightRepository.findByFlightNumberAndDepartureDateTimeBetween(
                        flightNumber.trim(),
                        startOfDay,
                        endOfDay
                )
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Flight not found for flightNumber: " + flightNumber + " and date: " + date
                ));

        List<Ticket> tickets = ticketRepository.findByFlightId(flight.getId());

        List<PassengerListResponse> allPassengers = tickets.stream()
                .flatMap(ticket -> ticket.getPassengers().stream())
                .map(passenger -> PassengerListResponse.builder()
                        .passengerName(passenger.getFullName())
                        .seatNumber(passenger.getSeatNumber())
                        .build())
                .toList();

        int normalizedPage = normalizePage(page);
        int normalizedSize = normalizeSize(size);
        int start = normalizedPage * normalizedSize;
        int end = Math.min(start + normalizedSize, allPassengers.size());

        List<PassengerListResponse> pagedContent;
        if (start >= allPassengers.size()) {
            pagedContent = List.of();
        } else {
            pagedContent = allPassengers.subList(start, end);
        }

        int totalPages = allPassengers.isEmpty() ? 0 : (int) Math.ceil((double) allPassengers.size() / normalizedSize);

        return PagedResponse.<PassengerListResponse>builder()
                .content(pagedContent)
                .page(normalizedPage)
                .size(normalizedSize)
                .totalElements(allPassengers.size())
                .totalPages(totalPages)
                .last(totalPages == 0 || normalizedPage >= totalPages - 1)
                .build();
    }

    @Override
    @Transactional
    public FileUploadResponse addFlightsByFile(MultipartFile file) {
        int totalRecords = 0;
        int successfulRecords = 0;

        if (file == null || file.isEmpty()) {
            return FileUploadResponse.builder()
                    .transactionStatus("FAILED")
                    .totalRecords(0)
                    .successfulRecords(0)
                    .build();
        }

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            boolean isFirstLine = true;

            while ((line = reader.readLine()) != null) {
                if (isFirstLine) {
                    isFirstLine = false;
                    continue;
                }

                if (line.isBlank()) {
                    continue;
                }

                totalRecords++;

                try {
                    String[] parts = line.split(",");
                    if (parts.length < 7) {
                        continue;
                    }

                    LocalDateTime departureDateTime = LocalDateTime.parse(parts[1].trim());
                    LocalDateTime arrivalDateTime = LocalDateTime.parse(parts[2].trim());
                    validateFlightTimes(departureDateTime, arrivalDateTime);

                    String flightNumber = parts[0].trim();
                    if (flightRepository.existsByFlightNumberIgnoreCaseAndDepartureDateTime(flightNumber, departureDateTime)) {
                        continue;
                    }

                    Integer capacity = Integer.parseInt(parts[6].trim());

                    Flight flight = Flight.builder()
                            .flightNumber(flightNumber)
                            .departureDateTime(departureDateTime)
                            .arrivalDateTime(arrivalDateTime)
                            .airportFrom(parts[3].trim())
                            .airportTo(parts[4].trim())
                            .duration(Integer.parseInt(parts[5].trim()))
                            .capacity(capacity)
                            .availableSeats(capacity)
                            .build();

                    flightRepository.save(flight);
                    successfulRecords++;
                } catch (Exception ignored) {
                    // Keep processing remaining rows.
                }
            }

            String status = successfulRecords == 0
                    ? "FAILED"
                    : successfulRecords == totalRecords ? "SUCCESS" : "PARTIAL_SUCCESS";

            return FileUploadResponse.builder()
                    .transactionStatus(status)
                    .totalRecords(totalRecords)
                    .successfulRecords(successfulRecords)
                    .build();

        } catch (Exception e) {
            return FileUploadResponse.builder()
                    .transactionStatus("FAILED")
                    .totalRecords(totalRecords)
                    .successfulRecords(successfulRecords)
                    .build();
        }
    }

    private PagedResponse<FlightQueryItemResponse> buildFlightQueryPage(Page<Flight> flightPage) {
        return PagedResponse.<FlightQueryItemResponse>builder()
                .content(
                        flightPage.getContent().stream()
                                .map(flight -> FlightQueryItemResponse.builder()
                                        .id(flight.getId())
                                        .flightNumber(flight.getFlightNumber())
                                        .duration(flight.getDuration())
                                        .availableSeats(flight.getAvailableSeats())
                                        .build())
                                .toList()
                )
                .page(flightPage.getNumber())
                .size(flightPage.getSize())
                .totalElements(flightPage.getTotalElements())
                .totalPages(flightPage.getTotalPages())
                .last(flightPage.isLast())
                .build();
    }

    private void validateDuplicateFlight(String flightNumber, LocalDateTime departureDateTime, Long currentFlightId) {
        boolean duplicateExists = flightRepository.existsByFlightNumberIgnoreCaseAndDepartureDateTime(
                flightNumber.trim(),
                departureDateTime
        );

        if (!duplicateExists) {
            return;
        }

        if (currentFlightId != null) {
            Flight currentFlight = flightRepository.findById(currentFlightId)
                    .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + currentFlightId));

            boolean sameRecord = currentFlight.getFlightNumber().equalsIgnoreCase(flightNumber.trim())
                    && currentFlight.getDepartureDateTime().equals(departureDateTime);

            if (sameRecord) {
                return;
            }
        }

        throw new IllegalArgumentException(
                "A flight with the same flight number and departure date-time already exists."
        );
    }

    private void validateFlightTimes(LocalDateTime departureDateTime, LocalDateTime arrivalDateTime) {
        if (!arrivalDateTime.isAfter(departureDateTime)) {
            throw new IllegalArgumentException("Arrival date-time must be after departure date-time.");
        }
    }

    private void validateDateRange(LocalDateTime dateFrom, LocalDateTime dateTo) {
        if (dateTo.isBefore(dateFrom)) {
            throw new IllegalArgumentException("dateTo cannot be earlier than dateFrom.");
        }
    }

    private int normalizePage(int page) {
        return Math.max(page, 0);
    }

    private int normalizeSize(int size) {
        if (size <= 0) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(size, MAX_PAGE_SIZE);
    }

    private FlightResponse mapToResponse(Flight flight) {
        return FlightResponse.builder()
                .id(flight.getId())
                .flightNumber(flight.getFlightNumber())
                .departureDateTime(flight.getDepartureDateTime())
                .arrivalDateTime(flight.getArrivalDateTime())
                .airportFrom(flight.getAirportFrom())
                .airportTo(flight.getAirportTo())
                .duration(flight.getDuration())
                .capacity(flight.getCapacity())
                .availableSeats(flight.getAvailableSeats())
                .build();
    }
}