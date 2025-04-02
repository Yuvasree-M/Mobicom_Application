package com.mobileprepaid.repository;

import com.mobileprepaid.entities.AdminLogin;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AdminLoginRepository extends JpaRepository<AdminLogin, Long> {
    Optional<AdminLogin> findByEmail(String email);
}
