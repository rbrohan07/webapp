# Chatbot Interface

A real-time chatbot application built with Python WebSocket backend and React frontend, integrated with OpenRouter API for AI-powered conversations.

## Features

- 🚀 **Real-time Communication**: WebSocket-based bidirectional communication
- 🎨 **Modern UI**: Beautiful React interface with Tailwind CSS
- 🌓 **Dark/Light Mode**: Toggle between themes with fluorescent colors
- 🤖 **AI-Powered**: Integration with OpenRouter API
- 📱 **Responsive Design**: Works on desktop and mobile
- 🔄 **Auto-reconnection**: Automatic reconnection on connection loss

## Tech Stack

- **Backend**: Python, WebSockets, aiohttp
- **Frontend**: React, Vite, Tailwind CSS
- **API**: OpenRouter

## Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- OpenRouter API Key

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd project
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Install Node.js dependencies:
```bash
npm install
```

4. Set up environment variables:
```bash
# Create .env file
OPENROUTER_API_KEY=your-api-key-here
```

5. Start the backend server:
```bash
python chatbot_server.py
```

6. Start the frontend (in a new terminal):
```bash
npm run dev
```

Visit `http://localhost:3000` to use the chatbot!

## Configuration

Get your OpenRouter API key from [OpenRouter](https://openrouter.ai/keys)

## Documentation

See [documentation.md](./documentation.md) for detailed documentation.

## License

MIT

