package com.audittrail.controller;

import com.audittrail.entity.Deployment;
import com.audittrail.entity.MetadataChange;
import com.audittrail.repository.DeploymentRepository;
import com.audittrail.repository.MetadataChangeRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Audit log CSV export endpoints — produces RFC 4180-compliant CSV files
 * ready to attach as ISO 27001 / SOC 2 change-management evidence.
 *
 * Added by Rayen Lassoued (Blastradius enhancement).
 */
@RestController
@RequestMapping("/api/export")
@Tag(name = "Export", description = "Audit log CSV export for compliance evidence packages")
@SecurityRequirement(name = "Bearer Authentication")
public class ExportController {

    private static final DateTimeFormatter ISO_FORMAT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    @Autowired
    private DeploymentRepository deploymentRepository;

    @Autowired
    private MetadataChangeRepository metadataChangeRepository;

    /**
     * Stream the full deployment audit log as an RFC 4180 CSV.
     * Optional ?environment= and ?riskLevel= query params narrow the export.
     */
    @GetMapping("/deployments.csv")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEVELOPER', 'VIEWER')")
    @Operation(
            summary = "Export deployment audit log as CSV",
            description = "Streams all deployment records as an RFC 4180 CSV file. "
                    + "Supports optional filtering by environment and/or risk level. "
                    + "The file is download-ready for ISO 27001 / SOC 2 audit evidence packages."
    )
    public void exportDeploymentsCsv(
            @Parameter(description = "Filter by environment (e.g. PRODUCTION, STAGING, TEST, DEV)")
            @RequestParam(required = false) String environment,
            @Parameter(description = "Filter by risk level (HIGH, MEDIUM, LOW)")
            @RequestParam(required = false) String riskLevel,
            HttpServletResponse response) throws IOException {

        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition",
                "attachment; filename=\"audittrail-deployments-" + timestamp() + ".csv\"");

        List<Deployment> deployments = deploymentRepository.findAll();

        if (environment != null && !environment.isBlank()) {
            String envFilter = environment.toUpperCase();
            deployments = deployments.stream()
                    .filter(d -> envFilter.equals(d.getEnvironment() != null
                            ? d.getEnvironment().toUpperCase() : ""))
                    .toList();
        }

        if (riskLevel != null && !riskLevel.isBlank()) {
            String riskFilter = riskLevel.toUpperCase();
            deployments = deployments.stream()
                    .filter(d -> d.getRiskLevel() != null
                            && riskFilter.equals(d.getRiskLevel().name()))
                    .toList();
        }

        String[] headers = {
                "ID", "Name", "Environment", "Risk Level", "Status",
                "Deployed By", "Deployment Time", "Notes", "Created At"
        };

        try (PrintWriter writer = response.getWriter();
             CSVPrinter csv = new CSVPrinter(writer,
                     CSVFormat.RFC4180.builder().setHeader(headers).build())) {

            for (Deployment d : deployments) {
                csv.printRecord(
                        d.getId(),
                        d.getName(),
                        d.getEnvironment(),
                        d.getRiskLevel() != null ? d.getRiskLevel().name() : "",
                        d.getStatus() != null ? d.getStatus().name() : "",
                        d.getDeployedBy(),
                        d.getDeploymentTime() != null ? d.getDeploymentTime().format(ISO_FORMAT) : "",
                        d.getNotes() != null ? d.getNotes() : "",
                        d.getCreatedAt() != null ? d.getCreatedAt().format(ISO_FORMAT) : ""
                );
            }
        }
    }

    /**
     * Stream the full metadata-change audit log as an RFC 4180 CSV.
     * Optional ?changeType= param filters to CREATED, MODIFIED, or DELETED records.
     */
    @GetMapping("/metadata-changes.csv")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEVELOPER', 'VIEWER')")
    @Operation(
            summary = "Export metadata-change audit log as CSV",
            description = "Streams all metadata-change records as an RFC 4180 CSV file. "
                    + "Supports optional filtering by change type (CREATED/MODIFIED/DELETED). "
                    + "Suitable for attaching to compliance audit evidence packages."
    )
    public void exportMetadataChangesCsv(
            @Parameter(description = "Filter by change type: CREATED, MODIFIED, or DELETED")
            @RequestParam(required = false) String changeType,
            HttpServletResponse response) throws IOException {

        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition",
                "attachment; filename=\"audittrail-metadata-changes-" + timestamp() + ".csv\"");

        List<MetadataChange> changes = metadataChangeRepository.findAll();

        if (changeType != null && !changeType.isBlank()) {
            String typeFilter = changeType.toUpperCase();
            changes = changes.stream()
                    .filter(m -> m.getChangeType() != null
                            && typeFilter.equals(m.getChangeType().name()))
                    .toList();
        }

        String[] headers = {
                "ID", "Component Name", "Component Type", "Change Type",
                "Changed By", "Changed At", "Previous Value", "New Value", "Deployment ID"
        };

        try (PrintWriter writer = response.getWriter();
             CSVPrinter csv = new CSVPrinter(writer,
                     CSVFormat.RFC4180.builder().setHeader(headers).build())) {

            for (MetadataChange m : changes) {
                csv.printRecord(
                        m.getId(),
                        m.getComponentName(),
                        m.getComponentType(),
                        m.getChangeType() != null ? m.getChangeType().name() : "",
                        m.getChangedBy(),
                        m.getChangedAt() != null ? m.getChangedAt().format(ISO_FORMAT) : "",
                        m.getOldValue() != null ? m.getOldValue() : "",
                        m.getNewValue() != null ? m.getNewValue() : "",
                        m.getDeploymentId() != null ? m.getDeploymentId() : ""
                );
            }
        }
    }

    private static String timestamp() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
    }
}
