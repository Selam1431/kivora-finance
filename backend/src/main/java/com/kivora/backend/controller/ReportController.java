// this class handle the reporting API for my APP
// searching, filtering and retrieving financial summaries

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

    // connect the controller to the report service
    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    // get transaction b/n dates
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

    // we search by vendor
    @GetMapping("/vendor")
    public List<Transaction> searchByVendor(
            @RequestParam String vendorName) {
        return reportService.searchByVendor(vendorName);
    }

    // search by customsearch
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

    // will tell total deposit, payments and balance
    @GetMapping("/summary")
    public FinancialSummary getFinancialSummary() {

        return reportService.calculateTotals();
    }

}
