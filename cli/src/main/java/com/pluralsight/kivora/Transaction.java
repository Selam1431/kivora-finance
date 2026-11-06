package com.pluralsight.kivora;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;


public class Transaction {

    // The date when the transaction happend
    private LocalDate date;

    // the time when the transaction happend
    private LocalTime time;

    // what the transaction was for
    private String description;

    // where the money came from or went
    private String vendor;

    // positive = deposit , negative = payment
    private BigDecimal amount;


    // Constructor

    public Transaction(LocalDate date, LocalTime time, String description, String vendor, BigDecimal amount) {
        this.date = date;
        this.time = time;
        this.description = description;
        this.vendor = vendor;
        this.amount = amount;

    }


    // Get the transaction date
    public LocalDate getDate() {
        return date;
    }

    // Update the transaction date
    public void setDate(LocalDate date) {
        this.date = date;
    }

    // Get the transaction time
    public LocalTime getTime() {
        return time;
    }

    // Update the transaction time
    public void setTime(LocalTime time) {
        this.time = time;
    }

    // Get the transaction description
    public String getDescription() {
        return description;
    }

    // Update the transaction description
    public void setDescription(String description) {
        this.description = description;
    }

    // Get the vendor
    public String getVendor() {
        return vendor;
    }

    // Update the vendor
    public void setVendor(String vendor) {
        this.vendor = vendor;
    }


    // Getter: returns the transaction amount
    public BigDecimal getAmount() {
        return amount;
    }

    // Setter: updates the transaction amount
    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    // return true if money was spent
    // will use to filter transaction in ledger
    public boolean isPayment() {
        return amount.compareTo(BigDecimal.ZERO) < 0;
    }

}
