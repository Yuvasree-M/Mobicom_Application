package com.mobileprepaid.services;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Added
import org.springframework.web.server.ResponseStatusException;
import com.mobileprepaid.dto.AdminRegisterRequest;
import com.mobileprepaid.dto.LoginRequest;
import com.mobileprepaid.dto.OtpRequest;
import com.mobileprepaid.dto.SubscriberRegisterRequest;
import com.mobileprepaid.entities.AdminLogin;
import com.mobileprepaid.entities.Role;
import com.mobileprepaid.entities.Subscriber;
import com.mobileprepaid.entities.SubscriberLogin;
import com.mobileprepaid.enums.RoleType;
import com.mobileprepaid.enums.SubscriberStatus;
import com.mobileprepaid.repository.AdminLoginRepository;
import com.mobileprepaid.repository.RoleRepository;
import com.mobileprepaid.repository.SubscriberLoginRepository;
import com.mobileprepaid.repository.SubscriberRepository;
import com.mobileprepaid.security.JwtService;
import com.mobileprepaid.utils.OtpGenerator;
import com.mobileprepaid.utils.SmsService;


@Service
public class AuthService {
    private final SubscriberRepository subscriberRepository;
    private final SubscriberLoginRepository subscriberLoginRepository;
    private final AdminLoginRepository adminLoginRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpGenerator otpGenerator;
    private final SmsService smsService;
    private final JwtService jwtService;

    public AuthService(SubscriberRepository subscriberRepository,
                       SubscriberLoginRepository subscriberLoginRepository,
                       AdminLoginRepository adminLoginRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       OtpGenerator otpGenerator,
                       SmsService smsService,
                       JwtService jwtService) {
        this.subscriberRepository = subscriberRepository;
        this.subscriberLoginRepository = subscriberLoginRepository;
        this.adminLoginRepository = adminLoginRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.otpGenerator = otpGenerator;
        this.smsService = smsService;
        this.jwtService = jwtService;
    }

    @Transactional
    public String registerAdmin(AdminRegisterRequest request) {
        if (adminLoginRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Admin already registered with this email!");
        }

        Role adminRole = roleRepository.findByName(RoleType.ADMIN)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Admin role not found!"));

        AdminLogin admin = new AdminLogin();
        admin.setEmail(request.getEmail());
        admin.setPassword(passwordEncoder.encode(request.getPassword()));
        admin.setRole(adminRole);

        adminLoginRepository.save(admin);
        return "Admin registered successfully!";
    }

    public String loginAdmin(LoginRequest request) {
        AdminLogin admin = adminLoginRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials!"));

        if (!passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials!");
        }

        return jwtService.generateToken(admin.getEmail(), "ADMIN");
    }

    @Transactional
    public String registerSubscriber(SubscriberRegisterRequest request) {
        if (subscriberRepository.findByPhoneNumber(request.getPhoneNumber()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phone number already registered!");
        }
        if (subscriberRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already registered!");
        }

        Role subscriberRole = roleRepository.findById(request.getRoleId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Subscriber role not found!"));

        Subscriber subscriber = new Subscriber();
        subscriber.setName(request.getName());
        subscriber.setEmail(request.getEmail());
        subscriber.setPhoneNumber(request.getPhoneNumber());
        subscriber.setAadharCardPdfPath(request.getAadharCardPdf());
        subscriber.setPassportImagePath(request.getPassportImage());
        subscriber.setStatus(SubscriberStatus.PENDING);
        subscriber.setRole(subscriberRole);
        subscriberRepository.save(subscriber);

        return "Subscriber registered successfully! Waiting for admin approval.";
    }
    public String sendOtp(OtpRequest request) {
        String phoneNumber = request.getPhoneNumber();
        Subscriber subscriber = subscriberRepository.findByPhoneNumber(phoneNumber)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Phone number not registered!"));

        if (SubscriberStatus.INACTIVE.equals(subscriber.getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your account is inactive. Please contact support.");
        } else if (SubscriberStatus.PENDING.equals(subscriber.getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your account is pending approval. Please wait.");
        } else if (!SubscriberStatus.ACTIVE.equals(subscriber.getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your account status is invalid.");
        }

        String generatedOtp = otpGenerator.generateOtp(phoneNumber);
        smsService.sendOtp(phoneNumber, generatedOtp);
        return "OTP sent successfully!";
    }

    public String verifyOtp(OtpRequest request) {
        String phoneNumber = request.getPhoneNumber();
        String otp = request.getOtp();

        if (!otpGenerator.validateOtp(phoneNumber, otp)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid OTP!");
        }
        otpGenerator.clearOtp(phoneNumber);

        SubscriberLogin subscriberLogin = subscriberLoginRepository.findByPhoneNumber(phoneNumber)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subscriber not found!"));

        Subscriber subscriber = subscriberLogin.getSubscriber();
        if (!SubscriberStatus.ACTIVE.equals(subscriber.getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your account is not active. Please contact support.");
        }

        String role = subscriber.getRole().getName().name();
        return jwtService.generateToken(phoneNumber, role);
    }

    public String logoutAdmin(String token) {
        if (token == null || token.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid token!");
        }
        return "Admin logged out successfully!";
    }

    public String logoutSubscriber(String token) {
        if (token == null || token.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid token!");
        }
        return "Subscriber logged out successfully!";
    }
}