package com.mobileprepaid.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.Key;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtService {

    private static final Logger logger = LoggerFactory.getLogger(JwtService.class);

    private final Key key;
    private final long expiration;

    public JwtService(@Value("${jwt.secret}") String secret,
                      @Value("${jwt.expiration}") long expiration) {
        if (secret == null || secret.length() < 32) {
            logger.error("JWT Secret Key must be at least 32 characters long!");
            throw new IllegalArgumentException("JWT Secret must be at least 32 characters long.");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.expiration = expiration;
    }

    public String generateToken(String username, String role) {
        return Jwts.builder()
                .setId(UUID.randomUUID().toString()) // Unique ID (jti) for revocation
                .setSubject(username)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return getClaims(token).getSubject();
    }

    public String extractUserRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    public String extractJti(String token) {
        return getClaims(token).getId();
    }

    public long getTokenExpiry(String token) {
        return getClaims(token).getExpiration().getTime();
    }

    public boolean validateToken(String token) {
        try {
            getClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            logger.warn("JWT Token Expired: {}", e.getMessage());
        } catch (JwtException e) {
            logger.warn("JWT Validation Error: {}", e.getMessage());
        }
        return false;
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
