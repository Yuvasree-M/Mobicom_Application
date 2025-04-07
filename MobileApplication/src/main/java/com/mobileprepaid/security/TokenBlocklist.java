package com.mobileprepaid.security;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class TokenBlocklist {

    private final Map<String, Long> revokedTokens = new ConcurrentHashMap<>();

    public void revokeToken(String jti, long expirationTimeMillis) {
        revokedTokens.put(jti, expirationTimeMillis);
    }

    public boolean isRevoked(String jti) {
        Long expiry = revokedTokens.get(jti);
        if (expiry == null) return false;
        if (Instant.now().toEpochMilli() > expiry) {
            revokedTokens.remove(jti);
            return false;
        }
        return true;
    }

    public void cleanupExpiredTokens() {
        long now = Instant.now().toEpochMilli();
        revokedTokens.entrySet().removeIf(entry -> entry.getValue() < now);
    }
}
