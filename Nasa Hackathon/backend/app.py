"""
IGNIS Scientific Data Network API
FastAPI Backend Application for NASA Space Apps Challenge 2026: Flame in Freefall
Integrates genuine Python scientific combustion modeling with the interactive frontend.
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from .scientific_engine import ScientificEngine

app = FastAPI(
    title="IGNIS — Scientific Experiment Analysis Engine API",
    description="NASA Space Apps Challenge 2026: Flame in Freefall backend for microgravity combustion analytics.",
    version="2.0.0"
)

# Enable CORS for seamless local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "IGNIS-Network"))

# API Endpoints
@app.get("/api/health")
def health_check():
    """Health check endpoint indicating Python scientific engine readiness."""
    return {
        "status": "online",
        "engine": "IGNIS Scientific Experiment Analysis Engine v2.0",
        "challenge": "NASA Space Apps Challenge 2026: Flame in Freefall",
        "python_modules": ["numpy", "scipy", "pandas", "fastapi"]
    }

@app.get("/api/experiments")
def get_experiment_catalog():
    """Returns catalog of NASA experimental sources connected to IGNIS."""
    return {
        "sources": [
            {
                "id": "drop_tower",
                "name": "DROP TOWER",
                "category": "Microgravity Experiments",
                "facility": "NASA Zero-G Research Facility / 2.2-Second Tower",
                "fuel": "Methane (CH4), Gaseous diffusion",
                "duration": "2.2 – 5.18 seconds"
            },
            {
                "id": "iss_experiments",
                "name": "ISS EXPERIMENTS",
                "category": "Space-Based Research",
                "facility": "Combustion Integrated Rack (CIR) / FLEX / ACME",
                "fuel": "Heptane, Methanol droplets",
                "duration": "Quasi-steady extended burns"
            },
            {
                "id": "psi_ntrs",
                "name": "PSI / NTRS",
                "category": "Scientific Archives",
                "facility": "NASA Physical Sciences Informatics & NTRS",
                "fuel": "Multi-campaign open-access datasets",
                "duration": "Decadal flight archives"
            },
            {
                "id": "combustion_data",
                "name": "COMBUSTION DATA",
                "category": "Experimental Telemetry",
                "facility": "Multi-Laboratory Co-operative Datasets",
                "fuel": "Co-flow laminar methane/ethylene",
                "duration": "12.0 seconds transient series"
            }
        ]
    }

@app.get("/api/experiments/{node_id}")
def get_experiment_details(node_id: str):
    """Retrieves experimental parameters and metadata for a specific node."""
    try:
        df = ScientificEngine.load_dataset(node_id)
        return {
            "node_id": node_id,
            "data_points": len(df),
            "columns": list(df.columns),
            "sample_head": df.head(5).to_dict(orient="records")
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"No dataset registered for node '{node_id}'")

@app.post("/api/process/{node_id}")
def process_experiment(node_id: str):
    """
    Executes genuine Python scientific data processing pipeline on the selected
    NASA dataset and returns computed combustion physics metrics, time-series arrays,
    and 3D thermal surface topography.
    """
    try:
        results = ScientificEngine.analyze_experiment(node_id)
        return {
            "status": "success",
            "simulation_code": "IGNIS-SIM-2026-OK",
            "data": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mount static frontend files if folder exists
if os.path.exists(FRONTEND_DIR):
    app.mount("/IGNIS-Network", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")

    @app.get("/")
    def serve_index():
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
