// this class handle the reporting API for my APP
// searching, filtering and retrieving financial summaries


package com.kivora.backend.controller;

import com.kivora.backend.model.Transaction;
import com.kivora.backend.model.FinancialSummary;
import com.kivora.backend.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.math.BigDecimal;

/**
 * Provides REST API endpoints for Kivora's financial reports.
 *
 * Allows clients to search and filter transactions,
 * and retrieve financial summaries.
 */
@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    /**
     * Creates the report controller with its reporting service.
     *
     * @param reportService the service responsible for financial reporting
     */
    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    /**
     * Retrieves transactions within a specified date range.
     * Both the start and end dates are included.
     *
     * @param startDate the beginning of the date range
     * @param endDate the end of the date range
     * @return transactions within the specified dates
     */
    @GetMapping("/date-range")
    public List<Transaction> getTransactionsByDateRange(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate) {

        return reportService.getTransactionsByDateRange(
                startDate, endDate);
    }

    /**
     * Searches transactions by vendor name, ignoring case.
     * Partial vendor names are also supported.
     *
     * @param vendorName the vendor name or partial name to search for
     * @return transactions matching the vendor name
     */
    @GetMapping("/vendor")
    public List<Transaction> searchByVendor(
            @RequestParam String vendorName) {

        return reportService.searchByVendor(vendorName);
    }

    /**
     * Searches transactions using optional filters.
     * Only the provided filters are applied.
     *
     * @param startDate the earliest transaction date, or null
     * @param endDate the latest transaction date, or null
     * @param description the description to search for, or null
     * @param vendor the vendor name to search for, or null
     * @param amount the exact transaction amount, or null
     * @return transactions matching all provided filters
     */
    @GetMapping("/search")
    public List<Transaction> customSearch(

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate,

            @RequestParam(required = false)
            String description,

            @RequestParam(required = false)
            String vendor,

            @RequestParam(required = false)
            BigDecimal amount) {

        return reportService.customSearch(
                startDate,
                endDate,
                description,
                vendor,
                amount
        );
    }

    /**
     * Calculates the financial summary for all transactions.
     *
     * Includes total deposits, total payments,
     * and the remaining net balance.
     *
     * @return a summary of deposits, payments, and net balance
     */
    @GetMapping("/summary")
    public FinancialSummary getFinancialSummary() {

        return reportService.calculateTotals();
    }
}
