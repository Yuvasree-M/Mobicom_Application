package com.mobileprepaid.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RechargeResponse {
    private String status;
    private String message;
    private String token;

    public RechargeResponse(String status, String message) {
        this.status = status;
        this.message = message;
        this.token = null;
    }
}