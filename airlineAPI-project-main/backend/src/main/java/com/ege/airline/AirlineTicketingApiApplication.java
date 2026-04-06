package com.ege.airline;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan(basePackages = "com.ege.airline.entity")
@EnableJpaRepositories(basePackages = "com.ege.airline.repository")
public class AirlineTicketingApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(AirlineTicketingApiApplication.class, args);
    }
}