# Stage 1: Build the application
FROM maven:3.9.6-eclipse-temurin-17 AS builder

WORKDIR /app

# Copy the entire pdf-java-service directory
COPY services/pdf-java-service /app

# Build the application
RUN mvn clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the built JAR from the builder stage
COPY --from=builder /app/target/pdf-java-service-1.0.0.jar /app/pdf-java-service.jar

# Expose the port
EXPOSE 2115

# Run the application
CMD ["java", "-jar", "pdf-java-service.jar"]
