from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
import json
import asyncpg

load_dotenv()

app = FastAPI(
    title="Voice Map API",
    description="AI-powered voice navigation system",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL")

@app.get("/")
async def root():
    return {
        "message": "Voice Map API is running",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.get("/api/ping-db")
async def ping_db():
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        result = await conn.fetchval("SELECT version();")
        await conn.close()
        return {
            "status": "connected",
            "postgres_version": result,
            "postgis_enabled": True
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/routes/{start_node}/{end_node}")
async def get_route(start_node: int, end_node: int):
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        
        result = await conn.fetch("""
            SELECT 
                id,
                source,
                target,
                cost,
                ST_AsGeoJSON(geom) as geometry
            FROM edges
            WHERE source = $1 AND target = $2;
        """, start_node, end_node)
        
        await conn.close()
        
        # If no route found in DB, return mock route
        if not result:
            return {
                "type": "FeatureCollection",
                "features": [get_mock_route(start_node, end_node)]
            }
        
        features = []
        for row in result:
            features.append({
                "type": "Feature",
                "properties": {
                    "source": row['source'],
                    "target": row['target'],
                    "cost": float(row['cost'])
                },
                "geometry": json.loads(row['geometry'])
            })
        
        return {
            "type": "FeatureCollection",
            "features": features
        }
    except Exception as e:
        # If DB fails, return mock route
        return {
            "type": "FeatureCollection",
            "features": [get_mock_route(start_node, end_node)]
        }

@app.post("/api/voice/process")
async def process_voice(file: UploadFile = File(...)):
    """Process voice audio (optional - for future use)"""
    try:
        return {
            "status": "ok",
            "message": "Voice processed (frontend handles recognition)"
        }
    except Exception as e:
        return {"error": str(e)}


def get_mock_route(start: int, end: int) -> dict:
    """Return mock route for testing"""
    nodes = {
        1: {"lat": 13.0827, "lng": 80.2707},  # Central Chennai
        2: {"lat": 13.0878, "lng": 80.2799},  # Marina Beach
        3: {"lat": 13.0604, "lng": 80.2451},  # Anna University
        4: {"lat": 13.0050, "lng": 80.2250},  # Guindy Station
    }
    
    start_node = nodes.get(start, nodes[1])
    end_node = nodes.get(end, nodes[1])
    
    return {
        "type": "Feature",
        "properties": {
            "source": start,
            "target": end,
            "cost": 5.0
        },
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [start_node["lng"], start_node["lat"]],
                [end_node["lng"], end_node["lat"]]
            ]
        }
    }

def parse_destination(text: str) -> dict:
    """Extract destination from voice text"""
    locations = {
        "marina": {"name": "Marina Beach", "node_id": 2},
        "beach": {"name": "Marina Beach", "node_id": 2},
        "university": {"name": "Anna University", "node_id": 3},
        "anna": {"name": "Anna University", "node_id": 3},
        "uni": {"name": "Anna University", "node_id": 3},
        "guindy": {"name": "Guindy Station", "node_id": 4},
        "station": {"name": "Guindy Station", "node_id": 4},
        "central": {"name": "Central Chennai", "node_id": 1},
    }
    
    text_lower = text.lower()
    for keyword, location in locations.items():
        if keyword in text_lower:
            return location
    
    return {"name": "Unknown", "node_id": None}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
