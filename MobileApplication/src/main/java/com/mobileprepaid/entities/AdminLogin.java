package com.mobileprepaid.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "admin")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "password")
public class AdminLogin {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @Column(name = "username", unique = true, nullable = false)
    private String username;

    @Column(name = "email", unique = true, nullable = false)
    private String email;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "contact")
    private String contact;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "profile_image", columnDefinition = "TEXT")
    private String profileImage;

    @ManyToOne
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;
}