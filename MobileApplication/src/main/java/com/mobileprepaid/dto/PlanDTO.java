package com.mobileprepaid.dto;

import com.mobileprepaid.entities.Plan;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlanDTO {
    private Long id;
    private String category;
    private String name;
    private double price;
    private int validity; 
    private String dataLimit;
    private String smsLimit;
    private String callLimit;
    private String status;

    public PlanDTO(Plan plan) {
        this.id = plan.getId();
        this.category = plan.getCategoryName();
        this.name = plan.getName();
        this.price = plan.getPrice();
        this.validity = plan.getValidity();
        this.dataLimit = plan.getDataLimit();
        this.smsLimit = plan.getSmsLimit();
        this.callLimit = plan.getCallLimit();
        this.status = plan.getStatus() != null ? plan.getStatus().name() : null;
    }
}