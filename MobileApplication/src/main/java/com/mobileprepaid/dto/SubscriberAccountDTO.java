package com.mobileprepaid.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubscriberAccountDTO {
    private String name;
    private String phoneNumber;
    private String email;
    private String profileImageUrl; 
}