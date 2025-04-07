//package com.mobileprepaid.services;
//
//import com.mobileprepaid.dto.DashboardDTO;
//import com.mobileprepaid.dto.ExpiringSubscriberDTO;
//import com.mobileprepaid.entities.Plan;
//import com.mobileprepaid.entities.Subscriber;
//import com.mobileprepaid.entities.Transaction;
//import com.mobileprepaid.enums.PlanStatus;
//import com.mobileprepaid.enums.SubscriberStatus;
//import com.mobileprepaid.repository.PlanRepository;
//import com.mobileprepaid.repository.SubscriberRepository;
//import com.mobileprepaid.repository.TransactionRepository;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.data.domain.Page;
//import org.springframework.data.domain.PageRequest;
//import org.springframework.stereotype.Service;
//
//import java.time.LocalDateTime;
//import java.time.format.DateTimeFormatter;
//import java.util.Comparator;
//import java.util.HashMap;
//import java.util.List;
//import java.util.Map;
//import java.util.stream.Collectors;
//
//@Service
//public class DashboardService {
//
//    @Autowired
//    private SubscriberRepository subscriberRepository;
//
//    @Autowired
//    private PlanRepository planRepository;
//
//    @Autowired
//    private TransactionRepository transactionRepository;
//
//    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
//
//    public DashboardDTO getDashboardData() {
//        DashboardDTO dashboard = new DashboardDTO();
//
//        // Total active subscribers
//        Page<Subscriber> activeSubscribersPage = subscriberRepository.findByStatus(
//                SubscriberStatus.ACTIVE, PageRequest.of(0, Integer.MAX_VALUE));
//        dashboard.setTotalSubscribers(activeSubscribersPage.getTotalElements());
//
//        // Total active plans
//        Page<Plan> activePlansPage = planRepository.findByStatus(
//                PlanStatus.ACTIVE, PageRequest.of(0, Integer.MAX_VALUE));
//        dashboard.setActivePlans(activePlansPage.getTotalElements());
//
//        // Define time window
//        LocalDateTime now = LocalDateTime.now();
//        LocalDateTime threeDaysFromNow = now.plusDays(3);
//
//        // Fetch all transactions
//        List<Transaction> allTransactions = transactionRepository.findAll();
//
//        // Group transactions by subscriber number
//        Map<String, List<Transaction>> transactionsBySubscriber = allTransactions.stream()
//                .filter(t -> t.getSubscriberNumber() != null) // Ensure subscriberNumber exists
//                .collect(Collectors.groupingBy(Transaction::getSubscriberNumber));
//
//        // Filter and process expiring transactions (one per subscriber)
//        List<Transaction> expiringTransactions = transactionsBySubscriber.entrySet().stream()
//                .map(entry -> {
//                    List<Transaction> subscriberTransactions = entry.getValue();
//
//                    // Get all transactions expiring within 3 days or expired
//                    List<Transaction> relevantTransactions = subscriberTransactions.stream()
//                            .filter(t -> {
//                                LocalDateTime expiryDate = calculateExpiryDate(t);
//                                return expiryDate != null && !expiryDate.isAfter(threeDaysFromNow);
//                            })
//                            .collect(Collectors.toList());
//
//                    if (relevantTransactions.isEmpty()) {
//                        return null; // No expiring plans within 3 days
//                    }
//
//                    // Find the latest relevant transaction
//                    Transaction latestRelevant = relevantTransactions.stream()
//                            .max(Comparator.comparing(Transaction::getRechargeDate))
//                            .orElse(null);
//
//                    if (latestRelevant == null) {
//                        return null;
//                    }
//
//                    LocalDateTime expiryDate = calculateExpiryDate(latestRelevant);
//                    if (expiryDate != null && !expiryDate.isAfter(now)) { // Latest is expired
//                        // Check for any active plan
//                        Transaction activePlan = subscriberTransactions.stream()
//                                .filter(t -> {
//                                    LocalDateTime exp = calculateExpiryDate(t);
//                                    return exp != null && exp.isAfter(now);
//                                })
//                                .max(Comparator.comparing(Transaction::getRechargeDate)) // Latest active
//                                .orElse(null);
//                        if (activePlan != null && !calculateExpiryDate(activePlan).isAfter(threeDaysFromNow)) {
//                            return activePlan; // Replace with active plan within 3 days
//                        }
//                        return latestRelevant; // No suitable active plan, use latest expired
//                    }
//                    return latestRelevant; // Latest is within 3 days, use it
//                })
//                .filter(t -> t != null) // Remove null entries
//                .collect(Collectors.toList());
//
//        // Set expiring subscribers count
//        dashboard.setExpiringSubscribersCount(expiringTransactions.size());
//
//        // Map to ExpiringSubscriberDTO
//        List<ExpiringSubscriberDTO> expiringSubscribers = expiringTransactions.stream()
//                .map(t -> {
//                    LocalDateTime expiryDate = calculateExpiryDate(t);
//                    Subscriber subscriber = t.getSubscriber();
//                    String email = subscriber != null ? subscriber.getEmail() : "default@example.com";
//                    return new ExpiringSubscriberDTO(
//                            t.getSubscriberName(),
//                            t.getSubscriberNumber(),
//                            email,
//                            t.getPlanName(),
//                            t.getPlanPrice(),
//                            t.getPlanValidity(),
//                            t.getRechargeDate().format(DATE_FORMATTER),
//                            expiryDate != null ? expiryDate.format(DATE_FORMATTER) : "N/A"
//                    );
//                })
//                .collect(Collectors.toList());
//        dashboard.setExpiringSubscribers(expiringSubscribers);
//
//        // Calculate monthly revenue
//        Map<String, Double> monthlyRevenue = new HashMap<>();
//        allTransactions.forEach(t -> {
//            String monthKey = t.getRechargeDate().format(DateTimeFormatter.ofPattern("yyyy-MM"));
//            monthlyRevenue.merge(monthKey, t.getPlanPrice(), Double::sum);
//        });
//        dashboard.setMonthlyRevenue(monthlyRevenue);
//
//        return dashboard;
//    }
//
//    private LocalDateTime calculateExpiryDate(Transaction transaction) {
//        try {
//            int validityDays = Integer.parseInt(transaction.getPlanValidity().replaceAll("[^0-9]", ""));
//            return transaction.getRechargeDate().plusDays(validityDays);
//        } catch (NumberFormatException e) {
//            return null;
//        }
//    }
//}


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
import java.util.Comparator;
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

        // Total active subscribers
        Page<Subscriber> activeSubscribersPage = subscriberRepository.findByStatus(
                SubscriberStatus.ACTIVE, PageRequest.of(0, Integer.MAX_VALUE));
        dashboard.setTotalSubscribers(activeSubscribersPage.getTotalElements());

        // Total active plans
        Page<Plan> activePlansPage = planRepository.findByStatus(
                PlanStatus.ACTIVE, PageRequest.of(0, Integer.MAX_VALUE));
        dashboard.setActivePlans(activePlansPage.getTotalElements());

        // Define time window
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threeDaysFromNow = now.plusDays(3);

        // Fetch all transactions
        List<Transaction> allTransactions = transactionRepository.findAll();

        // Group transactions by subscriber number
        Map<String, List<Transaction>> transactionsBySubscriber = allTransactions.stream()
                .filter(t -> t.getSubscriberNumber() != null) // Ensure subscriberNumber exists
                .collect(Collectors.groupingBy(Transaction::getSubscriberNumber));

        // Filter and process expiring transactions
        List<Transaction> expiringTransactions = transactionsBySubscriber.entrySet().stream()
                .flatMap(entry -> {
                    List<Transaction> subscriberTransactions = entry.getValue();

                    // Get all transactions expiring within 3 days or expired
                    List<Transaction> relevantTransactions = subscriberTransactions.stream()
                            .filter(t -> {
                                LocalDateTime expiryDate = calculateExpiryDate(t);
                                return expiryDate != null && !expiryDate.isAfter(threeDaysFromNow);
                            })
                            .collect(Collectors.toList());

                    if (relevantTransactions.isEmpty()) {
                        return java.util.stream.Stream.empty(); // No expiring plans within 3 days
                    }

                    // For each relevant transaction, check if it’s expired and if there’s an active replacement
                    return relevantTransactions.stream()
                            .map(t -> {
                                LocalDateTime expiryDate = calculateExpiryDate(t);
                                if (expiryDate != null && !expiryDate.isAfter(now)) { // Expired plan
                                    // Check for any active plan
                                    Transaction activePlan = subscriberTransactions.stream()
                                            .filter(tx -> {
                                                LocalDateTime exp = calculateExpiryDate(tx);
                                                return exp != null && exp.isAfter(now);
                                            })
                                            .max(Comparator.comparing(Transaction::getRechargeDate)) // Latest active plan
                                            .orElse(null);
                                    return activePlan != null ? activePlan : t; // Replace with active plan if available
                                }
                                return t; // Not expired, keep as is (within 3 days)
                            })
                            .filter(t -> {
                                LocalDateTime expiryDate = calculateExpiryDate(t);
                                return expiryDate != null && !expiryDate.isAfter(threeDaysFromNow);
                            });
                })
                .collect(Collectors.toList());

        // Set expiring subscribers count
        dashboard.setExpiringSubscribersCount(expiringTransactions.size());

        // Map to ExpiringSubscriberDTO
        List<ExpiringSubscriberDTO> expiringSubscribers = expiringTransactions.stream()
                .map(t -> {
                    LocalDateTime expiryDate = calculateExpiryDate(t);
                    Subscriber subscriber = t.getSubscriber();
                    String email = subscriber != null ? subscriber.getEmail() : "default@example.com";
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

        // Calculate monthly revenue
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