import React, { useState, useEffect, useRef } from 'react';

const Chatbot = ({ isDarkMode, toggleDarkMode }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = Infinity; // Keep trying to reconnect
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const isConnectingRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const connect = () => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current || (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close existing connection if any
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {
        // Ignore errors when closing
      }
    }

    try {
      isConnectingRef.current = true;
      const ws = new WebSocket(import.meta.env.VITE_WS_URL);

      // const ws = new WebSocket('ws://localhost:8765');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to WebSocket server');
        isConnectingRef.current = false;
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        
        // Start ping interval to keep connection alive (every 15 seconds)
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ type: 'ping' }));
            } catch (e) {
              console.error('Error sending ping:', e);
            }
          }
        }, 15000);

        // Show connection message
        addSystemMessage('Connected to chatbot! Start chatting...');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle pong responses
          if (data.type === 'pong') {
            return; // Just acknowledge, don't display
          }
          
          handleMessage(data);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        isConnectingRef.current = false;
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        console.log('WebSocket connection closed', event.code, event.reason);
        isConnectingRef.current = false;
        setIsConnected(false);
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Don't show disconnect message if it was a normal close (code 1000)
        if (event.code !== 1000) {
          // Exponential backoff for reconnection
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Reconnection attempt ${reconnectAttemptsRef.current} after ${delay}ms`);
            if (reconnectAttemptsRef.current === 1) {
              addSystemMessage('Connection lost. Attempting to reconnect...');
            }
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('Error connecting:', error);
      isConnectingRef.current = false;
      setIsConnected(false);
      
      // Retry connection after delay
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      reconnectAttemptsRef.current++;
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    }
  };

  const handleMessage = (data) => {
    switch (data.type) {
      case 'system':
        addSystemMessage(data.message);
        break;
      case 'message':
        addMessage(data.message, 'bot');
        break;
      case 'typing':
        setIsTyping(data.status);
        break;
      case 'error':
        addErrorMessage(data.message);
        break;
      default:
        break;
    }
  };

  const addMessage = (text, sender) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text, sender, timestamp: new Date() },
    ]);
  };

  const addSystemMessage = (text) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text, sender: 'system', timestamp: new Date() },
    ]);
  };

  const addErrorMessage = (text) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text, sender: 'error', timestamp: new Date() },
    ]);
  };

  const sendMessage = () => {
    const message = inputMessage.trim();
    if (!message || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    addMessage(message, 'user');
    setInputMessage('');

    wsRef.current.send(JSON.stringify({ message: message }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    connect();
    return () => {
      // Clear ping interval
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      
      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Close WebSocket connection
      if (wsRef.current) {
        try {
          wsRef.current.close(1000, 'Component unmounting');
        } catch (e) {
          // Ignore errors
        }
        wsRef.current = null;
      }
    };
  }, []);

  return (
    <div className={`w-full h-screen ${isDarkMode ? 'bg-black' : 'bg-white'} flex flex-col overflow-hidden`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${isDarkMode ? 'from-green-400 to-cyan-400' : 'from-purple-600 to-pink-500'} text-white p-6 flex items-center justify-between shadow-lg`}>
        <div className="flex items-center space-x-4">
          <div
            className={`w-4 h-4 rounded-full ${
              isConnected ? (isDarkMode ? 'bg-green-500' : 'bg-green-400') : (isDarkMode ? 'bg-red-500' : 'bg-red-400')
            } ${isConnected ? 'animate-pulse' : ''}`}
          ></div>
          <h1 className="text-3xl font-bold text-white">Chatbot Interface</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm opacity-90 text-white font-semibold">
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          {/* Dark Mode Toggle Button */}
          <button
            onClick={toggleDarkMode}
            className={`p-3 rounded-full ${isDarkMode ? 'bg-black/30 hover:bg-black/50' : 'bg-white/30 hover:bg-white/50'} backdrop-blur-sm transition-all duration-200 group`}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              // Sun icon for light mode
              <svg
                className="w-6 h-6 text-yellow-300 group-hover:text-yellow-200 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              // Moon icon for dark mode
              <svg
                className="w-6 h-6 text-purple-900 group-hover:text-purple-800 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className={`flex-1 overflow-y-auto p-6 ${isDarkMode ? 'bg-black' : 'bg-gray-50'} space-y-4`}>
        {messages.length === 0 && (
          <div className={`text-center ${isDarkMode ? 'text-green-400' : 'text-gray-500'} mt-8`}>
            <p className="text-lg">Welcome! Start a conversation below.</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.sender === 'bot' && (
              <div className={`w-8 h-8 rounded-full ${isDarkMode ? 'bg-green-400' : 'bg-purple-500'} flex items-center justify-center ${isDarkMode ? 'text-black' : 'text-white'} font-bold mr-2 flex-shrink-0`}>
                B
              </div>
            )}
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                message.sender === 'user'
                  ? isDarkMode
                    ? 'bg-gradient-to-r from-green-400 to-cyan-400 text-black rounded-br-sm'
                    : 'bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-br-sm'
                  : message.sender === 'system'
                  ? isDarkMode
                    ? 'bg-cyan-900/50 text-cyan-300 border border-cyan-500 text-center mx-auto text-sm italic'
                    : 'bg-blue-100 text-blue-800 border border-blue-300 text-center mx-auto text-sm italic'
                  : message.sender === 'error'
                  ? isDarkMode
                    ? 'bg-red-900/50 text-red-300 border border-red-500 text-center mx-auto text-sm'
                    : 'bg-red-100 text-red-800 border border-red-300 text-center mx-auto text-sm'
                  : isDarkMode
                  ? 'bg-green-900/30 text-green-300 border border-green-500/50 rounded-bl-sm'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{message.text}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            {message.sender === 'user' && (
              <div className={`w-8 h-8 rounded-full ${isDarkMode ? 'bg-cyan-400' : 'bg-pink-500'} flex items-center justify-center ${isDarkMode ? 'text-black' : 'text-white'} font-bold ml-2 flex-shrink-0`}>
                U
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className={`w-8 h-8 rounded-full ${isDarkMode ? 'bg-green-400' : 'bg-purple-500'} flex items-center justify-center ${isDarkMode ? 'text-black' : 'text-white'} font-bold mr-2 flex-shrink-0`}>
              B
            </div>
            <div className={`${isDarkMode ? 'bg-green-900/30 border-green-500/50' : 'bg-white border-gray-200'} border rounded-2xl rounded-bl-sm px-4 py-3`}>
              <div className="flex space-x-2">
                <div className={`w-2 h-2 ${isDarkMode ? 'bg-green-400' : 'bg-gray-400'} rounded-full animate-bounce`}></div>
                <div className={`w-2 h-2 ${isDarkMode ? 'bg-green-400' : 'bg-gray-400'} rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }}></div>
                <div className={`w-2 h-2 ${isDarkMode ? 'bg-green-400' : 'bg-gray-400'} rounded-full animate-bounce`} style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Container */}
      <div className={`p-4 ${isDarkMode ? 'bg-black border-green-500/30' : 'bg-white border-gray-200'} border-t`}>
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            disabled={!isConnected}
            className={`flex-1 px-4 py-3 rounded-full focus:outline-none disabled:cursor-not-allowed ${
              isDarkMode
                ? 'bg-gray-900 text-green-300 border-2 border-green-500/50 focus:border-green-400 placeholder-green-500/50 disabled:bg-gray-800 disabled:text-gray-500'
                : 'bg-white text-gray-800 border-2 border-gray-300 focus:border-purple-500 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-400'
            }`}
          />
          <button
            onClick={sendMessage}
            disabled={!isConnected || !inputMessage.trim()}
            className={`px-6 py-3 rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 ${
              isDarkMode
                ? 'bg-gradient-to-r from-green-400 to-cyan-400 text-black hover:from-green-300 hover:to-cyan-300'
                : 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600'
            }`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;

