package com.mobileprepaid.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdminProfileDTO {
    private Long id;
    private String username;
    private String email;
    private String contact;
    private String address;
    private String password; 
    private String profileImage; 
}