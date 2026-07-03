package com.audittrail.controller;

import com.audittrail.entity.Deployment;
import com.audittrail.entity.MetadataChange;
import com.audittrail.entity.Release;
import com.audittrail.repository.DeploymentRepository;
import com.audittrail.repository.MetadataChangeRepository;
import com.audittrail.repository.ReleaseRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Audit-trail summary statistics for the dashboard.
 * Added by Rayen Lassoued (Blastradius enhancement).
 */
@RestController
@RequestMapping("/api/stats")
@Tag(name = "Statistics", description = "Audit trail summary statistics and activity overview")
@SecurityRequirement(name = "Bearer Authentication")
public class StatsController {

    @Autowired
    private DeploymentRepository deploymentRepository;

    @Autowired
    private MetadataChangeRepository metadataChangeRepository;

    @Autowired
    private ReleaseRepository releaseRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DEVELOPER', 'VIEWER')")
    @Operation(summary = "Get audit trail summary statistics",
            description = "Returns aggregate counts by risk level, environment, deployment status, "
                    + "metadata change type, release status, and the most recent activity timeline.")
    public ResponseEntity<Map<String, Object>> getStats() {
        List<Deployment> deployments = deploymentRepository.findAll();
        List<MetadataChange> metadataChanges = metadataChangeRepository.findAll();
        List<Release> releases = releaseRepository.findAll();

        Map<String, Object> stats = new HashMap<>();

        stats.put("totalDeployments", deployments.size());
        stats.put("totalMetadataChanges", metadataChanges.size());
        stats.put("totalReleases", releases.size());

        stats.put("deploymentsByRiskLevel", deployments.stream()
                .filter(d -> d.getRiskLevel() != null)
                .collect(Collectors.groupingBy(d -> d.getRiskLevel().name(), Collectors.counting())));

        stats.put("deploymentsByEnvironment", deployments.stream()
                .filter(d -> d.getEnvironment() != null)
                .collect(Collectors.groupingBy(Deployment::getEnvironment, Collectors.counting())));

        stats.put("deploymentsByStatus", deployments.stream()
                .filter(d -> d.getStatus() != null)
                .collect(Collectors.groupingBy(d -> d.getStatus().name(), Collectors.counting())));

        stats.put("metadataChangesByType", metadataChanges.stream()
                .filter(m -> m.getChangeType() != null)
                .collect(Collectors.groupingBy(m -> m.getChangeType().name(), Collectors.counting())));

        stats.put("releasesByStatus", releases.stream()
                .filter(r -> r.getStatus() != null)
                .collect(Collectors.groupingBy(r -> r.getStatus().name(), Collectors.counting())));

        long highRiskCount = deployments.stream()
                .filter(d -> d.getRiskLevel() == Deployment.RiskLevel.HIGH)
                .count();
        stats.put("highRiskDeployments", highRiskCount);

        // Recent activity: combine latest deployments and metadata changes into one timeline
        List<Map<String, Object>> recentActivity = Stream.concat(
                deployments.stream().map(this::deploymentToActivity),
                metadataChanges.stream().map(this::metadataChangeToActivity)
        )
                .sorted(Comparator.comparing((Map<String, Object> a) -> (LocalDateTime) a.get("timestamp")).reversed())
                .limit(10)
                .collect(Collectors.toList());

        stats.put("recentActivity", recentActivity);
        stats.put("generatedAt", LocalDateTime.now());

        return ResponseEntity.ok(stats);
    }

    private Map<String, Object> deploymentToActivity(Deployment d) {
        Map<String, Object> entry = new HashMap<>();
        entry.put("type", "DEPLOYMENT");
        entry.put("description", "Deployment '" + d.getName() + "' to " + d.getEnvironment()
                + " (" + d.getStatus() + ")");
        entry.put("riskLevel", d.getRiskLevel() != null ? d.getRiskLevel().name() : null);
        entry.put("actor", d.getDeployedBy());
        entry.put("timestamp", d.getDeploymentTime() != null ? d.getDeploymentTime() : d.getCreatedAt());
        return entry;
    }

    private Map<String, Object> metadataChangeToActivity(MetadataChange m) {
        Map<String, Object> entry = new HashMap<>();
        entry.put("type", "METADATA_CHANGE");
        entry.put("description", m.getChangeType() + " " + m.getComponentType()
                + " '" + m.getComponentName() + "'");
        entry.put("riskLevel", null);
        entry.put("actor", m.getChangedBy());
        entry.put("timestamp", m.getChangedAt());
        return entry;
    }
}
