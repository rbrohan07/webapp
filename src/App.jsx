import React, { useState, useEffect } from 'react';
import Chatbot from './components/Chatbot.jsx';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage or default to dark mode
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    // Apply or remove dark mode class based on state
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save preference to localStorage
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500'} flex items-center justify-center p-0`}>
      <Chatbot isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
    </div>
  );
}

export default App;

