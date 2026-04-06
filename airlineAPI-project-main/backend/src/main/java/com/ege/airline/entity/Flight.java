package com.ege.airline.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "flights")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Flight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String flightNumber;

    @Column(nullable = false)
    private LocalDateTime departureDateTime;

    @Column(nullable = false)
    private LocalDateTime arrivalDateTime;

    @Column(nullable = false)
    private String airportFrom;

    @Column(nullable = false)
    private String airportTo;

    @Column(nullable = false)
    private Integer duration;

    @Column(nullable = false)
    private Integer capacity;

    @Column(nullable = false)
    private Integer availableSeats;
}