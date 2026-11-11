package com.example.demo;

import com.example.demo.service.AnonymizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api")
public class UploadController {

    private final FileStorageService fileStorageService;
    private final AnonymizationService anonymizationService;

    @Autowired
    public UploadController(FileStorageService fileStorageService, AnonymizationService anonymizationService) {
        this.fileStorageService = fileStorageService;
        this.anonymizationService = anonymizationService;
    }

    @PostMapping("/upload")
    public Mono<ResponseEntity<String>> uploadFile(@RequestPart("file") Mono<FilePart> filePartMono) {
        return filePartMono
                .flatMap(filePart -> anonymizationService.anonymizeMediaReactive(filePart)
                        .then(fileStorageService.storeFileReactive(filePart))
                        .map(fileName -> ResponseEntity.ok("Upload and Anonymization successful: " + fileName))
                )
                .defaultIfEmpty(ResponseEntity.badRequest().body("File is missing"));
    }
}
