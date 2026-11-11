package com.example.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Service
public class AnonymizationService {

    private static final Logger logger = LoggerFactory.getLogger(AnonymizationService.class);

    public Mono<Void> anonymizeMediaReactive(FilePart filePart) {
        logger.info("Starting reactive anonymization process for file: {}", filePart.filename());

        // In a production environment, this would call the Python AI Engine
        // via WebClient or RestTemplate to process the file (blur faces, remove audio PII)

        return Mono.delay(Duration.ofSeconds(1))
                .doOnSuccess(v -> logger.info("Successfully anonymized media (Reactive): {}", filePart.filename()))
                .then();
    }
}
