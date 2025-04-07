package com.mobileprepaid.services;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.mobileprepaid.dto.CurrentPlanDTO;
import com.mobileprepaid.dto.SubscriberAccountDTO;
import com.mobileprepaid.dto.SubscriberProfileDTO;
import com.mobileprepaid.entities.Plan;
import com.mobileprepaid.entities.Subscriber;
import com.mobileprepaid.entities.Transaction;
import com.mobileprepaid.repository.PlanRepository;
import com.mobileprepaid.repository.SubscriberRepository;
import com.mobileprepaid.repository.TransactionRepository;


@Service
public class SubscriberService {

    @Autowired
    private SubscriberRepository subscriberRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private PlanRepository planRepository;
    
    @Autowired
    private TransactionService transactionService;

    public Long findSubscriberIdByPhoneNumber(String phoneNumber) {
        Subscriber subscriber = subscriberRepository.findByPhoneNumber(phoneNumber).orElse(null);
        return (subscriber != null) ? subscriber.getId() : null;
    }

    public Subscriber findByPhoneNumber(String phoneNumber) {
        return subscriberRepository.findByPhoneNumber(phoneNumber).orElse(null);
    }

    public Subscriber save(Subscriber subscriber) {
        return subscriberRepository.save(subscriber);
    }

    public Transaction saveTransaction(Transaction transaction) {
        return transactionRepository.save(transaction);
    }

    public List<Transaction> getTransactionsBySubscriberId(Long subscriberId) {
        return transactionRepository.findBySubscriberId(subscriberId);
    }

   

    public CurrentPlanDTO getCurrentPlan(String phoneNumber) {
        return transactionService.getLatestTransaction(phoneNumber);
    }

    public SubscriberAccountDTO getSubscriberAccountDetails(String phoneNumber) {
        Subscriber subscriber = subscriberRepository.findByPhoneNumber(phoneNumber).orElse(null);
        if (subscriber == null) {
            return null;
        }
        return new SubscriberAccountDTO(subscriber.getName(), subscriber.getPhoneNumber(), subscriber.getEmail(), subscriber.getPassportImagePath());
    }

    public SubscriberProfileDTO getSubscriberProfileDetails(String phoneNumber) {
        Subscriber subscriber = subscriberRepository.findByPhoneNumber(phoneNumber).orElse(null);
        if (subscriber == null) {
            return null;
        }
        return new SubscriberProfileDTO(
            subscriber.getName(),
            subscriber.getPhoneNumber(),
            subscriber.getEmail(),
            subscriber.getAlternatePhoneNumber(),
            subscriber.getAddress(),
            subscriber.getPassportImagePath()
        );
    }

    public SubscriberProfileDTO updateSubscriber(String phoneNumber, SubscriberProfileDTO updatedProfile) {
        Subscriber subscriber = subscriberRepository.findByPhoneNumber(phoneNumber).orElse(null);
        if (subscriber == null) {
            throw new RuntimeException("Subscriber not found with phone number: " + phoneNumber);
        }

        if (updatedProfile.getName() != null) {
            subscriber.setName(updatedProfile.getName());
        }
        if (updatedProfile.getEmail() != null) {
            subscriber.setEmail(updatedProfile.getEmail());
        }
        if (updatedProfile.getAlternateMobileNumber() != null) {
            subscriber.setAlternatePhoneNumber(updatedProfile.getAlternateMobileNumber());
        }
        if (updatedProfile.getAddress() != null) {
            subscriber.setAddress(updatedProfile.getAddress());
        }
        if (updatedProfile.getProfileImageUrl() != null) {
            subscriber.setPassportImagePath(updatedProfile.getProfileImageUrl());
        }

        subscriberRepository.save(subscriber);

        return new SubscriberProfileDTO(
            subscriber.getName(),
            subscriber.getPhoneNumber(),
            subscriber.getEmail(),
            subscriber.getAlternatePhoneNumber(),
            subscriber.getAddress(),
            subscriber.getPassportImagePath()
        );
    }
}