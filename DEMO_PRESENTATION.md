# VitalSync AI - Apresentacao de Demonstracao

---

## Slide 1: Titulo

# VitalSync AI
### Plataforma de Telemedicina com IA

**Transcricao automatica | Traducao multilingual | Extracao de entidades medicas**

---

## Slide 2: O Problema

### Desafios na Telemedicina Atual

- Documentacao manual de consultas e demorada e propensa a erros
- Barreiras linguisticas entre medicos e pacientes
- Dificuldade em extrair informacoes clinicas estruturadas de conversas
- Necessidade de proteger dados sensiveis dos pacientes (PII/PHI)
- Mapeamento manual de sintomas para codigos CID-10

### Oportunidade
> Como podemos usar IA para automatizar a documentacao clinica durante consultas por video?

---

## Slide 3: A Solucao

### VitalSync AI - Pipeline Inteligente

```
Video Consulta --> Gravacao --> Transcricao --> Anonimizacao --> Traducao
                                                                   |
                                                                   v
                                      CID-10 <-- Entidades <-- Resumo
```

1. **Videoconferencia WebRTC** - Consulta em tempo real
2. **Transcricao automatica** - Whisper v3 (OpenAI)
3. **Anonimizacao de PII** - Nomes, emails, telefones
4. **Traducao multilingual** - NLLB-200 (16 idiomas)
5. **Resumo clinico** - BART-large-CNN
6. **Extracao de entidades** - BioBERT (NER biomedico)
7. **Mapeamento CID-10** - Codigos automaticos

---

## Slide 4: Arquitetura

### Stack Tecnologico

```
+------------------+      +------------------+      +------------------+
|   FRONTEND       |      |   BACKEND        |      |   AI ENGINE      |
|                  |      |                  |      |                  |
|  Angular 17      |      |  Spring Boot 3.4 |      |  FastAPI         |
|  Material UI     | <--> |  WebFlux         | <--> |  Whisper v3      |
|  WebRTC          |  WS  |  Spring Security |  HTTP|  NLLB-200        |
|  MediaRecorder   |      |  File Storage    |      |  BioBERT         |
|                  |      |                  |      |  BART-CNN        |
+------------------+      +------------------+      +------------------+
```

**Por que essa stack?**
- Angular: Framework robusto para aplicacoes medicas
- Spring Boot WebFlux: Processamento reativo e nao-bloqueante
- FastAPI: Alta performance para servir modelos de ML
- Modelos SOTA: Whisper v3, NLLB-200, BioBERT

---

## Slide 5: Fluxo de Demonstracao

### Passo a Passo

#### 1. Lobby (http://localhost:4200)
- Inserir nome do medico/paciente
- Criar ou entrar em uma sala

#### 2. Video Consulta
- Conexao WebRTC peer-to-peer
- Audio e video em tempo real
- Sinalizacao via WebSocket

#### 3. Gravacao
- Clicar em "Gravar" durante a consulta
- MediaRecorder API captura o stream
- Parar gravacao ao final

#### 4. Upload e Processamento
- Upload automatico do video
- Pipeline de IA processa em background:
  - Extrai audio do video
  - Transcreve com Whisper
  - Anonimiza PII
  - Traduz para EN/ES
  - Gera resumo
  - Extrai entidades medicas
  - Mapeia CID-10

#### 5. Resultado
```
VIDEO: consulta-2024-01-15.mp4

=== SUMMARY ===
Patient presents with persistent cough and fever...

=== TRANSCRIPT (Original) ===
[NAME] relata tosse persistente ha 3 dias...

=== TRANSLATION (English) ===
[NAME] reports persistent cough for 3 days...

=== MEDICAL ENTITIES ===
Sign_symptom: cough, fever, dyspnea
Biological_structure: lung, throat

=== CID-10 CODES ===
R05 (Cough), R50.9 (Fever)
```

---

## Slide 6: Seguranca

### Medidas Implementadas

| Camada | Medida | Status |
|--------|--------|--------|
| Backend | CSRF Protection (Cookie-based) | Implementado |
| Backend | Security Headers (CSP, X-Frame-Options) | Implementado |
| Backend | Validacao de tipo de arquivo (whitelist) | Implementado |
| Backend | Nomes aleatorios para arquivos (UUID) | Implementado |
| Backend | Validacao de payload WebSocket | Implementado |
| Backend | CORS configuravel por ambiente | Implementado |
| AI Engine | CORS middleware | Implementado |
| AI Engine | Logging estruturado | Implementado |
| AI Engine | Validacao de tipo de arquivo | Implementado |
| AI Engine | Bind em 127.0.0.1 (default) | Implementado |
| Frontend | CSP meta tag | Implementado |
| Frontend | IDs criptograficamente seguros | Implementado |
| Geral | Dependencias com versoes fixas | Implementado |

### Para Producao (Roadmap)
- Autenticacao OAuth2/JWT
- Criptografia em repouso (AES-256)
- TLS 1.3
- Audit trail (HIPAA)
- WAF + Rate Limiting

---

## Slide 7: Modelos de IA

### Pipeline de Processamento

| Modelo | Tarefa | Tamanho | Performance |
|--------|--------|---------|-------------|
| **Whisper v3 (large)** | Transcricao | ~3GB | WER 5-10% (multilingual) |
| **NLLB-200 (distilled)** | Traducao | ~1.2GB | 16 idiomas suportados |
| **BART-large-CNN** | Resumo | ~1.6GB | Resumos concisos e precisos |
| **BioBERT (d4data)** | NER Medico | ~440MB | Entidades biomedicas |

### Idiomas Suportados
Portugues, Ingles, Espanhol, Frances, Alemao, Italiano, Holandes, Russo, Chines, Japones, Coreano, Arabe, Hindi, Turco, Vietnamita, Polones

---

## Slide 8: Anonimizacao de PII

### Protecao de Dados do Paciente

**Antes da anonimizacao:**
> "Dr. Carlos Silva atendeu Maria Santos, email maria.santos@email.com, telefone 011-555-1234"

**Apos anonimizacao:**
> "Dr. [NAME] atendeu [NAME], email [EMAIL], telefone [PHONE]"

### Tecnicas Utilizadas
- **Regex patterns** para nomes, emails, telefones
- Anonimizacao **antes** de qualquer processamento adicional
- Placeholder para **deteccao facial** em video (roadmap)

---

## Slide 9: Resultados e Metricas

### Capacidades Demonstradas

- Transcricao automatica em **16 idiomas**
- Traducao instantanea entre pares de idiomas
- Extracao de **entidades medicas** com BioBERT
- Mapeamento automatico para **codigos CID-10**
- **Anonimizacao de PII** antes do processamento
- **Resumo clinico** automatico da consulta

### Limitacoes do POC
- Anonimizacao baseada em regex (simplificada)
- Sem autenticacao real implementada
- CID-10 mapping com base de dados simulada
- Sem criptografia em repouso

---

## Slide 10: Roadmap

### Proximos Passos

#### Fase 1 - Seguranca (Curto prazo)
- [ ] Autenticacao OAuth2 com Keycloak
- [ ] Criptografia AES-256 em repouso
- [ ] TLS 1.3 em todas as comunicacoes
- [ ] Rate limiting
- [ ] Audit trail HIPAA

#### Fase 2 - Funcionalidades (Medio prazo)
- [ ] Deteccao facial para anonimizacao de video
- [ ] Dashboard medico com historico de consultas
- [ ] Integracao com sistemas de prontuario (HL7/FHIR)
- [ ] Base CID-10 completa com busca semantica
- [ ] Suporte a mais formatos de video

#### Fase 3 - Escalabilidade (Longo prazo)
- [ ] Deploy em Kubernetes com auto-scaling
- [ ] Cache de modelos com Redis
- [ ] Processing queue com RabbitMQ/Kafka
- [ ] Multi-tenancy
- [ ] Conformidade LGPD/HIPAA completa

---

## Slide 11: Equipe e Contato

### VitalSync AI

**Repositorio:** vitalsync-ai
**Branch:** update_security
**Status:** POC - Proof of Concept

### Documentacao Disponivel
- `README.md` - Documentacao tecnica e setup
- `SECURITY_REPORT.md` - Relatorio completo de seguranca
- `DEPENDENCY_UPDATE_REPORT.md` - Atualizacao de dependencias
- `DAST_GUIDE.md` - Guia de testes dinamicos de seguranca

---

*Obrigado!*
