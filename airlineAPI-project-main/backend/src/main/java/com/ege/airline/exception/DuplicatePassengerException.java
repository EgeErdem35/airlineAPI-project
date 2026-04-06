package com.ege.airline.exception;

public class DuplicatePassengerException extends RuntimeException {
    public DuplicatePassengerException(String message) {
        super(message);
    }
}