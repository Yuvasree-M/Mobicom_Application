package com.mobileprepaid.repository;

import com.mobileprepaid.entities.SubscriberLogin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SubscriberLoginRepository extends JpaRepository<SubscriberLogin, Integer> {
    Optional<SubscriberLogin> findByPhoneNumber(String phoneNumber);
}
