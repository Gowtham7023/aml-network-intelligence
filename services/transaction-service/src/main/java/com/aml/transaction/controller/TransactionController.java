package com.aml.transaction.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.aml.transaction.dto.TransactionRequest;
import com.aml.transaction.entity.Transaction;
import com.aml.transaction.service.TransactionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService service;

    public TransactionController(TransactionService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Transaction createTransaction(
            @Valid @RequestBody TransactionRequest request) {

        return service.createTransaction(request);
    }

    @GetMapping
    public List<Transaction> getAllTransactions() {
        return service.getAllTransactions();
    }

    @GetMapping("/{id}")
    public Transaction getTransaction(@PathVariable Long id) {
        return service.getTransaction(id);
    }

    @GetMapping("/account/{accountId}")
    public List<Transaction> getAccountTransactions(
            @PathVariable String accountId) {

        return service.getAccountTransactions(accountId);
    }
}