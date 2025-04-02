package com.mobileprepaid.services;

import com.mobileprepaid.dto.ChartDataDTO;
import com.mobileprepaid.dto.ReportAnalyticsDTO;
import com.mobileprepaid.dto.ReportSummaryDTO;
import com.mobileprepaid.repository.SubscriberRepository;
import com.mobileprepaid.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.text.DecimalFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class ReportService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private SubscriberRepository subscriberRepository;

    public ReportAnalyticsDTO getReportAnalytics() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfMonth = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfMonth = now.withDayOfMonth(now.getMonth().length(now.toLocalDate().isLeapYear()))
                                    .withHour(23).withMinute(59).withSecond(59).withNano(999999999);

        
        Double totalRevenue = transactionRepository.getTotalRevenueThisMonth(startOfMonth, endOfMonth);
        if (totalRevenue == null) totalRevenue = 0.0;
        DecimalFormat df = new DecimalFormat("#,###.##");
        String formattedRevenue = "₹" + df.format(totalRevenue);

        Long totalRecharge = transactionRepository.getTotalTransactionCountThisMonth(startOfMonth, endOfMonth);
        if (totalRecharge == null) totalRecharge = 0L;

        Long newSubscribers = subscriberRepository.getNewSubscribersThisMonth(startOfMonth, endOfMonth);
        if (newSubscribers == null) newSubscribers = 0L;

        ReportSummaryDTO summary = new ReportSummaryDTO(formattedRevenue, totalRecharge.intValue(), newSubscribers.intValue());

   
        List<Object[]> dailyRevenueData = transactionRepository.getDailyRevenueThisMonth(startOfMonth, endOfMonth);
        List<String> revenueDates = new ArrayList<>();
        List<Double> revenueValues = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        for (Object[] row : dailyRevenueData) {
            revenueDates.add(((java.sql.Date) row[0]).toLocalDate().format(formatter));
            revenueValues.add(((Number) row[1]).doubleValue());
        }
        ChartDataDTO revenueOverview = new ChartDataDTO(revenueDates, revenueValues);

       
        List<Object[]> dailyRechargeData = transactionRepository.getDailyRechargeCountsThisMonth(startOfMonth, endOfMonth);
        List<String> rechargeDates = new ArrayList<>();
        List<Double> rechargeValues = new ArrayList<>();
        for (Object[] row : dailyRechargeData) {
            rechargeDates.add(((java.sql.Date) row[0]).toLocalDate().format(formatter));
            rechargeValues.add(((Number) row[1]).doubleValue());
        }
        ChartDataDTO dailyRecharge = new ChartDataDTO(rechargeDates, rechargeValues);

      
        List<Object[]> planPopularityData = transactionRepository.getRechargePlanPopularityThisMonth(startOfMonth, endOfMonth);
        List<String> plans = new ArrayList<>();
        List<Double> planValues = new ArrayList<>();
        for (Object[] row : planPopularityData) {
            plans.add((String) row[0]);
            planValues.add(((Number) row[1]).doubleValue());
        }
        ChartDataDTO rechargePlanPopularity = new ChartDataDTO(plans, planValues);

    
        List<Object[]> paymentModeData = transactionRepository.getPaymentModeUsageThisMonth(startOfMonth, endOfMonth);
        List<String> modes = new ArrayList<>();
        List<Double> modeValues = new ArrayList<>();
        for (Object[] row : paymentModeData) {
            modes.add((String) row[0]);
            modeValues.add(((Number) row[1]).doubleValue());
        }
        ChartDataDTO paymentModeUsage = new ChartDataDTO(modes, modeValues);

        return new ReportAnalyticsDTO(summary, revenueOverview, dailyRecharge, rechargePlanPopularity, paymentModeUsage);
    }
}