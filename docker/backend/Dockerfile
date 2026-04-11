# Build stage
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /build

COPY pom.xml .
COPY src ./src

RUN mvn dependency:go-offline
RUN mvn clean package -DskipTests

# Runtime stage
FROM amazoncorretto:17

ARG PROFILE=dev
ENV SPRING_PROFILES_ACTIVE=${PROFILE}

WORKDIR /app
COPY --from=build /build/target/*.jar /app/app.jar

EXPOSE 8020

# 🔥 Mongo (IMPORTANT: mongodb = nom du container)
ENV SPRING_DATA_MONGODB_URI=mongodb://sayari:sayari@mongodb:27017/pfe_db?authSource=admin

# (optionnel)
ENV MAILDEV_URL=maildev

CMD ["java", "-jar", "/app/app.jar"]