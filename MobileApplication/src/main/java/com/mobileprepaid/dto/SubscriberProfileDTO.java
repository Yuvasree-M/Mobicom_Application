package com.mobileprepaid.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubscriberProfileDTO {
    private String name;
    private String phoneNumber;
    private String email;
    private String alternateMobileNumber;
    private String address;
    private String profileImageUrl;
}