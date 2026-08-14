import os
import time
import random
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")
engine = create_engine(DB_URL)

def get_device_and_telemetry_tables():
    """Inspects database tables to find exact table & column names without throwing errors."""
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    device_table = None
    telemetry_table = None
    
    for t in tables:
        if t.lower() in ['device', 'devices']:
            device_table = t
        elif t.lower() in ['telemetrylog', 'telemetry_log', 'telemetrydata', 'telemetry_data', 'telemetry']:
            telemetry_table = t
            
    return device_table, telemetry_table

def get_first_device_id(device_table):
    with engine.connect() as conn:
        result = conn.execute(text(f'SELECT id FROM "{device_table}" LIMIT 1;'))
        row = result.fetchone()
        return row[0] if row else None

def generate_and_insert_telemetry(device_id, telemetry_table):
    soil_moisture = round(random.uniform(30.0, 60.0), 2)
    temperature = round(random.uniform(22.0, 32.0), 2)
    humidity = round(random.uniform(40.0, 80.0), 2)
    
    # Query matching Prisma schema: TelemetryLog with soilMoisture, temperature, humidity
    query = text(f"""
        INSERT INTO "{telemetry_table}" (id, "deviceId", "soilMoisture", temperature, humidity, timestamp)
        VALUES (gen_random_uuid(), :device_id, :soil_moisture, :temperature, :humidity, NOW());
    """)
    
    with engine.begin() as conn:
        conn.execute(query, {
            "device_id": device_id,
            "soil_moisture": soil_moisture,
            "temperature": temperature,
            "humidity": humidity
        })
    
    time_str = datetime.now().strftime("%H:%M:%S")
    print(f"[{time_str}] 📡 Telemetry Sent -> Device: {device_id[:8]}... | Soil Moisture: {soil_moisture}% | Temp: {temperature}°C | Humidity: {humidity}%")

if __name__ == "__main__":
    print("🌱 Starting IoT Telemetry Engine...")
    
    device_table, telemetry_table = get_device_and_telemetry_tables()
    
    if not device_table or not telemetry_table:
        print("❌ Could not locate device or telemetry tables in PostgreSQL. Please verify migration.")
        exit(1)
        
    print(f"🔍 Discovered Tables -> Device Table: '{device_table}' | Telemetry Table: '{telemetry_table}'")
    
    device_id = get_first_device_id(device_table)
    if not device_id:
        print("❌ No device records found in database.")
        exit(1)
        
    print(f"✅ Bound to Device ID: {device_id}")
    print("🔄 Streaming sensor telemetry every 5 seconds (Press Ctrl+C to stop)...\n")
    
    try:
        while True:
            generate_and_insert_telemetry(device_id, telemetry_table)
            time.sleep(5)
    except KeyboardInterrupt:
        print("\n🛑 Telemetry stream stopped.")