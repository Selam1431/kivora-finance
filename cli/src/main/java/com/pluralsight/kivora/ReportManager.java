
package com.pluralsight.kivora;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;

public class ReportManager {

    // TransactionManager gives us access to saved transactions
    private TransactionManager manager;

    // Constructor receives the existing TransactionManager
    public ReportManager(TransactionManager manager) {
        this.manager = manager;
    }

    // Return transactions between two dates (inclusive)
    public ArrayList<Transaction> getTransactionsByDateRange(
            LocalDate startDate,
            LocalDate endDate) {

        // Get all transactions from TransactionManager
        ArrayList<Transaction> transactions = manager.getTransactions();

        // Create a new list for matching transactions
        ArrayList<Transaction> results = new ArrayList<>();

        // Check each transaction
        for (Transaction transaction : transactions) {

            LocalDate date = transaction.getDate();

            // Check if date is on or after the start date
            boolean afterStart = !date.isBefore(startDate);

            // Check if date is on or before the end date
            boolean beforeEnd = !date.isAfter(endDate);

            // Add only transactions within the date range
            if (afterStart && beforeEnd) {
                results.add(transaction);
            }
        }

        return results;
    }

    // Find transactions matching a vendor name
    public ArrayList<Transaction> searchByVendor(String vendorName) {

        // Get all transactions
        ArrayList<Transaction> transactions = manager.getTransactions();

        // Store matching transactions
        ArrayList<Transaction> results = new ArrayList<>();

        // Check each transaction
        for (Transaction transaction : transactions) {

            // Compare vendor names without worrying about capitalization
            if (transaction.getVendor().toLowerCase()
                    .contains(vendorName.toLowerCase())) {

                results.add(transaction);
            }
        }

        return results;
    }

    // Search transactions using optional filters
    public ArrayList<Transaction> customSearch(
            LocalDate startDate,
            LocalDate endDate,
            String description,
            String vendor,
            BigDecimal amount) {

        // Store transactions that match every supplied filter
        ArrayList<Transaction> results = new ArrayList<>();

        // Check all saved transactions
        for (Transaction transaction : manager.getTransactions()) {

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

            // Skip transactions with a different description
            if (!transaction.getDescription().toLowerCase()
                    .contains(description.toLowerCase())) {
                continue;
            }

            // Skip transactions with a different vendor
            if (!transaction.getVendor().toLowerCase()
                    .contains(vendor.toLowerCase())) {
                continue;
            }

            // Skip transactions with a different amount
            if (amount != null &&
                    transaction.getAmount().compareTo(amount) != 0) {
                continue;
            }

            // This transaction matches all provided filters
            results.add(transaction);
        }

        return results;
    }


    public void calculateTotals(ArrayList<Transaction> transactions) {
        // store total money coming in
        BigDecimal totalDeposits = BigDecimal.ZERO;

        // store total money going out
        BigDecimal totalPayments = BigDecimal.ZERO;

        // go through every transaction
        for (Transaction transaction : transactions) {

            BigDecimal amount = transaction.getAmount();

            // Positive amounts are deposits
            if (amount.compareTo(BigDecimal.ZERO) > 0) {
                totalDeposits = totalDeposits.add(amount);
            }

            // Negative amounts are payments
            else if (amount.compareTo(BigDecimal.ZERO) < 0) {
                totalPayments = totalPayments.add(amount.abs());
            }
        }

        // Calculate the remaining balance
        BigDecimal netBalance = totalDeposits.subtract(totalPayments);

        // Display the summary
        System.out.println("\n========== FINANCIAL SUMMARY ==========");
        System.out.println("Total Deposits: $" + totalDeposits);
        System.out.println("Total Payments: $" + totalPayments);
        System.out.println("Net Balance:    $" + netBalance);
    }

}
