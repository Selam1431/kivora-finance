package com.kivora.backend.service;

import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class TransactionNotFoundException extends RuntimeException {
    // will handle transactions that can not be found by their ID
    public TransactionNotFoundException(UUID id) {
        super("Transaction not found: " + id);
    }
}
