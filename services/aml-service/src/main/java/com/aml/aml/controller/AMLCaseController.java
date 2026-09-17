package com.aml.aml.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aml.aml.entity.AMLCase;
import com.aml.aml.repository.AMLCaseRepository;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/cases")
public class AMLCaseController {

    private final AMLCaseRepository caseRepository;

    public AMLCaseController(AMLCaseRepository caseRepository) {
        this.caseRepository = caseRepository;
    }

    @PostMapping
    public AMLCase createCase(@RequestBody AMLCase amlCase) {
        if (amlCase.getStatus() == null || amlCase.getStatus().isBlank()) {
            amlCase.setStatus("OPEN");
        }
        if (amlCase.getCreatedAt() == null) {
            amlCase.setCreatedAt(LocalDateTime.now());
        }

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
                .orElseThrow(() -> new RuntimeException("Case not found with id: " + id));
    }

    @PutMapping("/{id}")
    public AMLCase updateCase(@PathVariable Long id, @RequestBody AMLCase updateData) {
        AMLCase amlCase = caseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Case not found with id: " + id));

        if (updateData.getStatus() != null && !updateData.getStatus().isBlank()) {
            amlCase.setStatus(updateData.getStatus());
        }
        if (updateData.getPriority() != null && !updateData.getPriority().isBlank()) {
            amlCase.setPriority(updateData.getPriority());
        }
        if (updateData.getAssignedTo() != null && !updateData.getAssignedTo().isBlank()) {
            amlCase.setAssignedTo(updateData.getAssignedTo());
        }
        if (updateData.getRemarks() != null && !updateData.getRemarks().isBlank()) {
            amlCase.setRemarks(updateData.getRemarks());
        }

        return caseRepository.save(amlCase);
    }
}