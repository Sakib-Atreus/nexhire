package com.nexhire.api.modules.files;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @PostMapping("/upload")
    public ResponseEntity<FileUploadResponse> upload(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(fileService.upload(file));
    }

    @GetMapping("/{objectName}")
    public void stream(@PathVariable String objectName, HttpServletResponse response) {
        fileService.stream(objectName, response);
    }
}
