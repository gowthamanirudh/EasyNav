from fastapi import FastAPI
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
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
