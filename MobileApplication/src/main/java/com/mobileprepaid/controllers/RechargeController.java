package com.mobileprepaid.controllers;

import com.mobileprepaid.dto.RechargeRequest;
import com.mobileprepaid.dto.RechargeResponse;
import com.mobileprepaid.entities.Transaction;
import com.mobileprepaid.security.JwtService;
import com.mobileprepaid.services.QuickRechargeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/quick")
public class RechargeController {

    @Autowired
    private QuickRechargeService rechargeService;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/recharge")
    public ResponseEntity<?> quickRecharge(@RequestBody RechargeRequest request) {
        try {
            String phoneNumber = request.getMobileNumber();
            if (phoneNumber == null || !phoneNumber.matches("\\d{10}")) {
                return ResponseEntity.badRequest()
                    .body(new RechargeResponse("ERROR", "Invalid mobile number"));
            }
            String result = rechargeService.validateAndRecharge(phoneNumber);
            if (result.startsWith("SUCCESS")) {
                String token = jwtService.generateToken(phoneNumber, "SUBSCRIBER");
                return ResponseEntity.ok(new RechargeResponse("SUCCESS", "Proceed to select a plan", token));
            } else {
                return ResponseEntity.badRequest()
                    .body(new RechargeResponse("ERROR", result.substring(7)));
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(new RechargeResponse("ERROR", "Validation error: " + e.getMessage()));
        }
    }

    @PostMapping("/process-recharge")
    public ResponseEntity<?> processRecharge(@RequestBody RechargeRequest request) {
        try {
            Transaction transaction = rechargeService.processRecharge(request);
            return ResponseEntity.ok(transaction);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(new RechargeResponse("ERROR", "Recharge processing failed: " + e.getMessage()));
        }
    }
}