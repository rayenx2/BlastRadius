package com.audittrail.config;

import com.audittrail.entity.Deployment;
import com.audittrail.entity.MetadataChange;
import com.audittrail.entity.Release;
import com.audittrail.entity.ReleaseDeployment;
import com.audittrail.repository.DeploymentRepository;
import com.audittrail.repository.MetadataChangeRepository;
import com.audittrail.repository.ReleaseDeploymentRepository;
import com.audittrail.repository.ReleaseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Seeds a coherent demo scenario on first boot: a Q3 platform release
 * that bundles two production deployments (one clean, one rolled back)
 * alongside independent dev/staging/test work, each with metadata
 * changes linked to the deployment that actually caused them.
 */
@Component
@Order(2)
public class DemoDataSeeder implements CommandLineRunner {

    @Autowired
    private DeploymentRepository deploymentRepository;

    @Autowired
    private MetadataChangeRepository metadataChangeRepository;

    @Autowired
    private ReleaseRepository releaseRepository;

    @Autowired
    private ReleaseDeploymentRepository releaseDeploymentRepository;

    @Override
    public void run(String... args) {
        if (deploymentRepository.count() > 0) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();

        Deployment authGateway = deploymentRepository.save(Deployment.builder()
                .name("AuthGateway v3.0")
                .environment("DEV")
                .status(Deployment.DeploymentStatus.DEPLOYED)
                .riskLevel(Deployment.RiskLevel.LOW)
                .deployedBy("rayen.lassoued")
                .deploymentTime(now.minusDays(21))
                .notes("OAuth2 refactor ahead of the Q3 release")
                .build());

        Deployment notificationWorker = deploymentRepository.save(Deployment.builder()
                .name("NotificationWorker v1.4")
                .environment("STAGING")
                .status(Deployment.DeploymentStatus.IN_PROGRESS)
                .riskLevel(Deployment.RiskLevel.MEDIUM)
                .deployedBy("rayen.lassoued")
                .deploymentTime(now.minusDays(9))
                .notes("Retry-queue fix, soak-testing before promotion")
                .build());

        Deployment inventorySync = deploymentRepository.save(Deployment.builder()
                .name("InventorySync v1.0")
                .environment("TEST")
                .status(Deployment.DeploymentStatus.PLANNED)
                .riskLevel(Deployment.RiskLevel.LOW)
                .deployedBy("sarah.becker")
                .deploymentTime(now.minusDays(2))
                .notes("New warehouse sync job, awaiting QA sign-off")
                .build());

        Deployment paymentService = deploymentRepository.save(Deployment.builder()
                .name("PaymentService v2.1")
                .environment("PRODUCTION")
                .status(Deployment.DeploymentStatus.DEPLOYED)
                .riskLevel(Deployment.RiskLevel.HIGH)
                .deployedBy("rayen.lassoued")
                .deploymentTime(now.minusDays(14))
                .notes("Q3 payment gateway upgrade — part of the Q3 platform release")
                .build());

        Deployment checkoutService = deploymentRepository.save(Deployment.builder()
                .name("CheckoutService v4.0")
                .environment("PRODUCTION")
                .status(Deployment.DeploymentStatus.ROLLED_BACK)
                .riskLevel(Deployment.RiskLevel.HIGH)
                .deployedBy("rayen.lassoued")
                .deploymentTime(now.minusDays(13))
                .notes("Rolled back after a checkout-latency regression — part of the Q3 platform release")
                .build());

        seedMetadata(authGateway.getId(), now.minusDays(21),
                "OAuthConfig", "CONFIG", MetadataChange.ChangeType.CREATED, "rayen.lassoued", null, "oauth2_pkce_enabled=true");

        seedMetadata(notificationWorker.getId(), now.minusDays(9),
                "RetryQueueConfig", "CONFIG", MetadataChange.ChangeType.MODIFIED, "rayen.lassoued", "max_retries=3", "max_retries=5");

        seedMetadata(paymentService.getId(), now.minusDays(14),
                "PaymentSchema", "DATABASE", MetadataChange.ChangeType.MODIFIED, "rayen.lassoued", "v2.0", "v2.1");
        seedMetadata(paymentService.getId(), now.minusDays(14).plusMinutes(20),
                "PaymentWebhookEndpoint", "API", MetadataChange.ChangeType.CREATED, "rayen.lassoued", null, "/api/v2/payments/webhook");

        seedMetadata(checkoutService.getId(), now.minusDays(13),
                "CheckoutFlow", "API", MetadataChange.ChangeType.MODIFIED, "rayen.lassoued", "/api/v3/checkout", "/api/v4/checkout");
        seedMetadata(checkoutService.getId(), now.minusDays(13).plusMinutes(45),
                "LegacyCheckoutCache", "CONFIG", MetadataChange.ChangeType.DELETED, "rayen.lassoued", "checkout_cache_ttl=300", null);

        Release q3Release = releaseRepository.save(Release.builder()
                .releaseName("Q3 2026 Platform Release")
                .version("3.2.0")
                .status(Release.ReleaseStatus.DEPLOYED)
                .plannedDate(LocalDate.now().minusDays(14))
                .actualDate(LocalDate.now().minusDays(13))
                .createdBy("rayen.lassoued")
                .build());

        releaseDeploymentRepository.save(ReleaseDeployment.builder()
                .releaseId(q3Release.getId())
                .deploymentId(paymentService.getId())
                .build());
        releaseDeploymentRepository.save(ReleaseDeployment.builder()
                .releaseId(q3Release.getId())
                .deploymentId(checkoutService.getId())
                .build());
    }

    private void seedMetadata(Long deploymentId, LocalDateTime changedAt, String component, String componentType,
                               MetadataChange.ChangeType changeType, String changedBy, String oldValue, String newValue) {
        metadataChangeRepository.save(MetadataChange.builder()
                .deploymentId(deploymentId)
                .componentName(component)
                .componentType(componentType)
                .changeType(changeType)
                .oldValue(oldValue)
                .newValue(newValue)
                .changedBy(changedBy)
                .changedAt(changedAt)
                .build());
    }
}
