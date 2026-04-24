import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import ChatPage from './components/ChatPage';
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:5000';

function App() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('chatUser');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      const socket = io(SOCKET_SERVER_URL, { withCredentials: true });
      setUser({ ...userData, socket });
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (userData) => {
    // Save to localStorage
    localStorage.setItem('chatUser', JSON.stringify({
      username: userData.username,
      room: userData.room
    }));
    setUser(userData);
    setMessages([]);
  };

  const handleLogout = () => {
    // Clear localStorage and disconnect socket
    if (user && user.socket) {
      user.socket.disconnect();
    }
    localStorage.removeItem('chatUser');
    setUser(null);
    setMessages([]);
  };

  // Show loading state while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mb-4"></div>
          <p className="text-xl font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          user ? 
            <Navigate to={`/chat/${user.room}`} /> : 
            <Login onLogin={handleLogin} />
        } 
      />
      <Route 
        path="/chat/:room" 
        element={
          user ? (
            <ChatPage 
              username={user.username}
              socket={user.socket}
              messages={messages}
              setMessages={setMessages}
              onLogout={handleLogout}
            />
          ) : (
            <Navigate to="/" />
          )
        } 
      />
    </Routes>
  );
}

export default App;
