import React, { useEffect, useRef, useState } from 'react';
import api from '../api';
import './Chatbot.css';

const INITIAL_MESSAGE = {
  text: "Hello! I'm your Plant Care Assistant. Ask me about corn diseases, symptoms, or treatment.",
  sender: 'bot',
};

const CHAT_STORAGE_KEY = 'chatHistory';
const MAX_HISTORY_ITEMS = 10;

const Chatbot = () => {
  const [messages, setMessages] = useState(() => {
    const savedChats = localStorage.getItem(CHAT_STORAGE_KEY);
    return savedChats ? JSON.parse(savedChats) : [INITIAL_MESSAGE];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatSource, setChatSource] = useState(null);
  const [chatProvider, setChatProvider] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const buildHistoryPayload = () =>
    messages
      .filter((message) => message.sender === 'user' || message.sender === 'bot')
      .slice(-MAX_HISTORY_ITEMS)
      .map((message) => ({
        role: message.sender === 'user' ? 'user' : 'assistant',
        content: message.text,
      }));

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      setMessages([INITIAL_MESSAGE]);
      setChatSource(null);
      setChatProvider(null);
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify([INITIAL_MESSAGE]));
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    const userMessage = { text: trimmedInput, sender: 'user' };
    const history = buildHistoryPayload();

    setMessages((previousMessages) => [...previousMessages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('chatbot/', {
        message: trimmedInput,
        history,
      });
      const botMessage = {
        text: response.data.response,
        sender: 'bot',
      };

      setChatSource(response.data.source || null);
      setChatProvider(response.data.provider || null);
      setMessages((previousMessages) => [...previousMessages, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setChatSource(null);
      setChatProvider(null);
      const fallbackMessage = {
        text: 'Sorry, the assistant is unavailable right now.',
        sender: 'bot',
      };
      setMessages((previousMessages) => [...previousMessages, fallbackMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      <div
        className="chatbot-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}
      >
        <div>
          <h1 className="chat-title" style={{ margin: 0 }}>
            Plant Assistant
          </h1>
          {chatSource && (
            <p className={`chat-source ${chatSource}`}>
              {chatSource === 'ai'
                ? `${chatProvider === 'gemini' ? 'Gemini' : chatProvider === 'openai' ? 'OpenAI' : 'AI'} agent active`
                : 'Rule-based fallback active'}
            </p>
          )}
        </div>
        <button
          onClick={handleClear}
          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem' }}
        >
          Clear Chat
        </button>
      </div>
      <div className="chat-window">
        <div className="messages-list">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.sender}`}>
              <div className="message-bubble">{message.text}</div>
            </div>
          ))}
          {loading && (
            <div className="message bot">
              <div className="message-bubble typing">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form className="chat-input-form" onSubmit={handleSend}>
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type a message..."
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
