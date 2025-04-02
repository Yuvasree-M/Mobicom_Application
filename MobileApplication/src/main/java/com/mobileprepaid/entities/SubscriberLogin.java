package com.mobileprepaid.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "subscriber_login")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SubscriberLogin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "subscriber_id", nullable = false, unique = true)
    private Subscriber subscriber;

    @Column(unique = true, nullable = false)
    private String phoneNumber;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @PreUpdate
    @PrePersist
    protected void updateLastLogin() {
        this.lastLogin = LocalDateTime.now(); 
    }
}
