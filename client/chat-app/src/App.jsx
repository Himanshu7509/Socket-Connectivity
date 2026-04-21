import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:5000';
const socket = io(SOCKET_SERVER_URL, { withCredentials: true });

function App() {
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isJoined, setIsJoined] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for incoming messages and load previous messages
  useEffect(() => {
    // Listen for new messages
    socket.on('receive_message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    // Listen for loading previous messages
    socket.on('load_messages', (previousMessages) => {
      setMessages(previousMessages);
      setIsJoined(true);
    });

    return () => {
      socket.off('receive_message');
      socket.off('load_messages');
    };
  }, []);

  // Join room
  const joinRoom = () => {
    if (room !== '' && username.trim() !== '') {
      socket.emit('join_room', room);
    }
  };

  // Send message
  const sendMessage = () => {
    if (message.trim() !== '' && room !== '') {
      const messageData = {
        room,
        username: username.trim() || 'Anonymous',
        message: message.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      socket.emit('send_message', messageData);
      setMessages((prev) => [...prev, messageData]);
      setMessage('');
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Login Screen
  if (!isJoined) {
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

  // Chat Screen
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">ChatApp</h1>
              <p className="text-xs text-white/80">Room: {room}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold">{username}</p>
              <p className="text-xs text-green-300">● Online</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
              {username.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d1d5db\' fill-opacity=\'0.15\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
        <div className="max-w-4xl mx-auto space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg font-medium">No messages yet</p>
              <p className="text-gray-400 text-sm mt-2">Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isOwnMessage = msg.username === (username.trim() || 'Anonymous');
              const showAvatar = !isOwnMessage && (index === 0 || messages[index - 1].username !== msg.username);
              
              return (
                <div
                  key={index}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div className={`flex items-end space-x-2 max-w-[85%] sm:max-w-[70%] ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar */}
                    {!isOwnMessage && (
                      <div className="w-8 h-8 flex-shrink-0">
                        {showAvatar ? (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                            {msg.username.charAt(0).toUpperCase()}
                          </div>
                        ) : (
                          <div className="w-8 h-8" />
                        )}
                      </div>
                    )}
                    
                    {/* Message Bubble */}
                    <div
                      className={`px-4 py-2.5 rounded-2xl shadow-md ${
                        isOwnMessage
                          ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-md'
                          : 'bg-white text-gray-800 rounded-bl-md'
                      }`}
                    >
                      {!isOwnMessage && showAvatar && (
                        <p className="text-xs font-bold mb-1 text-indigo-600">
                          {msg.username}
                        </p>
                      )}
                      <p className="text-sm leading-relaxed break-words">{msg.message}</p>
                      <p
                        className={`text-xs mt-1 text-right ${
                          isOwnMessage ? 'text-white/70' : 'text-gray-500'
                        }`}
                      >
                        {msg.time}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center space-x-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-5 py-3 border-2 border-gray-200 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 bg-gray-50 hover:bg-white"
          />
          <button
            onClick={sendMessage}
            disabled={!message.trim()}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white p-3 rounded-full transition-all duration-200 transform hover:scale-110 disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
