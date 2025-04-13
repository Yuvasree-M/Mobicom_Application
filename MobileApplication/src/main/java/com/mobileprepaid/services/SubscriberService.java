package com.mobileprepaid.services;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.mobileprepaid.dto.CurrentPlanDTO;
import com.mobileprepaid.dto.SubscriberAccountDTO;
import com.mobileprepaid.dto.SubscriberProfileDTO;
import com.mobileprepaid.entities.Subscriber;
import com.mobileprepaid.entities.Transaction;
import com.mobileprepaid.exceptions.SubscriberNotFoundException;
import com.mobileprepaid.repository.PlanRepository;
import com.mobileprepaid.repository.SubscriberRepository;
import com.mobileprepaid.repository.TransactionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SubscriberService {

    private final SubscriberRepository subscriberRepository;
    private final TransactionRepository transactionRepository;
    private final PlanRepository planRepository;
    private final TransactionService transactionService;

    public Long findSubscriberIdByPhoneNumber(String phoneNumber) {
        return subscriberRepository.findByPhoneNumber(phoneNumber)
                .map(Subscriber::getId)
                .orElse(null);
    }

    public Subscriber findByPhoneNumber(String phoneNumber) {
        return subscriberRepository.findByPhoneNumber(phoneNumber)
                .orElseThrow(() -> new SubscriberNotFoundException("Subscriber not found with phone number: " + phoneNumber));
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
        Subscriber subscriber = findByPhoneNumber(phoneNumber); // This will throw SubscriberNotFoundException if not found
        return new SubscriberAccountDTO(subscriber.getName(), subscriber.getPhoneNumber(), subscriber.getEmail(), subscriber.getPassportImagePath());
    }

    public SubscriberProfileDTO getSubscriberProfileDetails(String phoneNumber) {
        Subscriber subscriber = findByPhoneNumber(phoneNumber); // This will throw SubscriberNotFoundException if not found
        return mapToSubscriberProfileDTO(subscriber);
    }

    public SubscriberProfileDTO updateSubscriber(String phoneNumber, SubscriberProfileDTO updatedProfile) {
        Subscriber subscriber = findByPhoneNumber(phoneNumber); // This will throw SubscriberNotFoundException if not found

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
        return mapToSubscriberProfileDTO(subscriber);
    }

    private SubscriberProfileDTO mapToSubscriberProfileDTO(Subscriber subscriber) {
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
