package com.eventhub.authservice.Entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users_credentials")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserCredential {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role; // e.g., "ROLE_CUSTOMER", "ROLE_ORGANIZER", "ROLE_ADMIN"
}