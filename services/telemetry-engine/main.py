from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import random
from datetime import datetime
import httpx

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def send_to_database(moisture: int, temperature: int):
  """Sends sensor data to Express backend for Prisma persistence."""
  async with httpx.AsyncClient() as client:
      try:
          await client.post(
              "http://localhost:4000/api/telemetry",
              json={"moisture": moisture, "temperature": temperature},
              timeout=2.0
          )
      except Exception as e:
          print(f"Failed to persist reading: {e}")

async def telemetry_stream():
    """Generates real-time sensor updates, saves to DB, and streams via SSE."""
    while True:
        moisture = random.randint(35, 70)
        temperature = random.randint(22, 34)

        # 1. Save reading asynchronously to PostgreSQL via Backend Core
        asyncio.create_task(send_to_database(moisture, temperature))

        data = {
            "timestamp": datetime.now().strftime("%I:%M:%S %p"),
            "moisture": moisture,
            "temperature": temperature
        }
        
        # 2. Yield reading to SSE frontend
        yield f"data: {json.dumps(data)}\n\n"
        await asyncio.sleep(2)

@app.get("/api/telemetry/stream")
async def stream_telemetry():
    return StreamingResponse(telemetry_stream(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
