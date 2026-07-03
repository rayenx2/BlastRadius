package com.audittrail.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "batch_uploads")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatchUpload {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String filename;

    @Column(nullable = false)
    private String uploadedBy;

    @Column(nullable = false)
    private int totalRecords;

    @Column(nullable = false)
    private int successfulRecords;

    @Column(nullable = false)
    private int skippedRecords;

    @Column(nullable = false)
    private long processingTimeMs;

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    @PrePersist
    protected void onCreate() {
        if (uploadedAt == null) {
            uploadedAt = LocalDateTime.now();
        }
    }
}
