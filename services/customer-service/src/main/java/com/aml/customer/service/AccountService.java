package com.aml.customer.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.aml.customer.entity.Account;
import com.aml.customer.repository.AccountRepository;

@Service
public class AccountService {

    private final AccountRepository repository;

    public AccountService(AccountRepository repository) {
        this.repository = repository;
    }

    public Account create(Account account) {
        return repository.save(account);
    }

    public Account getByNumber(String accountNumber) {
        return repository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new RuntimeException("Account not found"));
    }

    public List<Account> getByCustomer(Long customerId) {
        return repository.findByCustomerId(customerId);
    }
}