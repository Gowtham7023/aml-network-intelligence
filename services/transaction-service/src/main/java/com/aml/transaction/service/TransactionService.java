package com.aml.transaction.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.aml.transaction.dto.TransactionRequest;
import com.aml.transaction.entity.Transaction;
import com.aml.transaction.repository.TransactionRepository;

@Service
public class TransactionService {

    private final TransactionRepository repository;

    public TransactionService(TransactionRepository repository) {
        this.repository = repository;
    }

    public Transaction createTransaction(TransactionRequest request) {

        Transaction transaction = new Transaction();

        transaction.setFromAccountId(request.getFromAccountId());
        transaction.setToAccountId(request.getToAccountId());
        transaction.setAmount(request.getAmount());
        transaction.setCurrency(request.getCurrency());
        transaction.setChannel(request.getChannel());
        transaction.setCountry(request.getCountry());
        transaction.setDeviceId(request.getDeviceId());
        transaction.setTransactionTime(LocalDateTime.now());

        return repository.save(transaction);
    }

    public List<Transaction> getAllTransactions() {
        return repository.findAll();
    }

    public Transaction getTransaction(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
    }

    public List<Transaction> getAccountTransactions(String accountId) {

        List<Transaction> transactions =
                repository.findByFromAccountId(accountId);

        transactions.addAll(
                repository.findByToAccountId(accountId)
        );

        return transactions;
    }
}