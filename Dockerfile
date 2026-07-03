# NOTE: The jar is built on the host with `mvn clean package -DskipTests` before
# `docker compose build`. Building inside Docker requires Maven Central access from
# within the build container, which can fail in sandboxed/offline environments.
# This keeps the image small and the build fast/reliable.
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY target/audittrail-0.1.0-BETA.jar app.jar

EXPOSE 8051

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8051/audittrail/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
