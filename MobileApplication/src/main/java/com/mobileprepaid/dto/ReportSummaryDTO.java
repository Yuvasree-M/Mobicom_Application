package com.mobileprepaid.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReportSummaryDTO {
    private String totalRevenue;
    private int totalRecharge;
    private int newSubscribers;
}