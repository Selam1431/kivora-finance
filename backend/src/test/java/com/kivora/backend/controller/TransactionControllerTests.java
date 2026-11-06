package com.kivora.backend.controller;

import com.kivora.backend.service.TransactionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.json.JacksonJsonHttpMessageConverter;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class TransactionControllerTests {
    private MockMvc mvc;
    private Path storageFile;

    @BeforeEach
    void setUp() {
        storageFile = Path.of("target", "controller-transactions-" + UUID.randomUUID() + ".csv").toAbsolutePath();
        TransactionService service = new TransactionService(storageFile);
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mvc = MockMvcBuilders.standaloneSetup(new TransactionController(service))
                .setValidator(validator)
                .setMessageConverters(new JacksonJsonHttpMessageConverter())
                .build();
    }

    @AfterEach
    void cleanUp() throws Exception {
        Files.deleteIfExists(storageFile);
    }

    @Test
    void postPutDeleteUsePersistedTransactionsAndReturnExpectedStatuses() throws Exception {
        String created = mvc.perform(post("/api/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload("Salary", "Acme", "1250.00")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", matchesPattern("[0-9a-fA-F-]{36}")))
                .andReturn().getResponse().getContentAsString();
        Matcher idMatch = Pattern.compile("\\\"id\\\":\\\"([^\\\"]+)\\\"").matcher(created);
        if (!idMatch.find()) throw new AssertionError("Create response did not contain an ID: " + created);
        UUID id = UUID.fromString(idMatch.group(1));
        mvc.perform(get("/api/transactions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(id.toString()));

        mvc.perform(put("/api/transactions/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload("Groceries", "Market", "-35.25")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id.toString()))
                .andExpect(jsonPath("$.amount").value(-35.25));

        mvc.perform(delete("/api/transactions/{id}", id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/transactions")).andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void invalidFieldsAndZeroAmountsReturnBadRequest() throws Exception {
        mvc.perform(post("/api/transactions").contentType(MediaType.APPLICATION_JSON)
                        .content(payload("", "Store", "10")))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/transactions").contentType(MediaType.APPLICATION_JSON)
                        .content(payload("Coffee", "Cafe", "0")))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/transactions").contentType(MediaType.APPLICATION_JSON)
                        .content(payload("Coffee", "Cafe", "1").replace("\"date\":\"2026-11-05\",", "")))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/transactions").contentType(MediaType.APPLICATION_JSON)
                        .content(payload("Coffee", "Cafe", "1").replace("\"time\":\"09:30:00\",", "")))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/api/transactions/{id}", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload("Coffee", "Cafe", "-1")))
                .andExpect(status().isNotFound());
    }

    @Test
    void missingIdsReturnNotFoundForUpdateAndDelete() throws Exception {
        UUID id = UUID.randomUUID();
        mvc.perform(put("/api/transactions/{id}", id).contentType(MediaType.APPLICATION_JSON)
                        .content(payload("Coffee", "Cafe", "1")))
                .andExpect(status().isNotFound());
        mvc.perform(delete("/api/transactions/{id}", id)).andExpect(status().isNotFound());
    }

    private static String payload(String description, String vendor, String amount) {
        return "{\"date\":\"2026-11-05\",\"time\":\"09:30:00\",\"description\":\"" +
                description + "\",\"vendor\":\"" + vendor + "\",\"amount\":" + amount + "}";
    }

}
