package com.mobileprepaid.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardDTO {
    private long totalSubscribers;
    private long activePlans;
    private long expiringSubscribersCount;
    private Map<String, Double> monthlyRevenue; 
    private List<ExpiringSubscriberDTO> expiringSubscribers;
}

