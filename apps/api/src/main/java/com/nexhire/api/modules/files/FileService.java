package com.nexhire.api.modules.files;

import com.nexhire.api.exception.BadRequestException;
import io.minio.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;
import java.util.UUID;

@Service
@Slf4j
public class FileService {

    private static final long MAX_SIZE_BYTES = 10L * 1024 * 1024; // 10 MB
    private static final Set<String> ALLOWED_TYPES = Set.of(
        "application/pdf", "image/jpeg", "image/png", "image/gif", "image/webp"
    );

    private final MinioClient minioClient;
    private final String bucket;

    @Value("${minio.endpoint}")
    private String endpoint;

    public FileService(MinioClient minioClient, @Qualifier("minioBucket") String bucket) {
        this.minioClient = minioClient;
        this.bucket = bucket;
    }

    public FileUploadResponse upload(MultipartFile file) {
        if (file.isEmpty()) throw new BadRequestException("File must not be empty");
        if (file.getSize() > MAX_SIZE_BYTES) throw new BadRequestException("File exceeds 10 MB limit");
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType))
            throw new BadRequestException("File type not allowed. Accepted: PDF, JPEG, PNG, GIF, WEBP");

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String ext = originalName.contains(".") ? originalName.substring(originalName.lastIndexOf('.')) : "";
        String objectName = UUID.randomUUID() + ext;

        try {
            // Ensure bucket exists
            boolean exists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
            if (!exists) minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());

            try (java.io.InputStream inputStream = file.getInputStream()) {
                minioClient.putObject(
                    PutObjectArgs.builder()
                        .bucket(bucket)
                        .object(objectName)
                        .stream(inputStream, file.getSize(), -1)
                        .contentType(contentType)
                        .build()
                );
            }

            String url = endpoint + "/" + bucket + "/" + objectName;
            log.info("Uploaded file: {} -> {}", originalName, url);
            return new FileUploadResponse(url, originalName, contentType, file.getSize());
        } catch (Exception e) {
            throw new RuntimeException("File upload failed: " + e.getMessage(), e);
        }
    }
}
