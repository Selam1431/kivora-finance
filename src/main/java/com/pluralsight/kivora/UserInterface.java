package com.pluralsight.kivora;
import java.util.Scanner;

public class UserInterface {
    private Scanner scanner;

    private TransactionManager manager;

    public UserInterface() {

        // create a scanner for keyboard input
        scanner = new Scanner(System.in);

        // create our transaction manager
        manager = new TransactionManager();
    }

    // Displays Kivora's home screen
    public void displayHomeScreen() {

        String choice = "";


        // Continue until the user chooses X
        while (!choice.equalsIgnoreCase("X")) {

            // display our royal amethyst header
            ConsoleStyle.printHeader("MAIN DASHBOARD");

            // Display styled menu options

            ConsoleStyle.printOption("D", "Add Deposit");
            ConsoleStyle.printOption("P", "Make Payment");
            ConsoleStyle.printOption("L", "View Ledger");
            ConsoleStyle.printOption("X", "Exit Kivora");

            ConsoleStyle.printDivider();

            // Ask the users choice

            System.out.print(
                    ConsoleStyle.PURPLE +
                            "\n  Enter your choice: " +
                            ConsoleStyle.RESET
            );




            // Read the user's choice
            choice = scanner.nextLine().trim();

            // Handle the selected option
            switch (choice.toUpperCase()) {

                case "D":
                    System.out.println("Add Deposit selected");
                    break;

                case "P":
                    System.out.println("Make Payment selected");
                    break;

                case "L":
                    System.out.println("View Ledger selected");
                    break;

                case "X":
                    System.out.println("Thank you for using Kivora!");
                    break;

                default:
                    System.out.println("Invalid choice. Try again.");
            }
        }
    }

}
