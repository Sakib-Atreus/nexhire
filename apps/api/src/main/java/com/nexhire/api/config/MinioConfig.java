package com.nexhire.api.config;

import io.minio.MinioClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class MinioConfig {

    @Value("${minio.endpoint}")
    private String endpoint;

    @Value("${minio.access-key}")
    private String accessKey;

    @Value("${minio.secret-key}")
    private String secretKey;

    @Value("${minio.bucket}")
    private String bucket;

    @Bean
    public MinioClient minioClient() {
        MinioClient.Builder builder = MinioClient.builder().endpoint(endpoint);
        if (accessKey.isBlank() || secretKey.isBlank()) {
            // Start anyway so the rest of the API works; only file uploads will fail.
            log.warn("MINIO_ACCESS_KEY / MINIO_SECRET_KEY are not set; file uploads are disabled");
        } else {
            builder.credentials(accessKey, secretKey);
        }
        return builder.build();
    }

    @Bean
    public String minioBucket() {
        return bucket;
    }
}
