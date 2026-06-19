package com.nexhire.api.modules.files;
public record FileUploadResponse(String url, String fileName, String contentType, long size) {}
