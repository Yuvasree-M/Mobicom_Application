package com.mobileprepaid.dto;

import lombok.*;

@Data
@Getter
@Setter
@RequiredArgsConstructor
public class NotificationDTO {
    private String name;
    private String phone;
    private String email;
    private String subject;
    private String message;
    private String htmlMessage; 
}