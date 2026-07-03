package com.audittrail.repository;

import com.audittrail.entity.BatchUpload;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BatchUploadRepository extends JpaRepository<BatchUpload, Long> {
    List<BatchUpload> findAllByOrderByUploadedAtDesc();
}
