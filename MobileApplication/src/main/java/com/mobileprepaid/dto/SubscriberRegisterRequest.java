package com.mobileprepaid.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SubscriberRegisterRequest {
    private String name;
    private String email;
    private String phoneNumber;
    private String aadharCardPdf; 
    private String passportImage;
    private Long roleId;
}