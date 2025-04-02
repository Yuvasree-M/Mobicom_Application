package com.mobileprepaid.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReportAnalyticsDTO {
    private ReportSummaryDTO summary;
    private ChartDataDTO revenueOverview;
    private ChartDataDTO dailyRecharge;
    private ChartDataDTO rechargePlanPopularity;
    private ChartDataDTO paymentModeUsage;
}