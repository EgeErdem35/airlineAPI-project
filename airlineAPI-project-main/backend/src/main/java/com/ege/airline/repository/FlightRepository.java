package com.ege.airline.repository;

import com.ege.airline.entity.Flight;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface FlightRepository extends JpaRepository<Flight, Long> {

    List<Flight> findByAirportFromIgnoreCaseAndAirportToIgnoreCase(String airportFrom, String airportTo);

    List<Flight> findByAirportFromIgnoreCase(String airportFrom);

    List<Flight> findByAirportToIgnoreCase(String airportTo);

    Page<Flight> findByDepartureDateTimeBetweenAndAirportFromIgnoreCaseAndAirportToIgnoreCaseAndAvailableSeatsGreaterThanEqual(
            LocalDateTime dateFrom,
            LocalDateTime dateTo,
            String airportFrom,
            String airportTo,
            Integer availableSeats,
            Pageable pageable
    );

    Optional<Flight> findByFlightNumberAndDepartureDateTimeBetween(
            String flightNumber,
            LocalDateTime startOfDay,
            LocalDateTime endOfDay
    );

    boolean existsByFlightNumberIgnoreCaseAndDepartureDateTime(String flightNumber, LocalDateTime departureDateTime);
}
