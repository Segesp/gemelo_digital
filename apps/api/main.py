from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Any
import os
import asyncpg
import json
from datetime import datetime

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/gemelo")

app = FastAPI(title="Gemelo Digital Chancay API")

# CORS para el frontend
origins = [
    os.getenv("CORS_ORIGIN", "http://localhost:3000"),
    "http://127.0.0.1:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_conn():
    return await asyncpg.connect(DATABASE_URL.replace("postgresql+asyncpg", "postgresql"))

class FeatureIn(BaseModel):
    layer: str
    properties: dict
    geom_wkt: str

class TimeseriesIn(BaseModel):
    sensor_id: str
    value: float
    time: Optional[str] = None
    properties: dict = {}

class IntersectIn(BaseModel):
    layer: str
    geom_wkt: str

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/layers")
async def list_layers():
    conn = await get_conn()
    try:
        rows = await conn.fetch("SELECT id, name, description, geom_type, srid FROM gd.layers ORDER BY id")
        return [dict(r) for r in rows]
    finally:
        await conn.close()

@app.get("/analysis/layer/{name}/area")
async def layer_area(name: str):
    conn = await get_conn()
    try:
        row = await conn.fetchrow("SELECT id FROM gd.layers WHERE name=$1", name)
        if not row:
            raise HTTPException(status_code=404, detail="Layer not found")
        res = await conn.fetchrow(
            """
            SELECT COALESCE(SUM(ST_Area(geom::geography)),0) AS area_m2
            FROM gd.features WHERE layer_id=$1
            """,
            row["id"],
        )
        return {"layer": name, "area_m2": float(res["area_m2"]) if res and res["area_m2"] is not None else 0.0}
    finally:
        await conn.close()

@app.post("/analysis/intersect")
async def intersect(q: IntersectIn):
    conn = await get_conn()
    try:
        row = await conn.fetchrow("SELECT id FROM gd.layers WHERE name=$1", q.layer)
        if not row:
            raise HTTPException(status_code=404, detail="Layer not found")
        feats = await conn.fetch(
            """
            SELECT id, properties, ST_AsGeoJSON(geom) AS geom
            FROM gd.features
            WHERE layer_id=$1 AND ST_Intersects(geom, ST_GeomFromText($2,4326))
            """,
            row["id"], q.geom_wkt
        )
        features = [
            {"type": "Feature", "id": r["id"], "properties": r["properties"], "geometry": json.loads(r["geom"])}
            for r in feats
        ]
        return {"type": "FeatureCollection", "features": features, "count": len(features)}
    finally:
        await conn.close()

@app.get("/analysis/timeseries/{sensor_id}/stats")
async def ts_stats(sensor_id: str, start: Optional[str] = None, end: Optional[str] = None):
    conn = await get_conn()
    try:
        where = ["sensor_id=$1"]
        params: list[Any] = [sensor_id]
        def parse_dt(s: str):
            try:
                if s.endswith('Z'):
                    s = s.replace('Z', '+00:00')
                return datetime.fromisoformat(s)
            except Exception:
                return None
        if start:
            sdt = parse_dt(start)
            if sdt:
                where.append("time >= $%d" % (len(params)+1))
                params.append(sdt)
        if end:
            edt = parse_dt(end)
            if edt:
                where.append("time <= $%d" % (len(params)+1))
                params.append(edt)
        sql = f"SELECT COUNT(*) AS n, MIN(value) AS min, MAX(value) AS max, AVG(value) AS avg FROM gd.timeseries WHERE {' AND '.join(where)}"
        res = await conn.fetchrow(sql, *params)
        return {"sensor_id": sensor_id, "count": res["n"], "min": res["min"], "max": res["max"], "avg": res["avg"]}
    finally:
        await conn.close()

@app.post("/layers/{name}")
async def create_layer(name: str, geom_type: str = "GEOMETRY", srid: int = 4326, description: Optional[str] = None):
    conn = await get_conn()
    try:
        await conn.execute(
            "INSERT INTO gd.layers(name, description, geom_type, srid) VALUES($1,$2,$3,$4)",
            name, description, geom_type, srid
        )
        return {"ok": True}
    finally:
        await conn.close()

@app.post("/features")
async def insert_feature(f: FeatureIn):
    conn = await get_conn()
    try:
        # ensure layer
        row = await conn.fetchrow("SELECT id FROM gd.layers WHERE name=$1", f.layer)
        if not row:
            raise HTTPException(status_code=400, detail="Layer not found")
        await conn.execute(
            "INSERT INTO gd.features(layer_id, properties, geom) VALUES($1,$2,ST_GeomFromText($3,4326))",
            row["id"], json.dumps(f.properties), f.geom_wkt
        )
        return {"ok": True}
    finally:
        await conn.close()

@app.get("/features/{layer}")
async def get_features(layer: str, limit: int = 100):
    conn = await get_conn()
    try:
        row = await conn.fetchrow("SELECT id FROM gd.layers WHERE name=$1", layer)
        if not row:
            raise HTTPException(status_code=404, detail="Layer not found")
        rows = await conn.fetch(
            "SELECT id, properties, ST_AsGeoJSON(geom) AS geom FROM gd.features WHERE layer_id=$1 ORDER BY id DESC LIMIT $2",
            row["id"], limit
        )
        features = [
            {"type": "Feature", "id": r["id"], "properties": r["properties"], "geometry": json.loads(r["geom"])}
            for r in rows
        ]
        return {"type": "FeatureCollection", "features": features}
    finally:
        await conn.close()

@app.post("/timeseries")
async def insert_ts(ts: TimeseriesIn):
    conn = await get_conn()
    try:
        parsed_time = None
        if ts.time:
            t = ts.time
            try:
                if isinstance(t, str) and t.isdigit():
                    parsed_time = datetime.fromtimestamp(int(t))
                elif isinstance(t, str):
                    if t.endswith('Z'):
                        t = t.replace('Z', '+00:00')
                    parsed_time = datetime.fromisoformat(t)
            except Exception:
                parsed_time = None
        await conn.execute(
            "INSERT INTO gd.timeseries(time, sensor_id, value, properties) VALUES(COALESCE($1, now()), $2, $3, $4)",
            parsed_time, ts.sensor_id, ts.value, json.dumps(ts.properties)
        )
        return {"ok": True}
    finally:
        await conn.close()

@app.get("/timeseries/{sensor_id}")
async def get_ts(sensor_id: str, limit: int = 1000):
    conn = await get_conn()
    try:
        rows = await conn.fetch(
            "SELECT time, value, properties FROM gd.timeseries WHERE sensor_id=$1 ORDER BY time DESC LIMIT $2",
            sensor_id, limit
        )
        return [dict(r) for r in rows]
    finally:
        await conn.close()
