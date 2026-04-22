import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import ChatPage from './components/ChatPage';

function App() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);

  const handleLogin = (userData) => {
    setUser(userData);
    setMessages([]);
  };

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
