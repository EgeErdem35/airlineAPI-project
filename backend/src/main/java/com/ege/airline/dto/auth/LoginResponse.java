package com.ege.airline.dto.auth;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LoginResponse {
    private final String accessToken;
    private final String tokenType;
    private final long expiresIn;
}
