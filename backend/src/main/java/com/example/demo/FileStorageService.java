package com.example.demo;

import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path fileStorageLocation;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".mp4", ".mov", ".avi", ".webm");

    private static final Map<String, byte[]> MAGIC_BYTES = Map.of(
        ".mp4", new byte[]{0x00, 0x00, 0x00},
        ".avi", new byte[]{0x52, 0x49, 0x46, 0x46},
        ".webm", new byte[]{0x1A, 0x45, (byte) 0xDF, (byte) 0xA3}
    );

    public FileStorageService() {
        this.fileStorageLocation = Paths.get("uploads")
                .toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    public Mono<String> storeFileReactive(FilePart filePart) {
        String originalFileName = org.springframework.util.StringUtils.cleanPath(filePart.filename());

        if (originalFileName.contains("..")) {
            return Mono.error(new RuntimeException("Invalid path sequence"));
        }

        String extension = getFileExtension(originalFileName).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            return Mono.error(new RuntimeException(
                "File type not allowed. Accepted types: " + String.join(", ", ALLOWED_EXTENSIONS)));
        }

        String safeFileName = UUID.randomUUID() + extension;
        Path targetLocation = this.fileStorageLocation.resolve(safeFileName);

        return filePart.transferTo(targetLocation)
                .then(Mono.just(safeFileName));
    }

    private String getFileExtension(String fileName) {
        int lastDot = fileName.lastIndexOf('.');
        if (lastDot == -1) {
            return "";
        }
        return fileName.substring(lastDot);
    }
}
