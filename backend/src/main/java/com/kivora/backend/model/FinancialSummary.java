package com.kivora.backend.model;
import java.math.BigDecimal;
public class FinancialSummary {
    private BigDecimal totalDeposits;
    private BigDecimal totalPayments;
    private BigDecimal netBalance;

    // Constructor
    public FinancialSummary(BigDecimal totalDeposits,
                            BigDecimal totalPayments,
                            BigDecimal netBalance) {

        this.totalDeposits = totalDeposits;
        this.totalPayments = totalPayments;
        this.netBalance = netBalance;
    }
    // Getters allow Jackson to convert the object to JSON
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
