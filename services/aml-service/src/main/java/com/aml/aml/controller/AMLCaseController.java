package com.aml.aml.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aml.aml.entity.AMLCase;
import com.aml.aml.repository.AMLCaseRepository;

@RestController
@RequestMapping("/api/cases")
public class AMLCaseController {

    private final AMLCaseRepository caseRepository;

    public AMLCaseController(AMLCaseRepository caseRepository) {
        this.caseRepository = caseRepository;
    }

    @PostMapping
    public AMLCase createCase(@RequestBody AMLCase amlCase) {

        amlCase.setStatus("OPEN");
        amlCase.setCreatedAt(LocalDateTime.now());

        return caseRepository.save(amlCase);
    }

    @GetMapping
    public List<AMLCase> getAllCases() {
        return caseRepository.findAll();
    }

    @GetMapping("/open")
    public List<AMLCase> getOpenCases() {
        return caseRepository.findByStatus("OPEN");
    }

    @GetMapping("/{id}")
    public AMLCase getCase(@PathVariable Long id) {
        return caseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Case not found"));
    }
}