package com.mobileprepaid.controllers;

import lombok.RequiredArgsConstructor;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.mobileprepaid.dto.AdminRegisterRequest;
import com.mobileprepaid.dto.SubscriberRegisterRequest;
import com.mobileprepaid.dto.LoginRequest;
import com.mobileprepaid.dto.OtpRequest;
import com.mobileprepaid.services.AuthService;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // Register Admin
    @PostMapping("/register/admin")
    public ResponseEntity<Map<String, String>> registerAdmin(@RequestBody AdminRegisterRequest request) {
        String message = authService.registerAdmin(request);
        
        return ResponseEntity.ok(Map.of("message", message)); 
    }

    // Register Subscriber
    @PostMapping("/register/subscriber")
    public ResponseEntity<Map<String, String>> registerSubscriber(@RequestBody SubscriberRegisterRequest request) {
        String message = authService.registerSubscriber(request);
        return ResponseEntity.ok(Map.of("message", message));
    }


    // Admin Login
    @PostMapping("/login/admin")
    public ResponseEntity<Map<String, String>> loginAdmin(@RequestBody LoginRequest request) {
        String token = authService.loginAdmin(request);
        return ResponseEntity.ok(Map.of("token", token));
    }


 // Send OTP for Subscriber Login
    @PostMapping("/send-otp")
    public ResponseEntity<Map<String, String>> sendOtp(@RequestBody OtpRequest request) {
        try {
            String message = authService.sendOtp(request);
            return ResponseEntity.ok(Map.of("message", message)); 
        } catch (ResponseStatusException ex) {
            return ResponseEntity.status(ex.getStatusCode()).body(Map.of("error", ex.getReason()));
        }
    }

    // Verify OTP for Subscriber Login
    @PostMapping("/login/subscriber")
    public ResponseEntity<Map<String, String>> verifyOtp(@RequestBody OtpRequest request) {
        try {
            String token = authService.verifyOtp(request);
            return ResponseEntity.ok(Map.of("token", token));
        } catch (ResponseStatusException ex) {

            return ResponseEntity.status(ex.getStatusCode()).body(Map.of("error", ex.getReason()));
        }

    }
    // Admin Logout
    @PostMapping("/logout/admin")
    public ResponseEntity<Map<String, String>> logoutAdmin(@RequestHeader(value = "Authorization", required = false) String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or missing token!"));
        }
        token = token.replace("Bearer ", "");
        String message = authService.logoutAdmin(token);
        return ResponseEntity.ok(Map.of("message", message));
    }

    // Subscriber Logout
    @PostMapping("/logout/subscriber")
    public ResponseEntity<Map<String, String>> logoutSubscriber(@RequestHeader(value = "Authorization", required = false) String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or missing token!"));
        }
        token = token.replace("Bearer ", "");
        String message = authService.logoutSubscriber(token);
        return ResponseEntity.ok(Map.of("message", message));
    }

}



