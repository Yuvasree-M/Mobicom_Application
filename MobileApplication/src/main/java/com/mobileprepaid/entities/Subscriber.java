package com.mobileprepaid.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import com.mobileprepaid.enums.SubscriberStatus;

@Entity
@Table(name = "subscribers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Subscriber {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(unique = true, nullable = false)
    private String phoneNumber;

    private String alternatePhoneNumber;
    private String address;

    @Column(name = "aadhar_card_pdf", columnDefinition = "LONGTEXT")
    private String aadharCardPdfPath;

    @Column(name = "passport_image", columnDefinition = "LONGTEXT")
    private String passportImagePath;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriberStatus status = SubscriberStatus.PENDING;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}