package com.ege.airlineapigateway.ratelimit;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class QueryRateLimitService {

    private static final int DAILY_LIMIT = 3;

    private final Map<String, Integer> requestCounts = new ConcurrentHashMap<>();
    private LocalDate currentDate = LocalDate.now();

    public boolean isAllowed(String clientKey) {
        resetIfNewDay();

        requestCounts.putIfAbsent(clientKey, 0);
        int currentCount = requestCounts.get(clientKey);

        if (currentCount >= DAILY_LIMIT) {
            return false;
        }

        requestCounts.put(clientKey, currentCount + 1);
        return true;
    }

    private void resetIfNewDay() {
        LocalDate today = LocalDate.now();
        if (!today.equals(currentDate)) {
            requestCounts.clear();
            currentDate = today;
        }
    }
}