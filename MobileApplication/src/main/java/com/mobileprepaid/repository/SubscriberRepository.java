package com.mobileprepaid.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.mobileprepaid.entities.Subscriber;
import com.mobileprepaid.enums.SubscriberStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SubscriberRepository extends JpaRepository<Subscriber, Long> {
    
    Optional<Subscriber> findByEmail(String email);
    
    Optional<Subscriber> findByPhoneNumber(String phoneNumber);
    
    Optional<Subscriber> findById(Long id);
    
    @Query("SELECT s FROM Subscriber s WHERE " +
            "(:search IS NULL OR TRIM(LOWER(s.name)) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR TRIM(LOWER(s.email)) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR TRIM(LOWER(s.phoneNumber)) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Subscriber> searchSubscribers(@Param("search") String search, Pageable pageable);
    List<Subscriber> findByStatus(@Param("status") SubscriberStatus status);
    
    Page<Subscriber> findByStatus(@Param("status") SubscriberStatus status, Pageable pageable);
    long countByStatus(@Param("status") SubscriberStatus status);

    @Query("SELECT COUNT(s) FROM Subscriber s WHERE s.createdAt >= :startOfMonth AND s.createdAt <= :endOfMonth")
    Long getNewSubscribersThisMonth(LocalDateTime startOfMonth, LocalDateTime endOfMonth);
}
