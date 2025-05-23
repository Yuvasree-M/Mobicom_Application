package com.mobileprepaid.services;

import com.mobileprepaid.dto.CurrentPlanDTO;
import com.mobileprepaid.entities.Plan;
import com.mobileprepaid.entities.Transaction;
import com.mobileprepaid.repository.PlanRepository;
import com.mobileprepaid.repository.TransactionRepository;

import java.time.LocalDateTime;
import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final PlanRepository planRepository;

    public Page<Transaction> getAllTransactions(Pageable pageable) {
        return transactionRepository.findAll(pageable);
    }

    public List<Transaction> getAllTransaction() {
        return transactionRepository.findAll();
    }

    public Page<Transaction> getFilteredTransactions(String status, String paymentMethod, String fromDate, String toDate, Pageable pageable) {
        return transactionRepository.findWithFilters(status, paymentMethod, fromDate, toDate, pageable);
    }

    public CurrentPlanDTO getLatestTransaction(String subscriberNumber) {
        Transaction latestTransaction = transactionRepository.findLatestBySubscriberPhoneNumber(subscriberNumber);
        if (latestTransaction == null) {
            return null;
        }

        Plan plan = null;
        if (latestTransaction.getPlanId() != null) {
            plan = planRepository.findById(latestTransaction.getPlanId()).orElse(null);
        }

        if (plan == null) {
            int validityDays = Integer.parseInt(latestTransaction.getPlanValidity().replaceAll("[^0-9]", ""));
            return new CurrentPlanDTO(
                latestTransaction.getPlanName(),
                latestTransaction.getPlanPrice(),
                validityDays,
                "Unknown",
                "Unknown",
                "Unknown",
                calculateDaysLeft(latestTransaction.getRechargeDate(), validityDays)
            );
        }

        int validityDays = Integer.parseInt(latestTransaction.getPlanValidity().replaceAll("[^0-9]", ""));
        int daysLeft = calculateDaysLeft(latestTransaction.getRechargeDate(), validityDays);

        return new CurrentPlanDTO(
            latestTransaction.getPlanName(),
            latestTransaction.getPlanPrice(),
            validityDays,
            plan.getCallLimit() != null ? plan.getCallLimit() : "N/A",
            plan.getSmsLimit() != null ? plan.getSmsLimit() : "N/A",
            plan.getDataLimit() != null ? plan.getDataLimit() : "N/A",
            daysLeft
        );
    }

    private int calculateDaysLeft(LocalDateTime rechargeDate, int validity) {
        LocalDateTime expiryDate = rechargeDate.plusDays(validity);
        long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(LocalDateTime.now(), expiryDate);
        return Math.max(0, (int) daysBetween);
    }
}
