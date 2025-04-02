package com.mobileprepaid.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String transactionId;
    private LocalDateTime rechargeDate;
    private String subscriberName;
    private String subscriberNumber;
    private String planName;
    private Double planPrice;
    private String planValidity;
    private String paymentMethod;
    private String status;
    @Column(name = "plan_id")
    private Long planId;

    @ManyToOne
    @JoinColumn(name = "subscriber_id")
    private Subscriber subscriber;
}