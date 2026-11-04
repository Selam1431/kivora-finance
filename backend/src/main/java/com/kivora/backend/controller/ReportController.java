
package com.kivora.backend.controller;

import com.kivora.backend.model.Transaction;
import com.kivora.backend.service.ReportService;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.math.BigDecimal;
import com.kivora.backend.model.FinancialSummary;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    // Spring injects our ReportService
    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    // GET /api/reports/date-range
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


    // GET /api/reports/vendor?vendorName=Starbucks
    @GetMapping("/vendor")
    public List<Transaction> searchByVendor(
            @RequestParam String vendorName) {

        // Ask ReportService to find matching transactions
        return reportService.searchByVendor(vendorName);
    }



    // GET /api/reports/search
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

        // Pass all filters to ReportService
        return reportService.customSearch(
                startDate,
                endDate,
                description,
                vendor,
                amount
        );

    }

    // GET /api/reports/summary
    @GetMapping("/summary")
    public FinancialSummary getFinancialSummary() {

        // Ask ReportService to calculate the totals
        return reportService.calculateTotals();
    }

}
