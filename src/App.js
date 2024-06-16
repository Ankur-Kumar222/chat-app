import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { firebase, auth, database } from './firebase';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        setLoading(false);
        loadUsers();
        setActiveUser(null); // Reset active user when a new user logs in
      } else {
        setUser(null);
        setLoading(false);
        setUsers([]);
        setActiveUser(null);
        setMessages([]); // Clear messages when the user logs out
      }
    });
    return unsubscribe;
  }, []);

  const loadUsers = () => {
    database.ref('users').on('value', (snapshot) => {
      const usersData = snapshot.val();
      const userList = [];
      for (let id in usersData) {
        if (id !== auth.currentUser.uid) {
          userList.push({ id, ...usersData[id] });
        }
      }
      setUsers(userList);
    });
  };

  useEffect(() => {
    if (activeUser) {
      const messagesRef1 = database.ref('user-messages').child(auth.currentUser.uid).child(activeUser.id);
      const messagesRef2 = database.ref('user-messages').child(activeUser.id).child(auth.currentUser.uid);

      const handleMessages = (snapshot) => {
        const msgs = snapshot.val();
        const msgList = [];
        for (let id in msgs) {
          msgList.push({ id, ...msgs[id] });
        }
        setMessages(msgList);
      };

      messagesRef1.on('value', handleMessages);
      messagesRef2.on('value', handleMessages);

      return () => {
        messagesRef1.off('value', handleMessages);
        messagesRef2.off('value', handleMessages);
      };
    }
  }, [activeUser]);

  const handleSendMessage = () => {
    if (message.trim() === '' || !activeUser) return;

    const messageId = database.ref('user-messages').child(auth.currentUser.uid).child(activeUser.id).push().key;
    const messageData = {
      sender: auth.currentUser.uid,
      text: message,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      status: 'sent'
    };

    const updates = {};
    updates[`/user-messages/${auth.currentUser.uid}/${activeUser.id}/${messageId}`] = messageData;
    updates[`/user-messages/${activeUser.id}/${auth.currentUser.uid}/${messageId}`] = messageData;

    database.ref().update(updates, () => {
      // Update status to 'delivered' for the sender's message
      database.ref(`/user-messages/${auth.currentUser.uid}/${activeUser.id}/${messageId}`).update({ status: 'delivered' });
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId ? { ...msg, status: 'delivered' } : msg
        )
      );
    });

    // Add message to the local state immediately for real-time display
    setMessages((prevMessages) => [...prevMessages, { id: messageId, ...messageData }]);
    setMessage('');
  };

  const handleLogin = async () => {
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSignup = async () => {
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      await database.ref('users/' + user.uid).set({
        email: user.email,
        online: true
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error(error);
    }
  };

  const handleUserClick = (user) => {
    setActiveUser(user);
    setMessages([]); // Clear messages when a new user is selected
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>Login</h1>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          <button onClick={handleLogin}>Login</button>
          <button onClick={handleSignup}>Signup</button>
        </header>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Chat App</h1>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </header>
        <div className="chat-container">
          <div className="user-list">
            <h2>Active Users</h2>
            <ul>
              {users.map((user) => (
                <li key={user.id} onClick={() => handleUserClick(user)}>
                  {user.email}
                </li>
              ))}
            </ul>
          </div>
          <div className="chat-section">
            {activeUser && (
              <>
                <div className="message-container">
                  {messages
                    .sort((a, b) => a.timestamp - b.timestamp) // Sort messages by timestamp
                    .map((msg) => (
                      <div key={msg.id} className={`message ${msg.sender === auth.currentUser.uid ? 'sent' : 'received'}`}>
                        <p className="message-sender">{msg.sender === auth.currentUser.uid ? 'You' : activeUser.email}</p>
                        <p className="message-text">{msg.text}</p>
                        <p className="message-status">{msg.status}</p>
                      </div>
                    ))}
                </div>
                <div className="input-container">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message"
                  />
                  <button onClick={handleSendMessage}>Send</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
