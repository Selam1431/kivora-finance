
package com.kivora.backend.service;

import com.kivora.backend.model.Transaction;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;

// spring auto discover this class
@Service
public class TransactionService {

    // Store transactions in memory
    private final ArrayList<Transaction> transactions;

    // Use a separate CSV file for the backend
    private static final String FILE_PATH = "backend-transactions.csv";

    // Constructor
    public TransactionService() {
        transactions = new ArrayList<>();
        loadTransactions();
    }

    // Add a new transaction
    public void addTransaction(Transaction transaction) {

        // Save the transaction first
        boolean saved = saveTransaction(transaction);

        // Only add it to memory if saving succeeded
        if (saved) {
            transactions.add(transaction);
            System.out.println("Transaction added successfully");
        } else {
            throw new IllegalStateException("Transaction could not be saved.");
        }
    }

    // Save a transaction to CSV
    public boolean saveTransaction(Transaction transaction) {

        try (BufferedWriter writer =
                     new BufferedWriter(new FileWriter(FILE_PATH, true))) {

            String line = transaction.getDate() + "|" +
                    transaction.getTime() + "|" +
                    transaction.getDescription() + "|" +
                    transaction.getVendor() + "|" +
                    transaction.getAmount();

            writer.write(line);
            writer.newLine();

            return true;

        } catch (IOException e) {
            System.out.println("Error saving transaction: " + e.getMessage());
            return false;
        }
    }

    // Load saved transactions from CSV
    public void loadTransactions() {

        transactions.clear();

        try (BufferedReader reader =
                     new BufferedReader(new FileReader(FILE_PATH))) {

            String line;

            while ((line = reader.readLine()) != null) {

                // Skip CSV header if present
                if (line.toLowerCase().startsWith("date|time")) {
                    continue;
                }

                // Split using the pipe character
                String[] parts = line.split("\\|", -1);

                if (parts.length != 5) {
                    System.out.println("Skipping invalid transaction.");
                    continue;
                }

                try {
                    LocalDate date = LocalDate.parse(parts[0]);
                    LocalTime time = LocalTime.parse(parts[1]);
                    String description = parts[2];
                    String vendor = parts[3];
                    BigDecimal amount = new BigDecimal(parts[4]);

                    Transaction transaction = new Transaction(
                            date, time, description, vendor, amount
                    );

                    transactions.add(transaction);

                } catch (RuntimeException e) {
                    System.out.println("Skipping invalid transaction: " + line);
                }
            }

        } catch (java.io.FileNotFoundException e) {
            // Normal on first run when no CSV file exists yet
            System.out.println("No saved transactions yet.");

        } catch (IOException e) {
            System.out.println("Error loading transactions: " + e.getMessage());
        }
    }

    // Return a copy of stored transactions
    public ArrayList<Transaction> getTransactions() {
        return new ArrayList<>(transactions);
    }
}
