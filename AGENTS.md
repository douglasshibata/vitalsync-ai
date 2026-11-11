# AGENTS.md

Este arquivo fornece instruções e contexto para agentes de IA que trabalham no projeto **VitalSync AI**.

## Visão Geral do Projeto
Plataforma de telemedicina com WebRTC, transcrição automática (Whisper), tradução e extração de entidades médicas (BioBERT) com anonimização de PII.

## Tecnologias Utilizadas
- **Frontend:** Angular 17, WebRTC.
- **Backend:** Spring Boot 3.4 (WebFlux).
- **AI Engine:** Python (FastAPI), Whisper v3, NLLB-200, BioBERT, BART.

## Estrutura de Pastas
- `backend/`: Orquestração de sinalização WebRTC e armazenamento.
- `ai-engine/`: Pipeline de processamento de áudio/texto médico.
- `frontend/`: UI de conferência e gravação.

## Comandos Principais
- AI Engine: `python main.py` (requer GPU recomendada)
- Backend: `./mvnw spring-boot:run`
- Frontend: `ng serve`

## Diretrizes de Desenvolvimento
- **Privacidade:** PII (nomes, documentos) deve ser anonimizada via regex antes da persistência ou tradução.
- **Conformidade:** Siga as diretrizes de segurança HIPAA/LGPD.
- **Inteligência:** Sumários clínicos devem seguir o formato SOAP (Subjective, Objective, Assessment, Plan).
- **WebRTC:** Garanta que a sinalização via WebSocket seja segura e não vaze IPs internos.
