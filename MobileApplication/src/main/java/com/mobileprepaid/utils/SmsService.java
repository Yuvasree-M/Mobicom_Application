package com.mobileprepaid.utils;

import org.springframework.stereotype.Service;

@Service
public class SmsService {

    public void sendOtp(String phoneNumber, String otp) {
        String otpMessage = "Your OTP code is: " + otp;
        System.out.println("Sending OTP to " + phoneNumber + ": " + otpMessage);
    }
}

//
//package com.mobileprepaid.utils;
//
//import com.twilio.Twilio;
//import com.twilio.rest.api.v2010.account.Message;
//import com.twilio.type.PhoneNumber;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.stereotype.Service;
//
//@Service
//public class SmsService {
//    
//    private final String accountSid;
//    private final String authToken;
//    private final String twilioPhoneNumber;
//    
//    private static final String code = "+91";
//    
//    public SmsService(
//        @Value("${twilio.accountSid}") 
//        String accountSid,
//        @Value("${twilio.authToken}") 
//        
//        String authToken,
//        @Value("${twilio.phoneNumber}") 
//        String twilioPhoneNumber
//    ) {
//        this.accountSid = accountSid;
//        this.authToken = authToken;
//        this.twilioPhoneNumber = twilioPhoneNumber;
//        Twilio.init(accountSid, authToken);
//    }
//    
//    public void sendOtp(String phoneNumber, String otp) {
//        try {
//            if (phoneNumber == null || !phoneNumber.matches("\\d{10}")) {
//                throw new IllegalArgumentException("Invalid phone number: " + phoneNumber);
//            }
//            
//            String fullPhoneNumber = code + phoneNumber;
//            String otpMessage = "Your OTP code is: " + otp;
//            
//            System.out.println("Sending OTP from: " + twilioPhoneNumber + " to: " + fullPhoneNumber);
//            
//            Message message = Message.creator(
//                new PhoneNumber(fullPhoneNumber),    
//                new PhoneNumber(twilioPhoneNumber),   
//                otpMessage
//            ).create();
//            
//            System.out.println("OTP sent successfully to " + fullPhoneNumber + 
//                ". Message SID: " + message.getSid());
//                
//        } catch (Exception e) {
//            System.err.println("Failed to send OTP to " + phoneNumber + 
//                ": " + e.getMessage());
//            throw new RuntimeException("SMS sending failed", e);
//        }
//    }
//
//
//}