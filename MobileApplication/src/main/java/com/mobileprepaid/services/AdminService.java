package com.mobileprepaid.services;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.mobileprepaid.entities.AdminLogin;
import com.mobileprepaid.entities.Subscriber;
import com.mobileprepaid.enums.SubscriberStatus;
import com.mobileprepaid.repository.AdminLoginRepository;
import com.mobileprepaid.repository.SubscriberRepository;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.List;

@Service
public class AdminService {
    private final SubscriberRepository subscriberRepository;

    public AdminService(SubscriberRepository subscriberRepository,AdminLoginRepository adminLoginRepository, PasswordEncoder passwordEncoder) {
        this.subscriberRepository = subscriberRepository;
        this.adminLoginRepository = adminLoginRepository;
        this.passwordEncoder = passwordEncoder;
    }
    
    private final AdminLoginRepository adminLoginRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    private AdminLoginRepository adminRepository;
  
    public Page<Subscriber> getSubscribersByStatus(SubscriberStatus status, Pageable pageable) {
        return subscriberRepository.findByStatus(status, pageable);
    }

    public AdminLogin getAdminProfile(String email) {
        Optional<AdminLogin> admin = adminRepository.findByEmail(email);
        AdminLogin adminLogin = admin.orElseThrow(() -> new RuntimeException("Admin profile not found for email: " + email));
        
        if (adminLogin.getProfileImage() != null && !adminLogin.getProfileImage().startsWith("data:image")) {
            try {
                byte[] imageBytes = Files.readAllBytes(Paths.get(adminLogin.getProfileImage())); // Use Paths.get instead of Path.of
                String base64Image = "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(imageBytes);
                adminLogin.setProfileImage(base64Image);
            } catch (Exception e) {
                System.err.println("Error converting image to Base64: " + e.getMessage());
                adminLogin.setProfileImage(null);
            }
        }
        return adminLogin;
    }

    public AdminLogin updateAdminProfile(String email, AdminLogin adminLogin) {
        Optional<AdminLogin> existingAdminOpt = adminRepository.findByEmail(email);
        if (existingAdminOpt.isEmpty()) {
            throw new RuntimeException("Admin profile not found for email: " + email);
        }

        AdminLogin existingAdmin = existingAdminOpt.get();

        if (adminLogin.getUsername() != null) existingAdmin.setUsername(adminLogin.getUsername());
        if (adminLogin.getContact() != null) existingAdmin.setContact(adminLogin.getContact());
        if (adminLogin.getAddress() != null) existingAdmin.setAddress(adminLogin.getAddress());
        if (adminLogin.getPassword() != null && !adminLogin.getPassword().isEmpty()) {
            existingAdmin.setPassword(passwordEncoder.encode(adminLogin.getPassword()));
        }
        if (adminLogin.getProfileImage() != null && adminLogin.getProfileImage().startsWith("data:image")) {
            existingAdmin.setProfileImage(adminLogin.getProfileImage());
        }

        return adminRepository.save(existingAdmin);
    }
    
    public List<Subscriber> getAllSubscribers() {
        return subscriberRepository.findAll();
    }

    public Subscriber updateSubscriberStatus(Long subscriberId, String status) {
        Subscriber subscriber = subscriberRepository.findById(subscriberId)
                .orElseThrow(() -> new IllegalArgumentException("Subscriber not found!"));
        subscriber.setStatus(SubscriberStatus.valueOf(status.toUpperCase()));
        return subscriberRepository.save(subscriber);
    }
}
