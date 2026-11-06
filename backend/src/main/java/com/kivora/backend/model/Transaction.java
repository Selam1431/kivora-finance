package com.kivora.backend.model;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.AssertTrue;
import com.fasterxml.jackson.annotation.JsonIgnore;

/**
 * Represents a financial transaction in Kivora Finance.
 *
 * Each transaction contains a unique ID, date, time,
 * description, vendor, and amount.
 *
 * Positive amounts represent deposits, while negative
 * amounts represent payments.
 */
public class Transaction {

    private UUID id;

    @NotNull(message = "Transaction date is required")
    private LocalDate date;

    @NotNull(message = "Transaction time is required")
    private LocalTime time;

    @NotBlank(message = "Description cannot be empty")
    private String description;

    @NotBlank(message = "Vendor cannot be empty")
    private String vendor;

    @NotNull(message = "Amount is required")
    private BigDecimal amount;

    /**
     * Creates an empty transaction.
     *
     * Required by Jackson when converting JSON
     * request data into a Transaction object.
     */
    public Transaction() {
    }

    /**
     * Creates a transaction with an existing unique ID.
     *
     * @param id the transaction's unique identifier
     * @param date the transaction date
     * @param time the transaction time
     * @param description the purpose of the transaction
     * @param vendor the source or destination of the money
     * @param amount the transaction amount
     */
    public Transaction(UUID id, LocalDate date, LocalTime time,
                       String description, String vendor, BigDecimal amount) {
        this.id = id;
        this.date = date;
        this.time = time;
        this.description = description;
        this.vendor = vendor;
        this.amount = amount;
    }

    /**
     * Creates a transaction without an assigned ID.
     *
     * The transaction service assigns a unique ID
     * when the transaction is saved.
     *
     * @param date the transaction date
     * @param time the transaction time
     * @param description the purpose of the transaction
     * @param vendor the source or destination of the money
     * @param amount the transaction amount
     */
    public Transaction(LocalDate date, LocalTime time,
                       String description, String vendor, BigDecimal amount) {
        this.date = date;
        this.time = time;
        this.description = description;
        this.vendor = vendor;
        this.amount = amount;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
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

    /**
     * Checks whether the transaction is a payment.
     *
     * @return true if the amount is negative, otherwise false
     */
    public boolean isPayment() {

        if (amount == null) {
            return false;
        }

        return amount.compareTo(BigDecimal.ZERO) < 0;
    }

    /**
     * Validates that the transaction amount is not zero.
     *
     * A null amount is handled separately by the
     * {@code @NotNull} validation annotation.
     *
     * @return true if the amount is null or non-zero,
     *         otherwise false
     */
    @JsonIgnore
    @AssertTrue(message = "Transaction amount cannot be zero")
    public boolean isAmountNonZero() {

        if (amount == null) {
            return true;
        }

        return amount.compareTo(BigDecimal.ZERO) != 0;
    }
}
