package com.pluralsight.kivora;
import java.util.ArrayList;
import java.io.BufferedWriter;
import java.io.FileWriter; // opens a file for writing
import java.io.IOException;
import java.io.BufferedReader;
import java.io.FileReader; // opens file for reading
import java.math.BigDecimal; // represent money accurately
import java.time.LocalDate; // store the transaction date
import java.time.LocalTime; // stores the transaction time




public class TransactionManager {

    //store all transaction in memory, instance variable
    private ArrayList<Transaction> transactions;

    // constructor
    public TransactionManager() {
        // create an empty ArrayList
        transactions = new ArrayList<>();

        // load previously saved transactions
        loadTransactions();

    }

    // add a new transaction
    public void addTransaction(Transaction transaction) {
        // save the transaction first
        boolean saved = saveTransaction(transaction);

        // only add to the list if saving succeeded
        if (saved) {
            transactions.add(transaction);
            System.out.println(" Transaction added successfully");
        } else {
            System.out.println(" Transaction could not be saved.");
        }
    }

    // save/ write  a transaction to transactions.csv
    public boolean saveTransaction(Transaction transaction) {
        // true will not overwrite the existing file
        try (BufferedWriter writer= new BufferedWriter(new FileWriter("transactions.csv", true))) {

            // convert the transaction into required format
            String line = transaction.getDate() + "|" +
                    transaction.getTime() + "|" +
                    transaction.getDescription() + "|" +
                    transaction.getVendor() + "|" +
                    transaction.getAmount();

            // write the transaction to the file
            writer.write(line);

            // move to the next line
            writer.newLine();

            // return true if saving succeeds
            return true;

        } catch (IOException e) {
            System.out.println(" Error saving transaction: " + e.getMessage());

            // return false if saving fails
            return false;
        }
    }

    // load/ read saved transactions from csv file
    public void loadTransactions() {

        // clear existing transaction to avoid duplication
        transactions.clear();

        try (BufferedReader reader =  new BufferedReader(new FileReader("transactions.csv"))) {

            String line;

            // read each transaction util the end of the file
            while ((line = reader.readLine()) != null) {

                // skip the header if it exists
                if (line.toLowerCase().startsWith("date|time")) {
                    continue;
                }

                // separate the fields using the pipe character
                String[] parts = line.split("\\|", -1);

                // check that row has exactly 5 fields

                if (parts.length != 5) {
                    System.out.println(" Skipping invalid transaction.");
                    continue;
                }

                // convert string into the correct java types
                try {
                    LocalDate date = LocalDate.parse(parts[0]);
                    LocalTime time = LocalTime.parse(parts[1]);
                    String description = parts[2];
                    String vendor = parts[3];
                    BigDecimal amount = new BigDecimal(parts[4]);

                    // create a transaction objects
                    Transaction transaction = new Transaction(date, time, description, vendor, amount);

                    // add the loaded transaction to our arraylist store it in memory

                    transactions.add(transaction);
                } catch (RuntimeException e) {
                    System.out.println("Skipping invalid transaction: " + line);
                }
            }
        } catch (IOException e) {
            System.out.println("Error loading transactions: " + e.getMessage());
        }
    }
    // return a copy of all stored transactions
    public ArrayList<Transaction> getTransactions() {
        return new ArrayList<>(transactions);
    }
}
