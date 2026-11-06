// how react communicate with spring boot backend
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import java.util.List;
import java.util.UUID;
import com.kivora.backend.service.TransactionNotFoundException;
/**
 * Exposes REST API endpoints for managing financial transactions.
 *
 * Handles HTTP requests from clients and delegates transaction
 * operations to TransactionService.
 */
@RestController
@RequestMapping("/api/transactions")
public class TransactionController {
    private final TransactionService transactionService;

    /**
     * Creates the controller with the transaction service.
     *
     * @param transactionService service responsible for transaction operations
     */
    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    /**
     * Retrieves all saved financial transactions.
     *
     * @return a list of transactions
     */
    @GetMapping
    public List<Transaction> getAllTransactions() {
        return transactionService.getTransactions();
    }

    /**
     * Creates and saves a new financial transaction.
     *
     * @param transaction the transaction data received from the client
     * @return the saved transaction with its generated ID
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Transaction addTransaction(@Valid @RequestBody Transaction transaction) {
        return transactionService.addTransaction(transaction);
    }

    /**
     * Updates an existing transaction using its unique ID.
     *
     * @param id the ID of the transaction to update
     * @param transaction the updated transaction details
     * @return the updated transaction
     * @throws TransactionNotFoundException if the transaction does not exist
     */
    @PutMapping("/{id}")
    public Transaction updateTransaction(@PathVariable UUID id,
                                         @Valid @RequestBody Transaction transaction) {
        return transactionService.updateTransaction(id, transaction);
    }

    /**
     * Deletes a transaction using its unique ID.
     *
     * @param id the ID of the transaction to delete
     * @throws TransactionNotFoundException if the transaction does not exist
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTransaction(@PathVariable UUID id) {
        transactionService.deleteTransaction(id);
    }

}
