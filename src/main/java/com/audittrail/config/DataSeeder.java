package com.audittrail.config;

import com.audittrail.entity.User;
import com.audittrail.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds a demo admin account on first boot so the README's documented
 * default credentials actually work against a fresh database.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.existsByUsername("admin_user")) {
            return;
        }

        User admin = User.builder()
                .username("admin_user")
                .email("admin@blastradius.dev")
                .passwordHash(passwordEncoder.encode("AdminPass123!"))
                .role(User.UserRole.ADMIN)
                .build();

        userRepository.save(admin);
    }
}
