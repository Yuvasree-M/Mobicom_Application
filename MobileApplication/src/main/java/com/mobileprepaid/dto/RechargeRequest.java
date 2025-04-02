package com.mobileprepaid.dto;

import lombok.Data;

@Data
public class RechargeRequest {
    private String mobileNumber;
    private Long planId;
    private String planName;
    private Double planPrice;
    private String planValidity;
    private String paymentId;
    private String paymentMode;
}