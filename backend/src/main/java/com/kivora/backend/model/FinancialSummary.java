package com.kivora.backend.model;
import java.math.BigDecimal;

/**
 * Represents a summary of financial activity in Kivora Finance.
 *
 * Stores total deposits, total payments, and the net balance
 * calculated from all saved transactions.
 */
public class FinancialSummary {

    private BigDecimal totalDeposits;
    private BigDecimal totalPayments;
    private BigDecimal netBalance;

    /**
     * Creates a financial summary with the calculated totals.
     *
     * @param totalDeposits the total amount of money received
     * @param totalPayments the total amount of money spent
     * @param netBalance the remaining balance after payments
     */
    public FinancialSummary(BigDecimal totalDeposits,
                            BigDecimal totalPayments,
                            BigDecimal netBalance) {

        this.totalDeposits = totalDeposits;
        this.totalPayments = totalPayments;
        this.netBalance = netBalance;
    }

    // Getters allow Jackson to convert the object to JSON.

    public BigDecimal getTotalDeposits() {
        return totalDeposits;
    }

    public BigDecimal getTotalPayments() {
        return totalPayments;
    }

    public BigDecimal getNetBalance() {
        return netBalance;
    }
}
