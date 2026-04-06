package com.ege.airline.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.security")
public class SecurityProperties {

    private String adminUsername = "admin";
    private String adminPassword = "admin123";
    private String jwtSecret = "change-this-secret-key-change-this-secret-key";
    private long jwtExpirationMs = 86_400_000;
}
