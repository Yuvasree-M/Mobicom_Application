package com.mobileprepaid.dto;


import lombok.*;

@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class RechargeRequestDTO {
    private Long subscriberId;
    private Long planId;
    private String planName;
    private double planPrice;
    private String planValidity;
    private String paymentMode;
    private String paymentId;
}
