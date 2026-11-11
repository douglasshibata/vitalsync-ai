package com.example.demo.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import reactor.core.publisher.Mono;

import java.util.Set;

@Controller
public class SignalingController {

    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final int MAX_PAYLOAD_SIZE = 16384; // 16KB
    private static final Set<String> VALID_SIGNAL_TYPES = Set.of("offer", "answer", "candidate", "join", "leave");

    @MessageMapping("/signal")
    @SendTo("/topic/messages")
    public Mono<String> handleSignal(@Payload String signal) {
        if (signal == null || signal.isBlank()) {
            return Mono.error(new IllegalArgumentException("Empty signal payload"));
        }

        if (signal.length() > MAX_PAYLOAD_SIZE) {
            return Mono.error(new IllegalArgumentException("Signal payload too large"));
        }

        try {
            JsonNode json = objectMapper.readTree(signal);
            if (!json.has("type") || !VALID_SIGNAL_TYPES.contains(json.get("type").asText())) {
                return Mono.error(new IllegalArgumentException("Invalid or missing signal type"));
            }
        } catch (Exception e) {
            return Mono.error(new IllegalArgumentException("Invalid JSON payload"));
        }

        return Mono.just(signal);
    }
}
