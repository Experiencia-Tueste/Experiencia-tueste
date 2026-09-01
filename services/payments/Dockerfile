FROM maven:3.9.11-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml ./
RUN mvn -q -DskipTests dependency:go-offline
COPY src ./src
RUN mvn -q package

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --uid 1001 tueste
COPY --from=builder --chown=tueste:tueste /app/target/tueste-payments-0.1.0.jar app.jar
USER tueste
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
