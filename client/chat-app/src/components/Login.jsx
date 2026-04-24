import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:5000';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const savedUser = localStorage.getItem('chatUser');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      navigate(`/chat/${userData.room}`);
    }
  }, [navigate]);

  const joinRoom = () => {
    if (room !== '' && username.trim() !== '') {
      const socket = io(SOCKET_SERVER_URL, { withCredentials: true });
      onLogin({ username: username.trim(), room, socket });
      socket.emit('join_room', room);
      navigate(`/chat/${room}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md transform transition-all hover:scale-105">
        {/* Logo/Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            ChatApp
          </h1>
          <p className="text-gray-600">Connect and chat in real-time</p>
        </div>

        {/* Form */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              👤 Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 bg-gray-50 hover:bg-white"
              onKeyPress={(e) => e.key === 'Enter' && room && joinRoom()}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🏠 Room Code
            </label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Enter room code to join"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 bg-gray-50 hover:bg-white"
              onKeyPress={(e) => e.key === 'Enter' && username && joinRoom()}
            />
          </div>

          <button
            onClick={joinRoom}
            disabled={!username.trim() || !room}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
          >
            🚀 Join Chat Room
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            💡 Tip: Share the room code with friends to chat together
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
