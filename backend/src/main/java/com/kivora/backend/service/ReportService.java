// Receives AP requests still does the work filtering, search by vendor and calculating deposit, payment,s and balance
package com.kivora.backend.service;
import com.kivora.backend.model.Transaction;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import com.kivora.backend.model.FinancialSummary;

@Service
public class ReportService {

    private final TransactionService transactionService;

    // Spring Boot provides existing TransactionService
    public ReportService(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    public ArrayList<Transaction> getTransactionsByDateRange(
            LocalDate startDate,
            LocalDate endDate) {

        // we retrieve all saved transactions
        ArrayList<Transaction> transactions =
                transactionService.getTransactions();

        // Storing match transactions
        ArrayList<Transaction> results = new ArrayList<>();

        for (Transaction transaction : transactions) {

            LocalDate date = transaction.getDate();

            // inclusive data range
            // we check the date is on or after
            boolean afterStart = !date.isBefore(startDate);

            // we check the date is on or before
            boolean beforeEnd = !date.isAfter(endDate);

            // add transaction if both conditions are true
            if (afterStart && beforeEnd) {
                results.add(transaction);
            }
        }

        return results;
    }

    public ArrayList<Transaction> searchByVendor(String vendorName) {
        ArrayList<Transaction> transactions =
                transactionService.getTransactions();

        // Store matching transactions
        ArrayList<Transaction> results = new ArrayList<>();

        // Check each transaction / enhance loop through
        for (Transaction transaction : transactions) {
            // Compare vendor names without case sensitivity
            if (transaction.getVendor().toLowerCase()
                    .contains(vendorName.toLowerCase())) {

                results.add(transaction);
            }
        }

        return results;
    }

    public ArrayList<Transaction> customSearch(
            LocalDate startDate,
            LocalDate endDate,
            String description,
            String vendor,
            BigDecimal amount) {

        // Store transactions matching all supplied filters
        ArrayList<Transaction> results = new ArrayList<>();

        for (Transaction transaction : transactionService.getTransactions()) {

            // Skip transactions before the start date
            if (startDate != null &&
                    transaction.getDate().isBefore(startDate)) {
                continue;
            }

            // Skip transactions after the end date
            if (endDate != null &&
                    transaction.getDate().isAfter(endDate)) {
                continue;
            }
            if (description != null &&
                    !transaction.getDescription().toLowerCase()
                            .contains(description.toLowerCase())) {
                continue;
            }

            // Check vendor only when provided
            if (vendor != null &&
                    !transaction.getVendor().toLowerCase()
                            .contains(vendor.toLowerCase())) {
                continue;
            }

            // Check amount only when provided
            if (amount != null &&
                    transaction.getAmount().compareTo(amount) != 0) {
                continue;
            }

            results.add(transaction);
        }

        return results;
    }

    public FinancialSummary calculateTotals() {

        ArrayList<Transaction> transactions =
                transactionService.getTransactions();

        BigDecimal totalDeposits = BigDecimal.ZERO;
        BigDecimal totalPayments = BigDecimal.ZERO;

        for (Transaction transaction : transactions) {

            BigDecimal amount = transaction.getAmount();

            // Positive amounts represent deposits
            if (amount.compareTo(BigDecimal.ZERO) > 0) {
                totalDeposits = totalDeposits.add(amount);
            }

            // Negative amounts represent payments
            else if (amount.compareTo(BigDecimal.ZERO) < 0) {
                totalPayments = totalPayments.add(amount.abs());
            }
        }

        // Remaining money = deposits - payments
        BigDecimal netBalance =
                totalDeposits.subtract(totalPayments);

        // Return the results as an object
        return new FinancialSummary(
                totalDeposits,
                totalPayments,
                netBalance
        );
    }
}
