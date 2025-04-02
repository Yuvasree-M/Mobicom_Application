package com.mobileprepaid.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminRegisterRequest {
    private String email;
    private String password;
    private Long roleId;
}
