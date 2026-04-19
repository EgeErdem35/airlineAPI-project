package com.ege.airlineapigateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class AirlineApiGatewayApplication {

    @Value("${BACKEND_URI:http://localhost:5000}")
    private String backendUri;

    @Value("${AGENT_URI:http://localhost:3001}")
    private String agentUri;

    public static void main(String[] args) {
        SpringApplication.run(AirlineApiGatewayApplication.class, args);
    }

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
            .route("flight-service", r -> r.path("/api/v1/flights/**").uri(backendUri))
            .route("auth-service", r -> r.path("/api/v1/auth/**").uri(backendUri))
            .route("health-check-route", r -> r.path("/").uri(backendUri))
            .route("agent-service", r -> r.path("/api/chat/**").uri(agentUri))
            .build();
    }

    // CORS engeline takılmamak için garantili, programatik CORS Filtresi
    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfig = new CorsConfiguration();
        corsConfig.addAllowedOriginPattern("*"); 
        corsConfig.addAllowedMethod("*"); 
        corsConfig.addAllowedHeader("*");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);
        return new CorsWebFilter(source);
    }
}