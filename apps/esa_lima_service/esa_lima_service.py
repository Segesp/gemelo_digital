"""
ESA and Lima Data Service for Gemelo Digital Chancay
Integrates ESA Sentinel data and Lima municipal data
"""

import asyncio
import logging
import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
import aiohttp
import asyncpg
import json
import numpy as np
from dataclasses import dataclass

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/gemelo")

@dataclass
class ESADataPoint:
    timestamp: datetime
    dataset: str
    parameter: str
    value: float
    latitude: float
    longitude: float
    metadata: Dict[str, Any]

@dataclass
class LimaDataPoint:
    timestamp: datetime
    dataset: str
    parameter: str
    value: float
    location: str
    latitude: float
    longitude: float
    metadata: Dict[str, Any]

class ESALimaDataService:
    """Service to fetch and process ESA Sentinel and Lima municipal data"""
    
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        
        # ESA Copernicus endpoints (simplified for demo)
        self.esa_endpoints = {
            "sentinel1": "https://scihub.copernicus.eu/dhus/search",
            "sentinel2": "https://scihub.copernicus.eu/dhus/search",
            "sentinel3": "https://scihub.copernicus.eu/dhus/search",
        }
        
        # Lima municipal data sources (simulated)
        self.lima_endpoints = {
            "air_quality": "https://api.lima.gob.pe/calidad-aire",
            "traffic": "https://api.lima.gob.pe/transito",
            "weather": "https://api.senamhi.gob.pe/estaciones",
            "environmental": "https://api.minam.gob.pe/sensores"
        }
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def get_database_connection(self):
        """Get database connection"""
        return await asyncpg.connect(DATABASE_URL.replace("postgresql+asyncpg", "postgresql"))
    
    async def fetch_synthetic_esa_data(self) -> List[ESADataPoint]:
        """
        Generate synthetic ESA Sentinel data for demonstration
        In production, this would connect to actual ESA APIs
        """
        data_points = []
        now = datetime.now()
        
        # Generate synthetic Sentinel-1 SAR data (backscatter coefficient)
        for i in range(12):  # Last 12 hours
            timestamp = now - timedelta(hours=i*2)
            
            # Random points within greater Lima area
            lat = -11.5 + (np.random.random() - 0.5) * 0.3  # Lima area
            lon = -77.0 + (np.random.random() - 0.5) * 0.6
            
            # Synthetic SAR backscatter (dB)
            backscatter = -15 + np.random.normal(0, 3)
            
            data_points.append(ESADataPoint(
                timestamp=timestamp,
                dataset="SENTINEL1_SAR",
                parameter="backscatter_coefficient",
                value=backscatter,
                latitude=lat,
                longitude=lon,
                metadata={"source": "ESA Sentinel-1", "polarization": "VV", "synthetic": True}
            ))
            
        # Generate synthetic Sentinel-2 optical data (NDVI)
        for i in range(6):  # Last 6 days (less frequent for optical)
            timestamp = now - timedelta(days=i)
            
            lat = -11.5 + (np.random.random() - 0.5) * 0.3
            lon = -77.0 + (np.random.random() - 0.5) * 0.6
            
            # Synthetic NDVI
            ndvi = 0.2 + 0.5 * np.random.random()
            
            data_points.append(ESADataPoint(
                timestamp=timestamp,
                dataset="SENTINEL2_MSI",
                parameter="ndvi",
                value=ndvi,
                latitude=lat,
                longitude=lon,
                metadata={"source": "ESA Sentinel-2", "cloud_cover": 15, "synthetic": True}
            ))
            
        # Generate synthetic Sentinel-3 sea surface temperature
        for i in range(24):  # Hourly data
            timestamp = now - timedelta(hours=i)
            
            # Ocean points near Chancay
            lat = -11.6 + (np.random.random() - 0.5) * 0.2
            lon = -77.3 + (np.random.random() - 0.5) * 0.2
            
            # Synthetic sea surface temperature (Celsius)
            sst = 18 + 3 * np.sin(i * 0.26) + np.random.normal(0, 0.5)
            
            data_points.append(ESADataPoint(
                timestamp=timestamp,
                dataset="SENTINEL3_SLSTR",
                parameter="sea_surface_temperature",
                value=sst,
                latitude=lat,
                longitude=lon,
                metadata={"source": "ESA Sentinel-3", "synthetic": True}
            ))
        
        return data_points
    
    async def fetch_synthetic_lima_data(self) -> List[LimaDataPoint]:
        """
        Generate synthetic Lima municipal data for demonstration
        In production, this would connect to actual Lima municipal APIs
        """
        data_points = []
        now = datetime.now()
        
        # Lima air quality monitoring stations
        lima_stations = [
            {"name": "Campo de Marte", "lat": -12.072, "lon": -77.036},
            {"name": "San Borja", "lat": -12.092, "lon": -77.007},
            {"name": "Villa María del Triunfo", "lat": -12.159, "lon": -76.935},
            {"name": "Ate", "lat": -12.058, "lon": -76.927},
            {"name": "Carabayllo", "lat": -11.857, "lon": -77.020},
        ]
        
        # Generate air quality data
        for i in range(24):  # Last 24 hours
            timestamp = now - timedelta(hours=i)
            
            for station in lima_stations:
                # PM2.5 concentration (μg/m³)
                pm25 = 25 + 15 * np.sin(i * 0.26) + np.random.normal(0, 5)
                pm25 = max(0, pm25)
                
                data_points.append(LimaDataPoint(
                    timestamp=timestamp,
                    dataset="LIMA_AIR_QUALITY",
                    parameter="pm25",
                    value=pm25,
                    location=station["name"],
                    latitude=station["lat"],
                    longitude=station["lon"],
                    metadata={"source": "SENAMHI Lima", "station": station["name"], "synthetic": True}
                ))
                
                # NO2 concentration (μg/m³)
                no2 = 35 + 20 * np.sin(i * 0.26 + 1) + np.random.normal(0, 8)
                no2 = max(0, no2)
                
                data_points.append(LimaDataPoint(
                    timestamp=timestamp,
                    dataset="LIMA_AIR_QUALITY",
                    parameter="no2",
                    value=no2,
                    location=station["name"],
                    latitude=station["lat"],
                    longitude=station["lon"],
                    metadata={"source": "SENAMHI Lima", "station": station["name"], "synthetic": True}
                ))
        
        # Generate traffic data for major avenues
        traffic_points = [
            {"name": "Av. Javier Prado", "lat": -12.089, "lon": -77.024},
            {"name": "Av. Arequipa", "lat": -12.088, "lon": -77.040},
            {"name": "Panamericana Norte", "lat": -11.950, "lon": -77.080},
            {"name": "Av. Paseo de la República", "lat": -12.070, "lon": -77.042},
        ]
        
        for i in range(24):  # Last 24 hours
            timestamp = now - timedelta(hours=i)
            
            for point in traffic_points:
                # Traffic flow index (0-100, where 100 is heavy traffic)
                # Simulate rush hour patterns
                hour = timestamp.hour
                base_traffic = 30
                if 7 <= hour <= 9 or 17 <= hour <= 19:  # Rush hours
                    base_traffic = 75
                elif 10 <= hour <= 16:  # Daytime
                    base_traffic = 50
                elif 22 <= hour or hour <= 5:  # Night
                    base_traffic = 15
                
                traffic = base_traffic + np.random.normal(0, 10)
                traffic = max(0, min(100, traffic))
                
                data_points.append(LimaDataPoint(
                    timestamp=timestamp,
                    dataset="LIMA_TRAFFIC",
                    parameter="traffic_flow_index",
                    value=traffic,
                    location=point["name"],
                    latitude=point["lat"],
                    longitude=point["lon"],
                    metadata={"source": "Municipalidad de Lima", "location": point["name"], "synthetic": True}
                ))
        
        return data_points
    
    async def store_esa_data(self, data_points: List[ESADataPoint]):
        """Store ESA data points in the database"""
        if not data_points:
            return
        
        conn = await self.get_database_connection()
        try:
            # Create table for ESA data if it doesn't exist
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS gd.esa_data (
                    id BIGSERIAL PRIMARY KEY,
                    timestamp TIMESTAMPTZ NOT NULL,
                    dataset TEXT NOT NULL,
                    parameter TEXT NOT NULL,
                    value DOUBLE PRECISION NOT NULL,
                    latitude DOUBLE PRECISION NOT NULL,
                    longitude DOUBLE PRECISION NOT NULL,
                    geom GEOMETRY(POINT, 4326),
                    metadata JSONB DEFAULT '{}'::jsonb,
                    created_at TIMESTAMPTZ DEFAULT now()
                );
            """)
            
            # Create indexes
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS esa_data_gix ON gd.esa_data USING GIST (geom);
                CREATE INDEX IF NOT EXISTS esa_data_time_idx ON gd.esa_data (timestamp DESC);
                CREATE INDEX IF NOT EXISTS esa_data_dataset_idx ON gd.esa_data (dataset, parameter);
            """)
            
            # Insert data points
            for dp in data_points:
                await conn.execute("""
                    INSERT INTO gd.esa_data (timestamp, dataset, parameter, value, latitude, longitude, geom, metadata)
                    VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($7, $8), 4326), $9)
                """, dp.timestamp, dp.dataset, dp.parameter, dp.value, dp.latitude, dp.longitude,
                    dp.longitude, dp.latitude, json.dumps(dp.metadata))
            
            logger.info(f"Stored {len(data_points)} ESA data points")
            
        finally:
            await conn.close()
    
    async def store_lima_data(self, data_points: List[LimaDataPoint]):
        """Store Lima data points in the database"""
        if not data_points:
            return
        
        conn = await self.get_database_connection()
        try:
            # Create table for Lima data if it doesn't exist
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS gd.lima_data (
                    id BIGSERIAL PRIMARY KEY,
                    timestamp TIMESTAMPTZ NOT NULL,
                    dataset TEXT NOT NULL,
                    parameter TEXT NOT NULL,
                    value DOUBLE PRECISION NOT NULL,
                    location TEXT NOT NULL,
                    latitude DOUBLE PRECISION NOT NULL,
                    longitude DOUBLE PRECISION NOT NULL,
                    geom GEOMETRY(POINT, 4326),
                    metadata JSONB DEFAULT '{}'::jsonb,
                    created_at TIMESTAMPTZ DEFAULT now()
                );
            """)
            
            # Create indexes
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS lima_data_gix ON gd.lima_data USING GIST (geom);
                CREATE INDEX IF NOT EXISTS lima_data_time_idx ON gd.lima_data (timestamp DESC);
                CREATE INDEX IF NOT EXISTS lima_data_dataset_idx ON gd.lima_data (dataset, parameter);
                CREATE INDEX IF NOT EXISTS lima_data_location_idx ON gd.lima_data (location);
            """)
            
            # Insert data points
            for dp in data_points:
                await conn.execute("""
                    INSERT INTO gd.lima_data (timestamp, dataset, parameter, value, location, latitude, longitude, geom, metadata)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($8, $9), 4326), $10)
                """, dp.timestamp, dp.dataset, dp.parameter, dp.value, dp.location, dp.latitude, dp.longitude,
                    dp.longitude, dp.latitude, json.dumps(dp.metadata))
            
            logger.info(f"Stored {len(data_points)} Lima data points")
            
        finally:
            await conn.close()
    
    async def fetch_and_store_all_data(self):
        """Main method to fetch and store all ESA and Lima data"""
        logger.info("Starting ESA and Lima data collection...")
        
        try:
            # Fetch ESA data
            esa_data = await self.fetch_synthetic_esa_data()
            logger.info(f"Generated {len(esa_data)} ESA data points")
            
            # Fetch Lima data
            lima_data = await self.fetch_synthetic_lima_data()
            logger.info(f"Generated {len(lima_data)} Lima data points")
            
            # Store all data
            await self.store_esa_data(esa_data)
            await self.store_lima_data(lima_data)
            
        except Exception as e:
            logger.error(f"Error in ESA/Lima data collection: {e}")

async def main():
    """Main function to run the ESA/Lima data service"""
    async with ESALimaDataService() as service:
        while True:
            try:
                await service.fetch_and_store_all_data()
                logger.info("ESA/Lima data collection completed. Waiting 2 hours...")
                await asyncio.sleep(7200)  # Wait 2 hours
            except Exception as e:
                logger.error(f"Error in main loop: {e}")
                await asyncio.sleep(600)  # Wait 10 minutes on error

if __name__ == "__main__":
    asyncio.run(main())