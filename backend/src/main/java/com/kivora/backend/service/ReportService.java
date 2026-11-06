// Receives AP requests still does the work filtering, search by vendor and calculating deposit, payment,s and balance
package com.kivora.backend.service;
import com.kivora.backend.model.Transaction;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import com.kivora.backend.model.FinancialSummary;

/**
 * Provides financial reporting and transaction search functionality.
 *
 * Supports date filtering, vendor searches, custom searches,
 * and financial summary calculations.
 */
@Service
public class ReportService {

    private final TransactionService transactionService;

    /**
     * Creates the report service using the transaction service.
     *
     * @param transactionService provides access to saved transactions
     */
    public ReportService(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    /**
     * Retrieves transactions within the specified date range,
     * including the start and end dates.
     *
     * @param startDate the beginning of the date range
     * @param endDate the end of the date range
     * @return transactions within the specified dates
     */
    public ArrayList<Transaction> getTransactionsByDateRange(
            LocalDate startDate,
            LocalDate endDate) {

        ArrayList<Transaction> transactions =
                transactionService.getTransactions();

        ArrayList<Transaction> results = new ArrayList<>();
        for (Transaction transaction : transactions) {
            LocalDate date = transaction.getDate();

            boolean afterStart = !date.isBefore(startDate);
            boolean beforeEnd = !date.isAfter(endDate);

            if (afterStart && beforeEnd) {
                results.add(transaction);
            }
        }

        return results;
    }
    /**
     * Searches transactions by vendor name, ignoring case.
     *
     * @param vendorName the vendor name or partial name to search for
     * @return transactions matching the vendor name
     */
    public ArrayList<Transaction> searchByVendor(String vendorName) {
        ArrayList<Transaction> transactions =
                transactionService.getTransactions();

        ArrayList<Transaction> results = new ArrayList<>();

        for (Transaction transaction : transactions) {
            if (transaction.getVendor().toLowerCase()
                    .contains(vendorName.toLowerCase())) {

                results.add(transaction);
            }
        }

        return results;
    }

    /**
     * Searches transactions using optional filters.
     * Only non-null filters are applied.
     *
     * @param startDate the earliest transaction date, or null
     * @param endDate the latest transaction date, or null
     * @param description the description to search for, or null
     * @param vendor the vendor name to search for, or null
     * @param amount the exact transaction amount, or null
     * @return transactions matching all provided filters
     */
    public ArrayList<Transaction> customSearch(
            LocalDate startDate,
            LocalDate endDate,
            String description,
            String vendor,
            BigDecimal amount) {

        ArrayList<Transaction> results = new ArrayList<>();

        for (Transaction transaction : transactionService.getTransactions()) {

            if (startDate != null &&
                    transaction.getDate().isBefore(startDate)) {
                continue;
            }

            if (endDate != null &&
                    transaction.getDate().isAfter(endDate)) {
                continue;
            }
            if (description != null &&
                    !transaction.getDescription().toLowerCase()
                            .contains(description.toLowerCase())) {
                continue;
            }

            if (vendor != null &&
                    !transaction.getVendor().toLowerCase()
                            .contains(vendor.toLowerCase())) {
                continue;
            }
            if (amount != null &&
                    transaction.getAmount().compareTo(amount) != 0) {
                continue;
            }

            results.add(transaction);
        }

        return results;
    }

    /**
     * Calculates total deposits, total payments, and net balance.
     *
     * Positive amounts are deposits, while negative amounts
     * represent payments.
     *
     * @return a financial summary containing the calculated totals
     */
    public FinancialSummary calculateTotals() {
        ArrayList<Transaction> transactions =
                transactionService.getTransactions();

        BigDecimal totalDeposits = BigDecimal.ZERO;
        BigDecimal totalPayments = BigDecimal.ZERO;

        for (Transaction transaction : transactions) {

            BigDecimal amount = transaction.getAmount();
            if (amount.compareTo(BigDecimal.ZERO) > 0) {
                totalDeposits = totalDeposits.add(amount);
            }

            else if (amount.compareTo(BigDecimal.ZERO) < 0) {
                totalPayments = totalPayments.add(amount.abs());
            }
        }
        BigDecimal netBalance =
                totalDeposits.subtract(totalPayments);

        return new FinancialSummary(
                totalDeposits,
                totalPayments,
                netBalance
        );
    }
}
