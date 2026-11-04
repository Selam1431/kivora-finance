
package com.kivora.backend.controller;

import com.kivora.backend.model.Transaction;
import com.kivora.backend.service.TransactionService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@RestController // telling spring boot that this class handles http
@RequestMapping("/api/transactions") // define the base url
public class TransactionController {

    private final TransactionService transactionService;

    // Constructor injection: Spring provides the service
    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    // GET http://localhost:8080/api/transactions
    @GetMapping
    public List<Transaction> getAllTransactions() {
        return transactionService.getTransactions();
    }


    // POST /api/transactions
    // Receives a transaction from the client and saves it
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void addTransaction(@Valid @RequestBody Transaction transaction) {

        // Reuse the transaction-saving logic from  capstone
        transactionService.addTransaction(transaction);
    }

}
