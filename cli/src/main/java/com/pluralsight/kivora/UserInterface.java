
package com.pluralsight.kivora;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Scanner;

public class UserInterface {

    private final Scanner scanner = new Scanner(System.in);
    private final TransactionManager manager = new TransactionManager();
    private final ReportManager reportManager = new ReportManager(manager);


    // Display a menu and return the user's choice
    private String showMenu(String title, String[][] options) {
        ConsoleStyle.printHeader(title);

        for (String[] option : options) {
            ConsoleStyle.printOption(option[0], option[1]);
        }

        ConsoleStyle.printDivider();
        return ask("Enter your choice: ").toUpperCase();
    }

    // MAIN DASHBOARD
    public void displayHomeScreen() {
        String choice;

        do {
            choice = showMenu("MAIN DASHBOARD", new String[][]{
                    {"D", "Add Deposit"},
                    {"P", "Make Payment"},
                    {"L", "View Ledger"},
                    {"X", "Exit Kivora"}
            });

            switch (choice) {
                case "D" -> addTransaction(false);
                case "P" -> addTransaction(true);
                case "L" -> displayLedgerMenu();
                case "X" -> System.out.println("Thank you for using Kivora!");
                default -> System.out.println("Invalid choice.");
            }
        } while (!choice.equals("X"));
    }

    // Reusable method for deposits and payments
    private void addTransaction(boolean isPayment) {
        // simple use of if/else
        ConsoleStyle.printHeader(isPayment ? "MAKE PAYMENT" : "ADD DEPOSIT");

        String description = askRequired("Enter description: ");
        String vendor = askRequired("Enter vendor/source: ");

        BigDecimal amount;

        while (true) {
            try {
                amount = new BigDecimal(ask("Enter amount: $"));

                // reject zero or negative numbers
                if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                    System.out.println("Amount must be greater than zero.");
                    continue;
                }
                // reject more than two decimal places
                if (amount.stripTrailingZeros().scale() > 2) {
                    System.out.println("Use no more than two decimal places.");
                    continue;
                }
                amount = amount.setScale(2);

                break;
            } catch (NumberFormatException e) {
                System.out.println("Invalid amount. Please enter a number.");
            }
        }

        // Payments are negative; deposits are positive
        if (isPayment) {
            amount = amount.negate();
        }

        Transaction transaction = new Transaction(
                LocalDate.now(),
                LocalTime.now().withNano(0),
                description,
                vendor,
                amount
        );

        manager.addTransaction(transaction);
    }

    // LEDGER MENU
    private void displayLedgerMenu() {
        String choice;

        do {
            choice = showMenu("LEDGER MENU", new String[][]{
                    {"A", "All Transactions"},
                    {"D", "Deposits Only"},
                    {"P", "Payments Only"},
                    {"R", "Reports"},
                    {"H", "Home"}
            });

            switch (choice) {
                case "A", "D", "P" -> displayLedger(choice);
                case "R" -> displayReportsMenu();
                case "H" -> { }
                default -> System.out.println("Invalid choice.");
            }
        } while (!choice.equals("H"));
    }

    // Filter transactions by amount
    private void displayLedger(String filter) {
        ArrayList<Transaction> results = new ArrayList<>();

        for (Transaction transaction : manager.getTransactions()) {
            int sign = transaction.getAmount().compareTo(BigDecimal.ZERO);

            if (filter.equals("A")
                    || (filter.equals("D") && sign > 0)
                    || (filter.equals("P") && sign < 0)) {
                results.add(transaction);
            }
        }

        String title = switch (filter) {
            case "D" -> "DEPOSITS ONLY";
            case "P" -> "PAYMENTS ONLY";
            default -> "ALL TRANSACTIONS";
        };

        printTransactions(title, results);
    }

    // REPORTS MENU
    private void displayReportsMenu() {
        String choice;

        do {
            choice = showMenu("REPORTS MENU", new String[][]{
                    {"1", "Month to Date"},
                    {"2", "Previous Month"},
                    {"3", "Year to Date"},
                    {"4", "Previous Year"},
                    {"5", "Search by Vendor"},
                    {"6", "Custom Search"},
                    {"0", "Back"}
            });

            LocalDate today = LocalDate.now();

            switch (choice) {
                case "1" -> showDateRangeReport(
                        "MONTH TO DATE",
                        today.withDayOfMonth(1), today);

                case "2" -> showDateRangeReport(
                        "PREVIOUS MONTH",
                        today.minusMonths(1).withDayOfMonth(1),
                        today.withDayOfMonth(1).minusDays(1));

                case "3" -> showDateRangeReport(
                        "YEAR TO DATE",
                        today.withDayOfYear(1), today);

                case "4" -> showDateRangeReport(
                        "PREVIOUS YEAR",
                        today.minusYears(1).withDayOfYear(1),
                        today.withDayOfYear(1).minusDays(1));

                case "5" -> searchByVendor();
                case "6" -> customSearch();
                case "0" -> { }
                default -> System.out.println("Invalid choice.");
            }
        } while (!choice.equals("0"));
    }

    // Reusable date-range report
    private void showDateRangeReport(
            String title, LocalDate start, LocalDate end) {

        ArrayList<Transaction> results =
                reportManager.getTransactionsByDateRange(start, end);

        printTransactions(title, results);
    }

    // Search transactions by vendor
    private void searchByVendor() {
        String vendor = ask("Enter vendor name: ");

        if (vendor.isEmpty()) {
            System.out.println("Please enter a vendor name.");
            return;
        }

        ArrayList<Transaction> results = reportManager.searchByVendor(vendor);

        printTransactions("SEARCH BY VENDOR", results);
    }


    private void customSearch() {

        ConsoleStyle.printHeader("CUSTOM SEARCH");

        // Blank dates mean no date restriction
        LocalDate startDate = null;
        LocalDate endDate = null;
        BigDecimal amount = null;

        try {
            String startInput = ask("Start date (YYYY-MM-DD, blank to skip): ");
            String endInput = ask("End date (YYYY-MM-DD, blank to skip): ");

            // Convert dates only when provided
            if (!startInput.isEmpty()) {
                startDate = LocalDate.parse(startInput);
            }

            if (!endInput.isEmpty()) {
                endDate = LocalDate.parse(endInput);
            }

            // Ensure the date range is valid
            if (startDate != null && endDate != null &&
                    startDate.isAfter(endDate)) {
                System.out.println("Start date cannot be after end date.");
                return;
            }

            String description = ask("Description (blank to skip): ");
            String vendor = ask("Vendor (blank to skip): ");
            String amountInput = ask("Amount (blank to skip): ");

            if (!amountInput.isEmpty()) {
                amount = new BigDecimal(amountInput);
            }

            // Ask ReportManager to find matching transactions
            ArrayList<Transaction> results = reportManager.customSearch(
                    startDate, endDate, description, vendor, amount
            );

            // Reuse the existing table and financial summary
            printTransactions("CUSTOM SEARCH RESULTS", results);

        } catch (java.time.format.DateTimeParseException e) {
            System.out.println("Invalid date. Please use YYYY-MM-DD.");

        } catch (NumberFormatException e) {
            System.out.println("Invalid amount. Please enter a number.");
        }
    }


    // One reusable method for displaying transaction tables
    private void printTransactions(
            String title, ArrayList<Transaction> transactions) {

        ConsoleStyle.printHeader(title);

        if (transactions.isEmpty()) {
            System.out.println("No matching transactions found.");
            return;
        }

        // Sort by date and time, newest first
        transactions.sort((a, b) -> {
            int dateResult = b.getDate().compareTo(a.getDate());

            return dateResult != 0
                    ? dateResult
                    : b.getTime().compareTo(a.getTime());
        });

        System.out.printf(
                "%-12s %-10s %-20s %-18s %12s%n",
                "DATE", "TIME", "DESCRIPTION", "VENDOR", "AMOUNT"
        );

        ConsoleStyle.printDivider();

        for (Transaction transaction : transactions) {
            System.out.printf(
                    "%-12s %-10s %-20s %-18s %12s%n",
                    transaction.getDate(),
                    transaction.getTime(),
                    transaction.getDescription(),
                    transaction.getVendor(),
                    transaction.getAmount()
            );
        }

        ConsoleStyle.printDivider();

        // show totals for the displayed transactions
        reportManager.calculateTotals(transactions);
    }

    // Ask the user for text
    private String ask(String message) {
        System.out.print(message);
        return scanner.nextLine().trim();
    }

    private String askRequired(String message) {
        // keep asking until valid text is entered
        while (true) {
            // reuse our existing input method
            String input = ask(message);

            // reject empty input
            if (input.isEmpty()) {
                System.out.println("This field cannot be empty.");
                continue;

            }
            // reject csv separator characters
            if (input.contains("|")) {
                System.out.println("The | character is not allowed.");
                continue;

            }

            // return valid input
            return input;
        }
    }


}
