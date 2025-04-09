package com.mobileprepaid.utils;

import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class OtpGenerator {
    private static final int OTP_EXPIRATION_MINUTES = 5;
    private final Map<String, OtpEntry> otpStorage = new ConcurrentHashMap<>();
    private final Random random = new Random();

    public String generateOtp(String phoneNumber) {
        String otp = String.format("%06d", random.nextInt(1000000)); 
        otpStorage.put(phoneNumber, new OtpEntry(otp, LocalDateTime.now().plusMinutes(OTP_EXPIRATION_MINUTES)));
        System.out.println("Generated OTP for " + phoneNumber + ": " + otp); // Debug log
        return otp;
    }
    
    public boolean validateOtp(String phoneNumber, String otp) {
        OtpEntry entry = otpStorage.get(phoneNumber);
        if (entry == null) {
            System.out.println("No OTP found for " + phoneNumber);
            return false;
        }
        if (LocalDateTime.now().isAfter(entry.expiryTime)) {
            System.out.println("OTP expired for " + phoneNumber);
            return false;
        }
        boolean isValid = entry.otp.equals(otp);
        System.out.println("Validating OTP: " + otp + " for " + phoneNumber + " -> " + (isValid ? "Success" : "Failure"));
        return isValid;
    }

    public void clearOtp(String phoneNumber) {
        otpStorage.remove(phoneNumber);
        System.out.println("OTP cleared for " + phoneNumber);
    }

    private static class OtpEntry {
        private final String otp;
        private final LocalDateTime expiryTime;

        public OtpEntry(String otp, LocalDateTime expiryTime) {
            this.otp = otp;
            this.expiryTime = expiryTime;
        }
    }
}