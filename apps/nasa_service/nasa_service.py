"""
NASA Data Service for Gemelo Digital Chancay
Integrates NASA Earth Observation data including MODIS, Landsat, VIIRS, and other satellite datasets
"""

import asyncio
import logging
import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
import aiohttp
import asyncpg
import json
from dataclasses import dataclass
from pydantic import BaseModel
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/gemelo")

class NASADataPoint(BaseModel):
    timestamp: datetime
    dataset: str
    parameter: str
    value: float
    latitude: float
    longitude: float
    metadata: Dict[str, Any] = {}

@dataclass
class BoundingBox:
    """Bounding box for Chancay region"""
    min_lat: float = -11.65  # Chancay area
    max_lat: float = -11.50
    min_lon: float = -77.35
    max_lon: float = -77.20

class NASADataService:
    """Service to fetch and process NASA Earth Observation data"""
    
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.bbox = BoundingBox()
        
        # NASA API endpoints
        self.nasa_endpoints = {
            "modis_temperature": "https://firms.modaps.eosdis.nasa.gov/api/country/csv/API_KEY/MODIS_C6_1/ARG/1",
            "viirs_temperature": "https://firms.modaps.eosdis.nasa.gov/api/country/csv/API_KEY/VIIRS_SNPP_SP/ARG/1",
            "landsat": "https://landsat-look.usgs.gov/stac/api/v1/search",
            "giovanni": "https://giovanni.gsfc.nasa.gov/giovanni/daac-bin/service_manager.pl",
            "power": "https://power.larc.nasa.gov/api/temporal/daily/point"
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
    
    async def fetch_nasa_power_data(self, parameters: List[str] = None, days_back: int = 7) -> List[NASADataPoint]:
        """
        Fetch NASA POWER weather data for Chancay region
        Parameters like temperature, precipitation, wind speed, etc.
        """
        if parameters is None:
            parameters = ["T2M", "PRECTOTCORR", "WS2M", "RH2M", "PS"]  # Temperature, precipitation, wind, humidity, pressure
        
        if not self.session:
            raise RuntimeError("Session not initialized")
        
        # Center of Chancay port
        lat, lon = -11.5675, -77.2725
        start_date = (datetime.now() - timedelta(days=days_back)).strftime("%Y%m%d")
        end_date = datetime.now().strftime("%Y%m%d")
        
        url = f"{self.nasa_endpoints['power']}"
        params = {
            "parameters": ",".join(parameters),
            "community": "RE",
            "longitude": lon,
            "latitude": lat,
            "start": start_date,
            "end": end_date,
            "format": "JSON"
        }
        
        try:
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return await self._process_power_data(data, lat, lon)
                else:
                    logger.warning(f"NASA POWER API returned status {response.status}")
                    return []
        except Exception as e:
            logger.error(f"Error fetching NASA POWER data: {e}")
            return []
    
    async def _process_power_data(self, data: Dict, lat: float, lon: float) -> List[NASADataPoint]:
        """Process NASA POWER API response into data points"""
        data_points = []
        
        if "properties" not in data or "parameter" not in data["properties"]:
            return data_points
        
        parameters = data["properties"]["parameter"]
        
        for param_name, param_data in parameters.items():
            if isinstance(param_data, dict):
                for date_str, value in param_data.items():
                    try:
                        date_obj = datetime.strptime(date_str, "%Y%m%d")
                        if isinstance(value, (int, float)) and value != -999:  # -999 is NASA's missing data value
                            data_points.append(NASADataPoint(
                                timestamp=date_obj,
                                dataset="NASA_POWER",
                                parameter=param_name,
                                value=float(value),
                                latitude=lat,
                                longitude=lon,
                                metadata={"source": "NASA POWER", "quality": "daily_average"}
                            ))
                    except (ValueError, TypeError) as e:
                        logger.warning(f"Error processing data point {date_str}: {e}")
                        continue
        
        return data_points
    
    async def fetch_synthetic_satellite_data(self) -> List[NASADataPoint]:
        """
        Generate synthetic satellite data for demonstration
        In production, this would connect to actual NASA satellite APIs
        """
        data_points = []
        now = datetime.now()
        
        # Generate synthetic MODIS land surface temperature data
        for i in range(24):  # Last 24 hours
            timestamp = now - timedelta(hours=i)
            
            # Random points within Chancay area
            lat = self.bbox.min_lat + (self.bbox.max_lat - self.bbox.min_lat) * np.random.random()
            lon = self.bbox.min_lon + (self.bbox.max_lon - self.bbox.min_lon) * np.random.random()
            
            # Synthetic temperature data (Celsius)
            temp = 20 + 5 * np.sin(i * 0.26) + np.random.normal(0, 2)
            
            data_points.append(NASADataPoint(
                timestamp=timestamp,
                dataset="MODIS_LST",
                parameter="land_surface_temperature",
                value=temp,
                latitude=lat,
                longitude=lon,
                metadata={"source": "MODIS", "synthetic": True}
            ))
            
            # Synthetic NDVI data
            ndvi = 0.3 + 0.4 * np.random.random()
            data_points.append(NASADataPoint(
                timestamp=timestamp,
                dataset="MODIS_NDVI",
                parameter="normalized_difference_vegetation_index",
                value=ndvi,
                latitude=lat,
                longitude=lon,
                metadata={"source": "MODIS", "synthetic": True}
            ))
        
        return data_points
    
    async def store_data_points(self, data_points: List[NASADataPoint]):
        """Store NASA data points in the database"""
        if not data_points:
            return
        
        conn = await self.get_database_connection()
        try:
            # Create table for NASA data if it doesn't exist
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS gd.nasa_data (
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
            
            # Create spatial index
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS nasa_data_gix ON gd.nasa_data USING GIST (geom);
            """)
            
            # Create time index
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS nasa_data_time_idx ON gd.nasa_data (timestamp DESC);
            """)
            
            # Insert data points
            for dp in data_points:
                await conn.execute("""
                    INSERT INTO gd.nasa_data (timestamp, dataset, parameter, value, latitude, longitude, geom, metadata)
                    VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($7, $8), 4326), $9)
                """, dp.timestamp, dp.dataset, dp.parameter, dp.value, dp.latitude, dp.longitude,
                    dp.longitude, dp.latitude, json.dumps(dp.metadata))
            
            logger.info(f"Stored {len(data_points)} NASA data points")
            
        finally:
            await conn.close()
    
    async def fetch_and_store_all_data(self):
        """Main method to fetch and store all NASA data"""
        logger.info("Starting NASA data collection...")
        
        try:
            # Fetch NASA POWER data (real API)
            power_data = await self.fetch_nasa_power_data()
            logger.info(f"Fetched {len(power_data)} NASA POWER data points")
            
            # Fetch synthetic satellite data for demo
            satellite_data = await self.fetch_synthetic_satellite_data()
            logger.info(f"Generated {len(satellite_data)} synthetic satellite data points")
            
            # Store all data
            all_data = power_data + satellite_data
            await self.store_data_points(all_data)
            
        except Exception as e:
            logger.error(f"Error in NASA data collection: {e}")

async def main():
    """Main function to run the NASA data service"""
    async with NASADataService() as service:
        while True:
            try:
                await service.fetch_and_store_all_data()
                logger.info("NASA data collection completed. Waiting 1 hour...")
                await asyncio.sleep(3600)  # Wait 1 hour
            except Exception as e:
                logger.error(f"Error in main loop: {e}")
                await asyncio.sleep(300)  # Wait 5 minutes on error

if __name__ == "__main__":
    asyncio.run(main())