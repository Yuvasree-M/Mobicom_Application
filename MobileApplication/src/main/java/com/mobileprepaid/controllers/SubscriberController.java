package com.mobileprepaid.controllers;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;


import com.mobileprepaid.dto.CurrentPlanDTO;
import com.mobileprepaid.dto.PlanDTO;
import com.mobileprepaid.dto.RechargeRequestDTO;
import com.mobileprepaid.dto.SubscriberAccountDTO;
import com.mobileprepaid.dto.SubscriberProfileDTO;
import com.mobileprepaid.entities.Category;
import com.mobileprepaid.entities.Plan;
import com.mobileprepaid.entities.Subscriber;
import com.mobileprepaid.entities.Transaction;
import com.mobileprepaid.services.CategoryService;
import com.mobileprepaid.services.PlanService;
import com.mobileprepaid.services.SubscriberService;
import com.mobileprepaid.utils.MailService;

import jakarta.mail.MessagingException;

@RestController
@PreAuthorize("hasAuthority('SUBSCRIBER')")
@RequestMapping("/subscriber")
public class SubscriberController {

    @Autowired
    private PlanService planService;
    @Autowired
    private CategoryService categoryService;
    @Autowired
    private SubscriberService subscriberService;
    @Autowired
    private MailService mailService;

    
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentSubscriber(Principal principal, @RequestParam(defaultValue = "account") String type) {
        String phoneNumber = principal.getName();
        if ("profile".equalsIgnoreCase(type)) {
            SubscriberProfileDTO profile = subscriberService.getSubscriberProfileDetails(phoneNumber);
            return ResponseEntity.ok(profile);
        } else {
            SubscriberAccountDTO account = subscriberService.getSubscriberAccountDetails(phoneNumber);
            return ResponseEntity.ok(account);
        }
    }

    @PutMapping(value = "/update", consumes = { MediaType.APPLICATION_JSON_VALUE })
    public ResponseEntity<?> updateSubscriber(Principal principal, @RequestBody SubscriberProfileDTO updatedProfile) {
        String phoneNumber = principal.getName();
        SubscriberProfileDTO updated = subscriberService.updateSubscriber(phoneNumber, updatedProfile);
        return ResponseEntity.ok(updated);
    }
    
    @GetMapping("/current-plan")
    public ResponseEntity<?> getCurrentPlan(Principal principal) {
        try {
            if (principal == null) {
                System.out.println("Principal is null - user not authenticated");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
            }
            String phoneNumber = principal.getName();
           System.out.println("Fetching current plan for phoneNumber: {}" + phoneNumber);
            CurrentPlanDTO currentPlan = subscriberService.getCurrentPlan(phoneNumber);
            return (currentPlan != null) ? ResponseEntity.ok(currentPlan) : ResponseEntity.noContent().build();
        } catch (Exception e) {
            System.out.println("Error fetching current plan" + e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An unexpected error occurred: " + e.getMessage());
        }
    }


    @GetMapping("/subscriber-id")
    public ResponseEntity<Long> getSubscriberIdByPhone(@RequestParam String phoneNumber) {
        Long subscriberId = subscriberService.findSubscriberIdByPhoneNumber(phoneNumber);
        return subscriberId != null ? ResponseEntity.ok(subscriberId) : ResponseEntity.notFound().build();
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @GetMapping("/categories/name/{name}")
    public ResponseEntity<Category> getCategoryByName(@PathVariable String name) {
        return ResponseEntity.ok(categoryService.getCategoryByName(name));
    }

    @GetMapping("/plans")
    public ResponseEntity<?> getAllActivePlans(
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
        Page<Plan> plans = planService.getFilteredActivePlans(name, category, dataLimit, validity, pageable);
        if (plans.isEmpty()) 
        	return ResponseEntity.noContent().build();
        Page<PlanDTO> planDTOs = plans.map(PlanDTO::new);
        return ResponseEntity.ok(planDTOs);
    }

    @PostMapping("/recharge")
    public ResponseEntity<Transaction> processRecharge(@RequestBody RechargeRequestDTO request, Principal principal) {
        String phoneNumber = principal.getName();
        Subscriber subscriber = subscriberService.findByPhoneNumber(phoneNumber);
        if (subscriber == null) return ResponseEntity.badRequest().build();

        Transaction transaction = new Transaction();
        transaction.setTransactionId(request.getPaymentId());
        transaction.setRechargeDate(LocalDateTime.now());
        transaction.setSubscriberName(subscriber.getName());
        transaction.setSubscriberNumber(subscriber.getPhoneNumber());
        transaction.setPlanName(request.getPlanName());
        transaction.setPlanPrice(request.getPlanPrice());
        transaction.setPlanValidity(request.getPlanValidity());
        transaction.setPaymentMethod(request.getPaymentMode());
        transaction.setStatus("SUCCESS");
        transaction.setSubscriber(subscriber);
        transaction.setPlanId(request.getPlanId()); 

        Transaction savedTransaction = subscriberService.saveTransaction(transaction);

        try {
            mailService.sendInvoiceEmail(subscriber.getEmail(), savedTransaction);
        } catch (MessagingException e) {
            System.err.println("Failed to send invoice email: " + e.getMessage());
        }

        return ResponseEntity.ok(savedTransaction);
    }
    
    @GetMapping("/transactions")
    public ResponseEntity<List<Transaction>> getSubscriberTransactions() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String phoneNumber = authentication.getName();
        Long subscriberId = subscriberService.findSubscriberIdByPhoneNumber(phoneNumber); // Matches service method
        if (subscriberId == null) return ResponseEntity.status(404).body(null);
        List<Transaction> transactions = subscriberService.getTransactionsBySubscriberId(subscriberId);
        return ResponseEntity.ok(transactions);
    }
}