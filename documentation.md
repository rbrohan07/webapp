# Chatbot Interface Documentation

A real-time chatbot application built with Python WebSocket backend and React frontend, integrated with OpenRouter API for AI-powered conversations.

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Usage](#usage)
- [API Configuration](#api-configuration)
- [Troubleshooting](#troubleshooting)
- [Technology Stack](#technology-stack)

## Features

- **Real-time Communication**: WebSocket-based bidirectional communication for instant messaging
- **Modern UI**: Beautiful React interface with Tailwind CSS styling
- **AI-Powered**: Integration with OpenRouter API for intelligent responses
- **Connection Status**: Visual indicator for WebSocket connection status
- **Typing Indicators**: Real-time typing indicators when the bot is processing
- **Auto-reconnection**: Automatic reconnection on connection loss
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Message History**: Persistent message display with timestamps

## Project Structure

```
project/
├── chatbot_server.py      # Python WebSocket server
├── requirements.txt        # Python dependencies
├── env.example            # Environment variables template
├── .env                   # Environment variables (create this)
├── package.json           # Node.js dependencies
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
├── index.html             # HTML template (Vite entry point)
├── src/
│   ├── index.js          # React entry point
│   ├── index.css         # Global styles with Tailwind
│   ├── App.js            # Main App component
│   └── components/
│       └── Chatbot.js    # Chatbot component
└── documentation.md      # This file
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8+**: [Download Python](https://www.python.org/downloads/)
- **Node.js 16+**: [Download Node.js](https://nodejs.org/)
- **npm or yarn**: Comes with Node.js
- **OpenRouter API Key**: [Get your API key](https://openrouter.ai/keys)

## Installation

### 1. Clone or Navigate to the Project

```bash
cd project
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- `websockets` - WebSocket server library
- `aiohttp` - Async HTTP client for API requests
- `python-dotenv` - Environment variable management

### 3. Install Node.js Dependencies

```bash
npm install
```

This will install:
- React and React DOM
- Vite (build tool and dev server)
- Tailwind CSS and related dependencies

## Configuration

### 1. Set Up Environment Variables

1. Copy the example environment file:
   ```bash
   cp env.example .env
   ```

2. Open `.env` and add your OpenRouter API key:
   ```
   OPENROUTER_API_KEY=your-actual-api-key-here
   ```

   **Important**: Never commit the `.env` file to version control. It's already included in `.gitignore`.

### 2. Get Your OpenRouter API Key

1. Visit [OpenRouter](https://openrouter.ai/)
2. Sign up or log in
3. Navigate to [API Keys](https://openrouter.ai/keys)
4. Create a new API key
5. Copy the key to your `.env` file

## Running the Application

The application consists of two parts that need to run simultaneously:

### 1. Start the Python WebSocket Server

Open a terminal and run:

```bash
python chatbot_server.py
```

You should see:
```
Starting WebSocket server on ws://localhost:8765
OpenRouter API Key: Set (length: XX)
WebSocket server is running. Press Ctrl+C to stop.
```

### 2. Start the React Frontend

Open a **new terminal** and run:

```bash
npm run dev
```

The React app will automatically open in your browser at `http://localhost:3000`.

If it doesn't open automatically, navigate to `http://localhost:3000` manually.

## Usage

1. **Connect**: The chatbot automatically connects when the page loads. You'll see a green indicator when connected.

2. **Send Messages**: 
   - Type your message in the input field
   - Press Enter or click the "Send" button
   - Your message will appear on the right side

3. **Receive Responses**: 
   - The bot's responses appear on the left side
   - A typing indicator shows when the bot is processing
   - Responses are generated using the OpenRouter API

4. **Connection Status**: 
   - Green dot = Connected
   - Red dot = Disconnected
   - The app will automatically attempt to reconnect if disconnected

## API Configuration

### Changing the AI Model

You can change the AI model in `chatbot_server.py`. Edit line 24:

```python
payload = {
    "model": "openai/gpt-3.5-turbo",  # Change this to any OpenRouter model
    "messages": [...]
}
```

Popular models available on OpenRouter:
- `openai/gpt-3.5-turbo` - Fast and cost-effective
- `openai/gpt-4` - More capable but slower
- `anthropic/claude-3-opus` - High-quality responses
- `google/gemini-pro` - Google's model

See [OpenRouter Models](https://openrouter.ai/models) for the full list.

### Customizing Server Settings

In `chatbot_server.py`, you can modify:

- **Host and Port** (lines 122-123):
  ```python
  host = "localhost"
  port = 8765
  ```

- **Request Timeout** (line 39):
  ```python
  timeout=aiohttp.ClientTimeout(total=30)  # seconds
  ```

## Troubleshooting

### Server Won't Start

**Issue**: `ModuleNotFoundError` or import errors
- **Solution**: Make sure all Python dependencies are installed:
  ```bash
  pip install -r requirements.txt
  ```

**Issue**: `OPENROUTER_API_KEY not set`
- **Solution**: Create a `.env` file with your API key (see Configuration section)

### Frontend Won't Connect

**Issue**: Connection status shows "Disconnected"
- **Solution**: 
  1. Make sure the Python server is running
  2. Check that the WebSocket URL in `src/components/Chatbot.js` matches your server (line 23)
  3. Check browser console for errors

**Issue**: `npm run dev` fails
- **Solution**: 
  1. Delete `node_modules` and `package-lock.json`
  2. Run `npm install` again
  3. Try `npm run dev` again

### API Errors

**Issue**: "Error: 401" or "Unauthorized"
- **Solution**: Check that your OpenRouter API key is correct in the `.env` file

**Issue**: "Error: Request timed out"
- **Solution**: The API request took too long. This can happen with slower models. Try:
  - Using a faster model
  - Increasing the timeout in `chatbot_server.py`

### Port Already in Use

**Issue**: `Address already in use` error
- **Solution**: 
  1. Find the process using the port: `lsof -i :8765` (Mac/Linux) or `netstat -ano | findstr :8765` (Windows)
  2. Kill the process or change the port in `chatbot_server.py`

## Technology Stack

### Backend
- **Python 3.8+**: Programming language
- **websockets**: WebSocket server implementation
- **aiohttp**: Async HTTP client for API requests
- **python-dotenv**: Environment variable management

### Frontend
- **React 18**: UI library
- **Vite 5**: Fast build tool and dev server
- **Tailwind CSS 3**: Utility-first CSS framework
- **WebSocket API**: Browser WebSocket client

### API
- **OpenRouter API**: AI model routing service

## Development

### Building for Production

To create a production build of the React app:

```bash
npm run build
```

This creates an optimized build in the `dist/` directory.

To preview the production build:

```bash
npm run preview
```

### Code Structure

- **Backend**: The Python server handles WebSocket connections and forwards messages to OpenRouter API
- **Frontend**: React components manage UI state and WebSocket communication
- **Styling**: Tailwind CSS provides utility classes for rapid UI development

## Security Notes

- Never commit your `.env` file to version control
- Keep your OpenRouter API key secure
- Consider implementing rate limiting for production use
- Add CORS configuration if deploying to different domains

## License

This project is open source and available for personal and commercial use.

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review OpenRouter API documentation: https://openrouter.ai/docs
3. Check React and WebSocket documentation

---

**Last Updated**: 2024
**Version**: 1.0.0

