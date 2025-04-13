package com.mobileprepaid.repository;

import com.mobileprepaid.entities.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findBySubscriberId(Long subscriberId);

    @Query("SELECT t FROM Transaction t WHERE t.subscriber.phoneNumber = :phoneNumber ORDER BY t.rechargeDate DESC LIMIT 1")
    Transaction findLatestBySubscriberPhoneNumber(@Param("phoneNumber") String phoneNumber);

    Page<Transaction> findAll(Pageable pageable);
    @Query("SELECT t FROM Transaction t WHERE " +
            "(:status IS NULL OR t.status = :status) AND " +
            "(:paymentMethod IS NULL OR t.paymentMethod = :paymentMethod) AND " +
            "(:fromDate IS NULL OR t.rechargeDate >= :fromDate) AND " +
            "(:toDate IS NULL OR t.rechargeDate <= :toDate)")
    Page<Transaction> findWithFilters(@Param("status") String status,
                                      @Param("paymentMethod") String paymentMethod,
                                      @Param("fromDate") String fromDate,
                                      @Param("toDate") String toDate,
                                      Pageable pageable);
    @Query("SELECT SUM(t.planPrice) FROM Transaction t WHERE t.rechargeDate >= :startOfMonth AND t.rechargeDate <= :endOfMonth AND t.status = 'SUCCESS'")
    Double getTotalRevenueThisMonth(LocalDateTime startOfMonth, LocalDateTime endOfMonth);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.rechargeDate >= :startOfMonth AND t.rechargeDate <= :endOfMonth AND t.status = 'SUCCESS'")
    Long getTotalTransactionCountThisMonth(LocalDateTime startOfMonth, LocalDateTime endOfMonth);

    @Query("SELECT DATE(t.rechargeDate), SUM(t.planPrice) FROM Transaction t " +
           "WHERE t.rechargeDate >= :startOfMonth AND t.rechargeDate <= :endOfMonth AND t.status = 'SUCCESS' " +
           "GROUP BY DATE(t.rechargeDate)")
    List<Object[]> getDailyRevenueThisMonth(LocalDateTime startOfMonth, LocalDateTime endOfMonth);

    @Query("SELECT t.paymentMethod, COUNT(t) FROM Transaction t " +
           "WHERE t.rechargeDate >= :startOfMonth AND t.rechargeDate <= :endOfMonth AND t.status = 'SUCCESS' " +
           "GROUP BY t.paymentMethod")
    List<Object[]> getPaymentModeUsageThisMonth(LocalDateTime startOfMonth, LocalDateTime endOfMonth);

    @Query("SELECT DATE(t.rechargeDate), COUNT(t) FROM Transaction t " +
           "WHERE t.rechargeDate >= :startOfMonth AND t.rechargeDate <= :endOfMonth AND t.status = 'SUCCESS' " +
           "GROUP BY DATE(t.rechargeDate)")
    List<Object[]> getDailyRechargeCountsThisMonth(LocalDateTime startOfMonth, LocalDateTime endOfMonth);

    @Query("SELECT t.planName, COUNT(t) FROM Transaction t " +
           "WHERE t.rechargeDate >= :startOfMonth AND t.rechargeDate <= :endOfMonth AND t.status = 'SUCCESS' " +
           "GROUP BY t.planName")
    List<Object[]> getRechargePlanPopularityThisMonth(LocalDateTime startOfMonth, LocalDateTime endOfMonth);
}