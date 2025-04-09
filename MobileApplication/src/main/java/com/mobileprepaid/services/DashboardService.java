package com.mobileprepaid.services;

import com.mobileprepaid.dto.DashboardDTO;
import com.mobileprepaid.dto.ExpiringSubscriberDTO;
import com.mobileprepaid.entities.Plan;
import com.mobileprepaid.entities.Subscriber;
import com.mobileprepaid.entities.Transaction;
import com.mobileprepaid.enums.PlanStatus;
import com.mobileprepaid.enums.SubscriberStatus;
import com.mobileprepaid.repository.PlanRepository;
import com.mobileprepaid.repository.SubscriberRepository;
import com.mobileprepaid.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    @Autowired
    private SubscriberRepository subscriberRepository;

    @Autowired
    private PlanRepository planRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public DashboardDTO getDashboardData() {
        DashboardDTO dashboard = new DashboardDTO();

        Page<Subscriber> activeSubscribersPage = subscriberRepository.findByStatus(
                SubscriberStatus.ACTIVE, PageRequest.of(0, Integer.MAX_VALUE));
        dashboard.setTotalSubscribers(activeSubscribersPage.getTotalElements());

        Page<Plan> activePlansPage = planRepository.findByStatus(
                PlanStatus.ACTIVE, PageRequest.of(0, Integer.MAX_VALUE));
        dashboard.setActivePlans(activePlansPage.getTotalElements());

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threeDaysFromNow = now.plusDays(3);
        List<Transaction> allTransactions = transactionRepository.findAll();
        List<Transaction> expiringTransactions = allTransactions.stream()
                .filter(t -> {
                    LocalDateTime expiryDate = calculateExpiryDate(t);
                    return expiryDate != null && expiryDate.isAfter(now) && expiryDate.isBefore(threeDaysFromNow);
                })
                .collect(Collectors.toList());

        dashboard.setExpiringSubscribersCount(expiringTransactions.size());

        List<ExpiringSubscriberDTO> expiringSubscribers = expiringTransactions.stream()
                .map(t -> {
                    LocalDateTime expiryDate = calculateExpiryDate(t);
                    Subscriber subscriber = t.getSubscriber();
                    String email = subscriber != null ? subscriber.getEmail() : "default@example.com"; // Fallback if subscriber is null
                    return new ExpiringSubscriberDTO(
                            t.getSubscriberName(),
                            t.getSubscriberNumber(),
                            email,
                            t.getPlanName(),
                            t.getPlanPrice(),
                            t.getPlanValidity(),
                            t.getRechargeDate().format(DATE_FORMATTER),
                            expiryDate != null ? expiryDate.format(DATE_FORMATTER) : "N/A"
                    );
                })
                .collect(Collectors.toList());
        dashboard.setExpiringSubscribers(expiringSubscribers);

        Map<String, Double> monthlyRevenue = new HashMap<>();
        allTransactions.forEach(t -> {
            String monthKey = t.getRechargeDate().format(DateTimeFormatter.ofPattern("yyyy-MM"));
            monthlyRevenue.merge(monthKey, t.getPlanPrice(), Double::sum);
        });
        dashboard.setMonthlyRevenue(monthlyRevenue);

        return dashboard;
    }

    private LocalDateTime calculateExpiryDate(Transaction transaction) {
        try {
            int validityDays = Integer.parseInt(transaction.getPlanValidity().replaceAll("[^0-9]", ""));
            return transaction.getRechargeDate().plusDays(validityDays);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}