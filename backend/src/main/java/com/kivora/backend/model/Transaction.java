
package com.kivora.backend.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.AssertTrue;
import com.fasterxml.jackson.annotation.JsonIgnore;

public class Transaction {


    // The date when the transaction happened
    @NotNull(message = "Transaction date is required")
    private LocalDate date;

    // The time when the transaction happened
    @NotNull(message = "Transaction time is required")
    private LocalTime time;

    // What the transaction was for
    @NotBlank(message = "Description cannot be empty")
    private String description;

    // Where the money came from or went
    @NotBlank(message = "Vendor cannot be empty")
    private String vendor;

    // Positive = deposit, negative = payment
    @NotNull(message = "Amount is required")
    private BigDecimal amount;


    // constructor
    public Transaction() {

    }

    // Constructor: creates a transaction object
    public Transaction(LocalDate date, LocalTime time,
                       String description, String vendor,
                       BigDecimal amount) {
        this.date = date;
        this.time = time;
        this.description = description;
        this.vendor = vendor;
        this.amount = amount;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public LocalTime getTime() {
        return time;
    }

    public void setTime(LocalTime time) {
        this.time = time;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getVendor() {
        return vendor;
    }

    public void setVendor(String vendor) {
        this.vendor = vendor;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    // Returns true when the transaction is a payment
    public boolean isPayment() {
        return amount.compareTo(BigDecimal.ZERO) < 0;
    }


    // Validation rule: transaction amount cannot be zero
    @JsonIgnore
    @AssertTrue(message = "Transaction amount cannot be zero")
    public boolean isAmountNonZero() {

        // Let @NotNull handle missing amounts
        if (amount == null) {
            return true;
        }

        // compareTo returns 0 when the amount equals zero
        return amount.compareTo(BigDecimal.ZERO) != 0;
    }

}
