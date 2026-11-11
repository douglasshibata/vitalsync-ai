# VitalSync AI

> AI-powered telemedicine platform with real-time video conferencing, automatic transcription, translation, and medical entity extraction.

## Overview

VitalSync AI is a proof-of-concept telemedicine platform that combines WebRTC video conferencing with AI-powered clinical documentation. During a video consultation, the system automatically transcribes speech, translates between languages, extracts medical entities, maps them to ICD-10 codes, and anonymizes personally identifiable information (PII).

**Status:** Proof of Concept (POC) - Not intended for production use without further security hardening.

## Architecture

```
+-------------------+       +-------------------+       +-------------------+
|                   |       |                   |       |                   |
|   Angular 17      | <---> |  Spring Boot 3.4  | <---> |  FastAPI (Python) |
|   Frontend        |  API  |  Backend          |  HTTP |  AI Engine        |
|                   |       |                   |       |                   |
|  - Video UI       |  WS   |  - Auth/Security  |       |  - Whisper v3     |
|  - Recording      | <---> |  - File Storage   |       |  - NLLB-200       |
|  - Material UI    |       |  - WebSocket      |       |  - BioBERT NER    |
|                   |       |  - Upload API     |       |  - BART Summary   |
+-------------------+       +-------------------+       +-------------------+
     :4200                       :8080                       :8000
```

### Data Flow
1. **Video Consultation** - WebRTC peer-to-peer video between doctor and patient
2. **Recording** - Browser MediaRecorder captures the session
3. **Upload** - Recorded video is uploaded to the backend with PII anonymization
4. **AI Processing** - The AI engine processes the video:
   - Audio extraction (MoviePy)
   - Speech-to-text (OpenAI Whisper v3)
   - PII anonymization (regex-based)
   - Translation (Facebook NLLB-200)
   - Summarization (BART-large-CNN)
   - Medical entity extraction (BioBERT)
   - ICD-10 code mapping

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Angular 17, Angular Material | UI, video conferencing |
| Backend | Spring Boot 3.4, WebFlux | API, file storage, WebSocket signaling |
| AI Engine | FastAPI, Python 3.10+ | ML model serving |
| Transcription | OpenAI Whisper v3 (large) | Speech-to-text |
| Translation | Facebook NLLB-200 (distilled 600M) | Multilingual translation |
| NER | BioBERT (d4data/biomedical-ner-all) | Medical entity extraction |
| Summarization | BART-large-CNN | Text summarization |
| Video | WebRTC, MediaRecorder API | Real-time video, recording |

## Setup & Installation

### Prerequisites
- Java 17+
- Node.js 18+
- Python 3.10+
- CUDA-capable GPU (recommended, CPU fallback available)

### Backend

```bash
cd backend

# Run the application
./mvnw spring-boot:run

# Or build and run
./mvnw clean package
java -jar target/demo-0.0.1-SNAPSHOT.jar
```

The backend starts on `http://localhost:8080`.

#### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ALLOWED_ORIGINS` | `http://localhost:4200` | Comma-separated allowed CORS origins |

### AI Engine

```bash
cd ai-engine

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run the engine
python main.py
```

The AI engine starts on `http://localhost:8000` (bound to `127.0.0.1` by default).

> **Note:** First run will download ~6GB of ML models (Whisper, NLLB-200, BART, BioBERT). A CUDA-capable GPU with 8GB+ VRAM is recommended.

#### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ALLOWED_ORIGINS` | `http://localhost:4200` | Comma-separated allowed CORS origins |
| `BIND_HOST` | `127.0.0.1` | Host to bind the server to |

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
ng serve
```

The frontend starts on `http://localhost:4200`.

## Usage

1. **Open the app** at `http://localhost:4200`
2. **Enter your name** and a **room name** in the lobby
3. **Share the room name** with another participant
4. **Start the video call** - WebRTC handles peer-to-peer connection
5. **Record the session** using the recording controls
6. **Upload the recording** - the system processes it through the AI pipeline
7. **View results** - transcription, translation, medical entities, and ICD-10 codes

## API Endpoints

### Backend (Port 8080)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload video file for processing |
| WS | `/ws/signal` | WebRTC signaling (WebSocket) |

### AI Engine (Port 8000)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/process-video/` | Process video file (transcribe, translate, extract entities) |
| POST | `/process-folder/` | Batch process all videos in a folder (background) |
| GET | `/docs` | FastAPI auto-generated API docs |

## Security & HIPAA Considerations

This POC implements several security measures:

- **CSRF Protection** - Cookie-based CSRF tokens via Spring Security
- **Security Headers** - CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **File Validation** - Extension whitelist (.mp4, .mov, .avi, .webm), UUID-based filenames
- **CORS** - Configurable allowed origins per environment
- **PII Anonymization** - Regex-based removal of names, emails, phone numbers from transcriptions
- **WebSocket Validation** - JSON schema validation, payload size limits, signal type whitelist
- **Structured Logging** - Python logging module with levels (no PII in logs)

### For Production Deployment
The following additional measures are required for HIPAA compliance:
- [ ] Encryption at rest (AES-256) for all stored files
- [ ] TLS 1.3 for all communications
- [ ] Proper authentication (OAuth2/JWT)
- [ ] Role-based access control (RBAC)
- [ ] Audit trail logging
- [ ] Business Associate Agreements (BAA)
- [ ] Data retention policies
- [ ] Backup and disaster recovery
- [ ] Penetration testing

See `SECURITY_REPORT.md` for the full security assessment.

## Project Structure

```
vitalsync-ai/
├── backend/                    # Spring Boot backend
│   ├── src/main/java/com/example/demo/
│   │   ├── config/
│   │   │   └── SecurityConfig.java     # Security, CORS, headers
│   │   ├── controller/
│   │   │   └── SignalingController.java # WebSocket signaling
│   │   ├── FileStorageService.java      # File upload/storage
│   │   └── UploadController.java        # Upload REST API
│   ├── src/main/resources/
│   │   └── application.properties       # App configuration
│   └── pom.xml
├── ai-engine/                  # Python AI processing
│   ├── main.py                 # FastAPI app with ML pipeline
│   └── requirements.txt        # Pinned Python dependencies
├── frontend/                   # Angular frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── lobby/
│   │   │   │   └── lobby.component.ts   # Room lobby
│   │   │   └── video-recording.service.ts
│   │   ├── environments/
│   │   │   ├── environment.ts           # Dev config
│   │   │   └── environment.prod.ts      # Prod config
│   │   └── index.html
│   └── package.json
├── SECURITY_REPORT.md          # Security review findings
├── DEPENDENCY_UPDATE_REPORT.md # Dependency update details
├── DAST_GUIDE.md               # Dynamic security testing guide
├── DEMO_PRESENTATION.md        # Demo presentation
└── README.md                   # This file
```

## License

This project is a Proof of Concept for educational and demonstration purposes.

---

## 🛠️ Project Deep Dive & Technical Guide

### 🎯 Main Purpose
AI Telemedicine POC for patient monitoring, automated transcription, and diagnostic support.

### 🧰 Tecnologias Utilizadas (Tech Stack)
- **Primary Technologies:** Angular 19.2.2, Java 21, Maven, Node.js / npm, Python 3.12, Spring Boot 3.4.3
- **Deployment Strategy:** Container-ready with standard Docker/Docker Compose integrations where applicable.

### 🚀 Como Implantar e Executar (How to Deploy & Run)
#### Backend (Java / Spring Boot)
1. Navigate to the backend directory.
2. Compile and run: `./mvnw spring-boot:run` or `mvn spring-boot:run`.

#### Frontend (Angular / Node.js)
1. Navigate to the frontend directory.
2. Install dependencies: `npm install`.
3. Run development server: `npm start` or `npm run dev`.

#### Python Engine / FastAPI
1. Install dependencies: `pip install -r requirements.txt`.
2. Run the server/script: `uvicorn main:app --reload` or `python main.py`.

---
