package com.mobileprepaid.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CurrentPlanDTO {
    private String planName;
    private double planPrice;
    private int validity;
    private String calls;
    private String sms;
    private String data;
    private int daysLeft;
}