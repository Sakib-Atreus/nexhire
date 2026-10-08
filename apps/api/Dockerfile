FROM maven:3.9.9-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S nexhire && adduser -S nexhire -G nexhire
COPY --from=build /app/target/*.jar app.jar
USER nexhire
EXPOSE 8080

# Production profile: no local-dev fallbacks, so missing secrets fail fast. Override with -e if needed.
ENV SPRING_PROFILES_ACTIVE=prod
# Tuned for small containers (e.g. Render free tier, 512 MB, low CPU):
# heap capped at 55% of the container limit (leaves room for metaspace, code cache and threads), a lean GC, smaller thread stacks and code cache,
# C1-only JIT for faster startup, and a clean exit on OOM so the platform restarts the instance.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=55 -XX:+UseSerialGC -Xss512k -XX:ReservedCodeCacheSize=64m -XX:MaxMetaspaceSize=192m -XX:TieredStopAtLevel=1 -XX:+ExitOnOutOfMemoryError"

ENTRYPOINT ["java", "-jar", "app.jar"]
