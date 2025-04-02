package com.mobileprepaid.services;

import com.mobileprepaid.dto.RechargeRequest;
import com.mobileprepaid.entities.Subscriber;
import com.mobileprepaid.entities.Transaction;
import com.mobileprepaid.enums.SubscriberStatus;
import com.mobileprepaid.repository.SubscriberRepository;
import com.mobileprepaid.repository.TransactionRepository;
import com.mobileprepaid.utils.MailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class QuickRechargeService {


    @Autowired
    private SubscriberRepository subscriberRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private MailService mailService;

    public String validateAndRecharge(String phoneNumber) {
        String normalizedNumber = phoneNumber.trim();
        if (!normalizedNumber.matches("\\d{10}")) {
            return "ERROR: Invalid 10-digit number";
        }

        Optional<Subscriber> subscriberOpt = subscriberRepository.findByPhoneNumber(normalizedNumber);
        if (!subscriberOpt.isPresent()) {
            return "ERROR: Number not registered";
        }

        Subscriber subscriber = subscriberOpt.get();
        if (subscriber.getStatus() == SubscriberStatus.PENDING) {
            return "ERROR: Number pending approval";
        } else if (subscriber.getStatus() == SubscriberStatus.INACTIVE) {
            return "ERROR: Number inactive";
        } else if (subscriber.getStatus() == SubscriberStatus.ACTIVE) {
            return "SUCCESS: Number validated";
        }
        return "ERROR: Unknown error";
    }

    @Transactional
    public Transaction processRecharge(RechargeRequest request) {
        Optional<Subscriber> subscriberOpt = subscriberRepository.findByPhoneNumber(request.getMobileNumber());
        if (!subscriberOpt.isPresent()) {
            throw new IllegalArgumentException("Number not found");
        }

        Subscriber subscriber = subscriberOpt.get();

        Transaction transaction = new Transaction();
        transaction.setSubscriber(subscriber);
        transaction.setTransactionId(request.getPaymentId());
        transaction.setRechargeDate(LocalDateTime.now());
        transaction.setSubscriberName(subscriber.getName());
        transaction.setSubscriberNumber(request.getMobileNumber());
        transaction.setPlanName(request.getPlanName());
        transaction.setPlanPrice(request.getPlanPrice());
        transaction.setPlanValidity(request.getPlanValidity());
        transaction.setPaymentMethod(request.getPaymentMode());
        transaction.setStatus("SUCCESS");
        transaction.setPlanId(request.getPlanId());
        transactionRepository.save(transaction);

        try {
            mailService.sendInvoiceEmail(subscriber.getEmail(), transaction);
        } catch (Exception e) {
            System.err.println("Failed to send invoice email: " + e.getMessage());
        }

        return transaction;
    }
}