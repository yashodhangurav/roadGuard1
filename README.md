# RoadSentinel AI

AI-powered road damage detection and maintenance platform for national-level smart infrastructure management.

## Project Architecture

```text
RoadSentinel-AI/
│
├── frontend/                     # React + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/           # UI and domain components
│   │   ├── pages/                # Dashboard, Detection, Mapping, Reports, Analytics
│   │   ├── services/             # API client services
│   │   ├── hooks/                # Custom React hooks
│   │   └── assets/               # Static assets & icons
│   └── package.json
│
├── backend/                      # Python + FastAPI + PyTorch + Ultralytics YOLO
│   ├── app/
│   │   ├── api/                  # API routers & endpoints
│   │   ├── core/                 # Configuration & settings
│   │   ├── models/               # Database ORM models
│   │   ├── services/             # YOLO inference, severity engine & Ollama LLM
│   │   ├── database/             # SQLite connection & session
│   │   └── schemas/              # Pydantic request/response schemas
│   ├── weights/                  # Pretrained YOLO checkpoints (.pt)
│   ├── tests/                    # Pytest test suite
│   ├── requirements.txt
│   └── main.py
│
├── .gitignore
└── README.md
```

## Detection Classes

- **D00** — Longitudinal Crack
- **D10** — Transverse Crack
- **D20** — Alligator Crack
- **D40** — Pothole
- **CHUNK_HOLE** — *(Architecturally planned; unsupported until fine-tuned checkpoint is trained)*
- **WATER_FILLED_HOLE** — *(Architecturally planned; unsupported until fine-tuned checkpoint is trained)*

## Prerequisites

- **Python**: 3.11+
- **Node.js**: 18+ (tested on v24)
- **Ollama**: Local instance running `gemma3:1b` on `http://localhost:11434`
