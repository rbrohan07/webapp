import asyncio
import websockets
import json
import os
from typing import Set
import aiohttp
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# OpenRouter API configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Groq API configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

# API choice: "openrouter" or "groq"
API_CHOICE = os.getenv("API_CHOICE", "groq")  # Default to "groq"

# Store active WebSocket connections
connected_clients: Set = set()

async def handle_openrouter_request(message: str) -> str:
    """Send request to OpenRouter API and return response"""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8765",  # Optional: for tracking
    }
    
    payload = {
        # "model": "tngtech/deepseek-r1t2-chimera:free", 
        "model": "arcee-ai/trinity-mini:free",     # You can change this to any model supported by OpenRouter
        "messages": [
            {
                "role": "user",
                "content": message
            }
        ]
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                OPENROUTER_API_URL,
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("choices", [{}])[0].get("message", {}).get("content", "Sorry, I couldn't generate a response.")
                else:
                    error_text = await response.text()
                    return f"Error: {response.status} - {error_text}"
    except asyncio.TimeoutError:
        return "Error: Request timed out. Please try again."
    except Exception as e:
        return f"Error: {str(e)}"

async def handle_groq_request(message: str) -> str:
    """Send request to Groq API and return response"""
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "groq/compound",  # You can change this to any model supported by Groq
        "messages": [
            {
                "role": "user",
                "content": message
            }
        ]
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                GROQ_API_URL,
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("choices", [{}])[0].get("message", {}).get("content", "Sorry, I couldn't generate a response.")
                else:
                    error_text = await response.text()
                    return f"Error: {response.status} - {error_text}"
    except asyncio.TimeoutError:
        return "Error: Request timed out. Please try again."
    except Exception as e:
        return f"Error: {str(e)}"

async def handle_client(websocket):
    """Handle individual WebSocket client connection"""
    # Register client
    connected_clients.add(websocket)
    print(f"Client connected. Total clients: {len(connected_clients)}")
    
    try:
        # Send welcome message
        await websocket.send(json.dumps({
            "type": "system",
            "message": "Connected to chatbot. Send a message to start chatting!"
        }))
        
        async for message in websocket:
            try:
                # Parse incoming message
                data = json.loads(message)
                user_message = data.get("message", "")
                
                # Handle ping/pong for keepalive
                if data.get("type") == "ping":
                    await websocket.send(json.dumps({"type": "pong"}))
                    continue
                
                if not user_message.strip():
                    await websocket.send(json.dumps({
                        "type": "error",
                        "message": "Please provide a non-empty message."
                    }))
                    continue
                
                # Send typing indicator
                await websocket.send(json.dumps({
                    "type": "typing",
                    "status": True
                }))

                # Get response from the selected API
                if API_CHOICE == "groq":
                    bot_response = await handle_groq_request(user_message)
                else:
                    bot_response = await handle_openrouter_request(user_message)

                # Send typing indicator off
                await websocket.send(json.dumps({
                    "type": "typing",
                    "status": False
                }))
                
                # Send bot response
                await websocket.send(json.dumps({
                    "type": "message",
                    "message": bot_response,
                    "sender": "bot"
                }))
                
            except json.JSONDecodeError:
                try:
                    await websocket.send(json.dumps({
                        "type": "error",
                        "message": "Invalid JSON format. Please send messages in the correct format."
                    }))
                except:
                    pass  # Connection might be closed
            except websockets.exceptions.ConnectionClosed:
                break  # Exit the loop if connection is closed
            except Exception as e:
                print(f"Error processing message: {e}")
                try:
                    await websocket.send(json.dumps({
                        "type": "error",
                        "message": f"An error occurred: {str(e)}"
                    }))
                except:
                    pass  # Connection might be closed
                
    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected normally")
    except websockets.exceptions.ConnectionClosedError:
        print("Client connection closed with error")
    except Exception as e:
        print(f"Error handling client: {e}")
    finally:
        # Unregister client
        connected_clients.discard(websocket)
        print(f"Client disconnected. Total clients: {len(connected_clients)}")

async def main():
    """Start the WebSocket server"""
    host = "localhost"
    port = 8765
    
    print(f"Starting WebSocket server on ws://{host}:{port}")
    if API_CHOICE == "groq":
        if not GROQ_API_KEY:
            print("WARNING: GROQ_API_KEY not set in .env file. Please create a .env file with your API key.")
        else:
            print(f"Groq API Key: Set (length: {len(GROQ_API_KEY)})")
    else:
        if not OPENROUTER_API_KEY:
            print("WARNING: OPENROUTER_API_KEY not set in .env file. Please create a .env file with your API key.")
        else:
            print(f"OpenRouter API Key: Set (length: {len(OPENROUTER_API_KEY)})")
    
    async with websockets.serve(
        handle_client, 
        host, 
        port,
        ping_interval=20,  # Send ping every 20 seconds
        ping_timeout=10,   # Wait 10 seconds for pong
        close_timeout=10   # Wait 10 seconds before closing
    ):
        print("WebSocket server is running. Press Ctrl+C to stop.")
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nShutting down server...")

