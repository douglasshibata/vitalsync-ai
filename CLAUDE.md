# VitalSync AI - CLAUDE.md

Guia de comandos e diretrizes para o VitalSync AI.

## Comandos de Build e Execução

### Backend (Spring Boot 3.4)
```bash
cd vitalsync-ai/backend
./mvnw spring-boot:run
```

### AI Engine (Python/FastAPI)
```bash
cd vitalsync-ai/ai-engine
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### Frontend (Angular 17)
```bash
cd vitalsync-ai/frontend
npm install
ng serve
```

## Diretrizes de Desenvolvimento

- **Arquitetura:** Telemedicina com WebRTC e documentação clínica automática.
- **Processamento:** Transcrição (Whisper v3), Tradução (NLLB-200) e Extração Médica (BioBERT).
- **Segurança:** Anonimização de PII via regex. Conformidade com diretrizes HIPAA/LGPD (POC).
- **WebRTC:** Sinalização via WebSockets no Spring Boot.
- **Privacidade:** PII é removida das transcrições antes de qualquer armazenamento ou análise posterior.
