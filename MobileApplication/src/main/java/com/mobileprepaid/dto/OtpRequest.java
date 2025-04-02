package com.mobileprepaid.dto;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OtpRequest {
    private String phoneNumber;
    private String otp;
    
}