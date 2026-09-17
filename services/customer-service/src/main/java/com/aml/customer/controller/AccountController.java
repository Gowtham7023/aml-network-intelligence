package com.aml.customer.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aml.customer.entity.Account;
import com.aml.customer.service.AccountService;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService service;

    public AccountController(AccountService service) {
        this.service = service;
    }

    @PostMapping
    public Account create(@RequestBody Account account) {
        return service.create(account);
    }

    @GetMapping("/{accountNumber}")
    public Account getByNumber(@PathVariable String accountNumber) {
        return service.getByNumber(accountNumber);
    }

    @GetMapping("/customer/{customerId}")
    public List<Account> getByCustomer(@PathVariable Long customerId) {
        return service.getByCustomer(customerId);
    }
}