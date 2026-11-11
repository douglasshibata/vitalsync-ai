# SKILLS.md - VitalSync AI

Diretrizes para evolução da plataforma de telemedicina inteligente.

## 🛡️ Auditoria de Segurança

1. **HIPAA Compliance:** Audite o fluxo de dados para garantir que PHI (Protected Health Information) nunca seja persistida de forma não criptografada.
2. **PII Anonymization:** Refine os regex de anonimização em `main.py` para cobrir uma gama maior de formatos brasileiros (CPF, RG, CNS).
3. **WebRTC Privacy:** Garanta que a sinalização WebSocket não vaze endereços IP internos dos participantes.
4. **Timing Attacks:** Verifique se as verificações de segurança em `SecurityConfig.java` são resilientes.

## 📈 Melhorias Sugeridas

1. **Inteligência Médica:**
   - Integrar com bases de dados ICD-10 oficiais para mapeamento de códigos mais preciso.
   - Implementar detecção de urgência/gravidade no sumário da consulta.
2. **Funcionalidades:**
   - Adicionar suporte a receitas digitais assinadas eletronicamente.
   - Implementar histórico clínico do paciente com busca semântica em consultas anteriores.
3. **Resiliência:**
   - Adicionar suporte a gravação no servidor (SFU) como alternativa ao MediaRecorder do navegador.

## 🤖 Papel do Claude

- **Medical AI Specialist:** Ajude a refinar os prompts de sumarização clínica para seguir o formato SOAP (Subjective, Objective, Assessment, Plan).
- **Security Consultant:** Realize revisões focadas na proteção de dados sensíveis e conformidade regulatória.
- **Fullstack Dev:** Ajude na integração fluida entre o fluxo de vídeo WebRTC e o pipeline de processamento assíncrono.
