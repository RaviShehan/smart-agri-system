from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import random
from datetime import datetime

app = FastAPI()

# Enable CORS for Frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def telemetry_stream():
    """Generates real-time sensor updates every 2 seconds."""
    while True:
        data = {
            "timestamp": datetime.now().strftime("%I:%M:%S %p"),
            "moisture": random.randint(35, 70),
            "temperature": random.randint(22, 34)
        }
        # SSE standard format: 'data: <json_string>\n\n'
        yield f"data: {json.dumps(data)}\n\n"
        await asyncio.sleep(2)

@app.get("/api/telemetry/stream")
async def stream_telemetry():
    return StreamingResponse(telemetry_stream(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
