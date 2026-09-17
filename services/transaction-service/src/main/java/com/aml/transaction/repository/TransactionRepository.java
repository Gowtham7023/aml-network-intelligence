package com.aml.transaction.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aml.transaction.entity.Transaction;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByFromAccountId(String fromAccountId);

    List<Transaction> findByToAccountId(String toAccountId);
}