import asyncio
import json
import os
from typing import Set

import aiohttp
import websockets
from dotenv import load_dotenv

# -------------------- ENV SETUP --------------------
load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
API_CHOICE = os.getenv("API_CHOICE", "groq")  # groq | openrouter

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

PORT = int(os.getenv("PORT", 8765))  # Render/Fly sets PORT automatically

# -------------------- CLIENT STORAGE --------------------
connected_clients: Set[websockets.WebSocketServerProtocol] = set()

# -------------------- LLM HANDLERS --------------------
async def handle_openrouter_request(message: str) -> str:
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://your-app.vercel.app",  # optional
    }

    payload = {
        "model": "arcee-ai/trinity-mini:free",
        "messages": [{"role": "user", "content": message}],
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                OPENROUTER_API_URL,
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=30),
            ) as response:
                data = await response.json()
                return (
                    data.get("choices", [{}])[0]
                    .get("message", {})
                    .get("content", "No response.")
                )
    except Exception as e:
        return f"Error: {str(e)}"


async def handle_groq_request(message: str) -> str:
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "groq/compound",
        "messages": [{"role": "user", "content": message}],
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                GROQ_API_URL,
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=30),
            ) as response:
                data = await response.json()
                return (
                    data.get("choices", [{}])[0]
                    .get("message", {})
                    .get("content", "No response.")
                )
    except Exception as e:
        return f"Error: {str(e)}"

# -------------------- WEBSOCKET HANDLER --------------------
async def handle_client(websocket):
    connected_clients.add(websocket)
    print(f"✅ Client connected | Active: {len(connected_clients)}")

    try:
        await websocket.send(json.dumps({
            "type": "system",
            "message": "Connected successfully"
        }))

        async for raw_message in websocket:
            data = json.loads(raw_message)

            # Keep-alive
            if data.get("type") == "ping":
                await websocket.send(json.dumps({"type": "pong"}))
                continue

            user_message = data.get("message", "").strip()
            if not user_message:
                await websocket.send(json.dumps({
                    "type": "error",
                    "message": "Empty message"
                }))
                continue

            await websocket.send(json.dumps({"type": "typing", "status": True}))

            if API_CHOICE == "groq":
                reply = await handle_groq_request(user_message)
            else:
                reply = await handle_openrouter_request(user_message)

            await websocket.send(json.dumps({"type": "typing", "status": False}))
            await websocket.send(json.dumps({
                "type": "message",
                "sender": "bot",
                "message": reply
            }))

    except websockets.exceptions.ConnectionClosed:
        print("⚠️ Client disconnected")
    except Exception as e:
        print("❌ Error:", e)
    finally:
        connected_clients.discard(websocket)
        print(f"🔌 Client removed | Active: {len(connected_clients)}")

# -------------------- SERVER START --------------------
async def main():
    print("🚀 Starting WebSocket server")

    async with websockets.serve(
        handle_client,
        host="0.0.0.0",        # 🔥 CRITICAL
        port=PORT,
        ping_interval=20,
        ping_timeout=10,
        close_timeout=10,
    ):
        print(f"🌍 Server running on port {PORT}")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("🛑 Server stopped")
