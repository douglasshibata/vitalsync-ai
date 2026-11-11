import logging
import os
import re
import shutil
import tempfile
from pathlib import Path

import moviepy.editor as mp
import torch
import uvicorn
import whisper
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, validator
from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM

# --- Logging Configuration ---
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("vitalsync-ai")

app = FastAPI()

# --- CORS Middleware ---
ALLOWED_ORIGINS = os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:4200").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# --- Security Configuration ---
SAFE_BASE_DIR = Path("/app/videos").resolve()
if not SAFE_BASE_DIR.exists():
    os.makedirs(SAFE_BASE_DIR, exist_ok=True)

ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".webm"}
MAX_UPLOAD_SIZE = 100 * 1024 * 1024  # 100MB

# --- Pydantic Models ---
class FolderProcessRequest(BaseModel):
    folder_path: str

    @validator('folder_path')
    def validate_path(cls, v):
        path = Path(v).resolve()
        if not str(path).startswith(str(SAFE_BASE_DIR)):
            raise ValueError(f"Path must be inside {SAFE_BASE_DIR}")
        return str(path)

# --- Model Initialization ---
logger.info("Loading models... this might take a while.")

device = "cuda" if torch.cuda.is_available() else "cpu"

# Transcription model (Whisper v3)
logger.info("Loading Whisper v3 model...")
whisper_model = whisper.load_model("large-v3", device=device)

# Translation model: Facebook NLLB-200
logger.info("Loading NLLB-200 model...")
nllb_model_id = "facebook/nllb-200-distilled-600M"
nllb_tokenizer = AutoTokenizer.from_pretrained(nllb_model_id)
nllb_model = AutoModelForSeq2SeqLM.from_pretrained(nllb_model_id)
translator = pipeline("text2text-generation", model=nllb_model, tokenizer=nllb_tokenizer, device=device)

# Summarization model
logger.info("Loading Summarization model...")
summarizer_tokenizer = AutoTokenizer.from_pretrained("facebook/bart-large-cnn")
summarizer_model = AutoModelForSeq2SeqLM.from_pretrained("facebook/bart-large-cnn")
summarizer = pipeline("summarization", model=summarizer_model, tokenizer=summarizer_tokenizer, device=device)

# Medical NER model (BioBERT-based)
logger.info("Loading Biomedical NER model...")
medical_ner = pipeline("ner", model="d4data/biomedical-ner-all", device=device)

logger.info("Models loaded successfully.")

# Helper to map Whisper language codes to NLLB-200 (FLORES-200) codes
WHISPER_TO_NLLB = {
    "en": "eng_Latn", "es": "spa_Latn", "fr": "fra_Latn", "de": "deu_Latn",
    "it": "ita_Latn", "pt": "por_Latn", "nl": "nld_Latn", "ru": "rus_Cyrl",
    "zh": "zho_Hans", "ja": "jpn_Jpan", "ko": "kor_Kore", "ar": "arb_Arab",
    "hi": "hin_Deva", "tr": "tur_Latn", "vi": "vie_Latn", "pl": "pol_Latn"
}

def get_nllb_code(whisper_code: str):
    return WHISPER_TO_NLLB.get(whisper_code, "eng_Latn")

def extract_audio(video_path: str, audio_path: str):
    video_clip = mp.VideoFileClip(video_path)
    video_clip.audio.write_audiofile(audio_path, logger=None)
    video_clip.close()

# Simulated CID-10 Mapping Database
CID_10_MAP = {
    "fever": "R50.9",
    "cough": "R05",
    "headache": "R51",
    "hypertension": "I10",
    "diabetes": "E11",
    "asthma": "J45",
    "covid": "U07.1",
    "flu": "J11",
    "pain": "R52",
    "dyspnea": "R06.0",
    "tachycardia": "R00.0"
}

def map_to_cid10(entities):
    cid_codes = []
    for label in ['Sign_symptom', 'Biological_structure', 'Detailed_description']:
        if label in entities:
            for item in entities[label]:
                item_lower = item.lower()
                for key, code in CID_10_MAP.items():
                    if key in item_lower:
                        cid_codes.append(f"{code} ({key.capitalize()})")
    return list(set(cid_codes))

def extract_medical_entities(text: str):
    entities = medical_ner(text)
    structured_entities = {}
    for ent in entities:
        label = ent['entity']
        word = ent['word']
        if label not in structured_entities:
            structured_entities[label] = set()
        structured_entities[label].add(word)

    result = {k: list(v) for k, v in structured_entities.items()}
    result['cid10_codes'] = map_to_cid10(result)
    return result

def anonymize_text(text: str):
    text = re.sub(r'\b[A-Z][a-z]+ [A-Z][a-z]+\b', '[NAME]', text)
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]', text)
    text = re.sub(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', '[PHONE]', text)
    return text

def anonymize_video_frame(frame):
    return frame

def translate_text(text: str, src_lang: str, tgt_lang: str):
    if src_lang == tgt_lang:
        return text

    src_code = get_nllb_code(src_lang)
    tgt_code = get_nllb_code(tgt_lang)

    result = translator(
        text,
        src_lang=src_code,
        forced_bos_token_id=nllb_tokenizer.lang_code_to_id[tgt_code],
        truncation=True,
        max_length=1024
    )
    return result[0]["generated_text"]

def process_video_file(video_path: str, original_filename: str):
    temp_audio_path = f"{video_path}.mp3"
    try:
        extract_audio(video_path, temp_audio_path)

        result = whisper_model.transcribe(temp_audio_path)
        original_text = result["text"].strip()
        detected_lang = result["language"]

        original_text = anonymize_text(original_text)

        english_text = translate_text(original_text, detected_lang, "en")
        spanish_text = translate_text(original_text, detected_lang, "es")

        summary_result = summarizer(english_text, max_length=150, min_length=30, do_sample=False, truncation=True)
        summary_text = summary_result[0]["summary_text"]

        medical_info = extract_medical_entities(english_text)

        output_content = f"VIDEO: {original_filename}\n\n"
        output_content += "=== SUMMARY ===\n"
        output_content += f"{summary_text}\n\n"
        output_content += "=== TRANSCRIPT (Original) ===\n"
        output_content += f"{original_text}\n\n"
        output_content += "=== TRANSLATION (English) ===\n"
        output_content += f"{english_text}\n\n"
        output_content += "=== TRANSLATION (Spanish) ===\n"
        output_content += f"{spanish_text}\n\n"
        output_content += "=== MEDICAL ENTITIES ===\n"
        for label, words in medical_info.items():
            if label != 'cid10_codes' and words:
                output_content += f"{label}: {', '.join(words)}\n"

        output_content += "\n=== CID-10 CODES ===\n"
        output_content += f"{', '.join(medical_info['cid10_codes']) if medical_info['cid10_codes'] else 'None detected'}\n"

        return output_content

    finally:
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)

@app.post("/process-video/")
async def process_video(video: UploadFile = File(...)):
    # Validate file extension
    file_ext = Path(video.filename).suffix.lower()
    if file_ext not in ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File type not allowed. Accepted: " + ", ".join(ALLOWED_VIDEO_EXTENSIONS))

    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_video:
        shutil.copyfileobj(video.file, temp_video)
        temp_video_path = temp_video.name

    try:
        output_text = process_video_file(temp_video_path, video.filename)
        output_filename = f"{video.filename}.txt"

        with open(output_filename, "w", encoding="utf-8") as f:
            f.write(output_text)

        return Response(
            content=output_text,
            media_type="text/plain",
            headers={"Content-Disposition": f"attachment; filename={output_filename}"}
        )
    except Exception as e:
        logger.error(f"Error processing video: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error while processing video")
    finally:
        if os.path.exists(temp_video_path):
            os.remove(temp_video_path)

def background_process_folder(folder_path: str):
    video_extensions = {".mp4", ".mov", ".avi"}
    path = Path(folder_path)

    if not path.exists() or not path.is_dir():
        logger.warning(f"Folder {folder_path} does not exist or is not a directory.")
        return

    for file_path in path.rglob("*"):
        if file_path.suffix.lower() in video_extensions:
            try:
                logger.info(f"Processing: {file_path}")
                output_text = process_video_file(str(file_path), file_path.name)
                output_filename = f"{file_path.name}.txt"
                output_file_path = file_path.parent / output_filename

                with open(output_file_path, "w", encoding="utf-8") as f:
                    f.write(output_text)
                logger.info(f"Finished: {file_path}")
            except Exception as e:
                logger.error(f"Error processing {file_path}: {e}", exc_info=True)

@app.post("/process-folder/")
async def process_folder(request: FolderProcessRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(background_process_folder, request.folder_path)
    return {"message": f"Processing of folder '{request.folder_path}' started in the background."}

if __name__ == "__main__":
    host = os.environ.get("BIND_HOST", "127.0.0.1")
    uvicorn.run(app, host=host, port=8000)
