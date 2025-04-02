//package com.mobileprepaid.utils;
//
//import org.springframework.data.redis.core.StringRedisTemplate;
//import org.springframework.stereotype.Service;
//import java.util.concurrent.TimeUnit;
//
//@Service
//public class RedisOtpService {
//
//    private final StringRedisTemplate redisTemplate;
//
//    public RedisOtpService(StringRedisTemplate redisTemplate) {
//        this.redisTemplate = redisTemplate;
//    }
//
//    public void storeOtp(String phoneNumber, String otp) {
//        redisTemplate.opsForValue().set(phoneNumber, otp, 5, TimeUnit.MINUTES);
//    }
//
//    public String getOtp(String phoneNumber) {
//        return redisTemplate.opsForValue().get(phoneNumber);
//    }
//
//    public void deleteOtp(String phoneNumber) {
//        redisTemplate.delete(phoneNumber);
//    }
//}
