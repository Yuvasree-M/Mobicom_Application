package com.mobileprepaid.controllers;

import com.mobileprepaid.dto.DashboardDTO;
import com.mobileprepaid.dto.ErrorResponse;
import com.mobileprepaid.dto.ExpiringSubscriberDTO;
import com.mobileprepaid.dto.ExpiryNotificationDTO;
import com.mobileprepaid.dto.NotificationDTO;
import com.mobileprepaid.dto.ReportAnalyticsDTO;
import com.mobileprepaid.entities.*;

import com.mobileprepaid.enums.SubscriberStatus;
import com.mobileprepaid.repository.SubscriberRepository;
import com.mobileprepaid.repository.SubscriberLoginRepository;
import com.mobileprepaid.services.*;
import com.mobileprepaid.utils.MailService;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import java.util.Collections;
import java.util.List;
import java.util.Map;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;

import org.springframework.http.*;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/admin")
public class AdminController {

    @Autowired
    private SubscriberRepository subscriberRepository;
    @Autowired
    private SubscriberLoginRepository subscriberLoginRepository;
    @Autowired
    private CategoryService categoryService;
    @Autowired
    private PlanService planService; 
    @Autowired
    private TransactionService transactionService;
    @Autowired
    private AdminService adminService;
    @Autowired
    private DashboardService dashboardService;
    @Autowired
    private ReportService reportService;
    @Autowired
    private JavaMailSender mailSender;
    private final MailService mailService;
    
    // =========================== SUBSCRIBER MANAGEMENT ===========================


    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/getsubscriber/{id}")
    public ResponseEntity<Subscriber> getSubscriberById(@PathVariable Long id) {
        Subscriber subscriber = subscriberRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subscriber not found with ID: " + id));
        return ResponseEntity.ok(subscriber);
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping("/verify-subscriber/{id}")
    public ResponseEntity<Map<String, String>> verifySubscriber(
            @PathVariable Long id,
            @RequestParam SubscriberStatus status) {

        if (status == SubscriberStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot set status to PENDING");
        }

        Subscriber subscriber = subscriberRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subscriber not found with ID: " + id));

        subscriber.setStatus(status);
        subscriberRepository.save(subscriber);

        if (status == SubscriberStatus.ACTIVE) {
            SubscriberLogin subscriberLogin = subscriberLoginRepository.findByPhoneNumber(subscriber.getPhoneNumber())
                    .orElse(new SubscriberLogin());

            subscriberLogin.setSubscriber(subscriber);
            subscriberLogin.setPhoneNumber(subscriber.getPhoneNumber());
            subscriberLoginRepository.save(subscriberLogin);
        }

        return ResponseEntity.ok(Collections.singletonMap("message", "Subscriber status updated to " + status));
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping(value = "/getsubscribers", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Page<Subscriber>> getSubscribers(
            @RequestParam(required = false) SubscriberStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Subscriber> subscribers = (status != null)
                ? subscriberRepository.findByStatus(status, pageable)
                : subscriberRepository.findAll(pageable);

        return ResponseEntity.ok(subscribers);
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/getsubscribers/all")
    public ResponseEntity<List<Subscriber>> getAllSubscribers(
            @RequestParam(required = false) String status) {
        if (status != null && !status.isEmpty()) {
            try {
                SubscriberStatus subscriberStatus = SubscriberStatus.valueOf(status.toUpperCase());
                return ResponseEntity.ok(subscriberRepository.findByStatus(subscriberStatus));
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status value: " + status);
            }
        }
        return ResponseEntity.ok(subscriberRepository.findAll());
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @DeleteMapping("/deletesubscriber/{id}")
    public ResponseEntity<Map<String, String>> deleteSubscriber(@PathVariable Long id) {
        Subscriber subscriber = subscriberRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subscriber not found with ID: " + id));

        subscriber.setStatus(SubscriberStatus.INACTIVE);
        subscriberRepository.save(subscriber);

        return ResponseEntity.ok(Collections.singletonMap("message", "Subscriber deactivated successfully"));
    }
    
    // =========================== CATEGORY MANAGEMENT ===========================
    
    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/categories")
    public ResponseEntity<Category> createCategory(@RequestBody Category category) {
        return ResponseEntity.ok(categoryService.saveCategory(category));
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/categories/{id}")
    public ResponseEntity<Category> getCategoryById(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.getCategoryById(id));
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/categories/name/{name}")
    public ResponseEntity<Category> getCategoryByName(@PathVariable String name) {
        return ResponseEntity.ok(categoryService.getCategoryByName(name));
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping("/categories/{id}")
    public ResponseEntity<Category> updateCategory(@PathVariable Long id, @RequestBody Category updatedCategory) {
        return ResponseEntity.ok(categoryService.updateCategory(id, updatedCategory));
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @DeleteMapping("/categories/{id}")
    public ResponseEntity<String> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok("Category deleted successfully");
    }

    // =========================== PLAN MANAGEMENT ===========================
    
    
    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/plans")
    public ResponseEntity<Page<Plan>> getAllPlans(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String dataLimit,
            @RequestParam(required = false) Integer validity,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "price") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        PageRequest pageable = PageRequest.of(page, size, sort);
        Page<Plan> plans = planService.getAllPlans(pageable); 
        return ResponseEntity.ok(plans);
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/plans")
    public ResponseEntity<Plan> createPlan(@RequestBody Plan plan) {
        return ResponseEntity.ok(planService.savePlan(plan));
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/plans/{id}")
    public ResponseEntity<Plan> getPlanById(@PathVariable Long id) {
        return ResponseEntity.ok(planService.getPlanById(id));
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping("/plans/{id}")
    public ResponseEntity<Plan> updatePlan(@PathVariable Long id, @RequestBody Plan updatedPlan) {
        return ResponseEntity.ok(planService.updatePlan(id, updatedPlan));
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping("/plans/{id}/status")
    public ResponseEntity<String> updatePlanStatus(@PathVariable Long id, @RequestParam String status) {
        Plan updatedPlan = planService.updatePlanStatus(id, status);
        return ResponseEntity.ok("Plan status updated to " + updatedPlan.getStatus());
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @DeleteMapping("/plans/{id}")
    public ResponseEntity<String> deletePlan(@PathVariable Long id) {
        planService.deletePlan(id);
        return ResponseEntity.ok("Plan deleted successfully");
    }
    
    
    // =========================== TRANSACTION MANAGEMENT ===========================
    
    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/transactions/all")
    public ResponseEntity<List<Transaction>> getAllTransaction() {
        List<Transaction> transactions = transactionService.getAllTransaction();
        return ResponseEntity.ok(transactions);
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/transactions")
    public ResponseEntity<Page<Transaction>> getFilteredTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(defaultValue = "rechargeDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Transaction> transactions = transactionService.getFilteredTransactions(status, paymentMethod, fromDate, toDate, pageable);
        return ResponseEntity.ok(transactions);
    }

        
     // =========================== ADMIN PROFILE MANAGEMENT ===========================

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/profile/{email}")
    public ResponseEntity<AdminLogin> getAdminProfile(@PathVariable String email) {
        AdminLogin admin = adminService.getAdminProfile(email);
        return ResponseEntity.ok(admin);
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping("/profile/{email}")
    public ResponseEntity<AdminLogin> updateAdminProfile(
            @PathVariable String email, @RequestBody AdminLogin adminLogin) {
        AdminLogin updatedAdmin = adminService.updateAdminProfile(email, adminLogin);
        return ResponseEntity.ok(updatedAdmin);
    }
    
    // =========================== DASHBOARD MANAGEMENT ===========================
    
    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardDTO> getDashboardData() {
        DashboardDTO dashboard = dashboardService.getDashboardData(); // Updated service call
        return ResponseEntity.ok(dashboard);
    }
    
    
    @Value("${spring.mail.username}")
    private String mailUsername;

    @Value("${spring.mail.password}")
    private String mailPassword;

    public AdminController(JavaMailSender mailSender, MailService mailService) {
        this.mailSender = mailSender;
        this.mailService = mailService;
    }


    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/notify")
    public ResponseEntity<?> sendNotification(@RequestBody NotificationDTO notification) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setTo(notification.getEmail());
            helper.setSubject(notification.getSubject());
            helper.setText(notification.getMessage(), notification.getHtmlMessage());
            helper.setFrom(mailUsername);

            mailSender.send(mimeMessage);

            return ResponseEntity.ok(new ErrorResponse("Notification sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Failed to send notification: " + e.getMessage()));
        }
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/notify-expiry")
    public ResponseEntity<?> sendExpiryNotification(@RequestBody ExpiryNotificationDTO expiryNotification) {
        try {
           System.out.println("Received email for expiry notification: {}" + expiryNotification.getEmail()); 
            mailService.sendExpiryNotification(
                expiryNotification.getName(),
                expiryNotification.getPhone(),
                expiryNotification.getEmail(),
                expiryNotification.getExpiryDate()
            );
            return ResponseEntity.ok(new ErrorResponse("Expiry notification sent successfully"));
        } catch (MessagingException e) {
            System.out.println("Failed to send expiry notification: {}" + e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Failed to send expiry notification: " + e.getMessage()));
        }
    }
    
    @GetMapping("/reports/analytics")
    public ResponseEntity<ReportAnalyticsDTO> getReportAnalytics() {
        ReportAnalyticsDTO reportData = reportService.getReportAnalytics();
        return ResponseEntity.ok(reportData);
    }
    }