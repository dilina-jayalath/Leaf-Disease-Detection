import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Bot, Send, Trash2 } from 'lucide-react';
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

      setChatSource(response.data.source || null);
      setChatProvider(response.data.provider || null);
      setMessages((previousMessages) => [
        ...previousMessages,
        { text: response.data.response, sender: 'bot' },
      ]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setChatSource(null);
      setChatProvider(null);
      setMessages((previousMessages) => [
        ...previousMessages,
        { text: 'Sorry, the assistant is unavailable right now.', sender: 'bot' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const providerLabel =
    chatSource === 'ai'
      ? `${chatProvider === 'gemini' ? 'Gemini' : chatProvider === 'openai' ? 'OpenAI' : 'AI'} active`
      : chatSource
        ? 'Rule-based fallback'
        : 'Ready';

  return (
    <Paper variant="outlined" className="chatbot-shell">
      <div className="chatbot-header">
        <Stack direction="row" spacing={1.5} alignItems="center">
          <div className="assistant-icon">
            <Bot size={22} />
          </div>
          <div>
            <Typography variant="h5" fontWeight={800}>
              Plant Assistant
            </Typography>
            <Typography color="text.secondary" fontSize={14}>
              Ask about symptoms, treatment, prevention, and crop care.
            </Typography>
          </div>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            color={chatSource === 'ai' ? 'success' : chatSource === 'rules' ? 'warning' : 'default'}
            label={providerLabel}
            size="small"
          />
          <IconButton onClick={handleClear} aria-label="Clear chat" color="error">
            <Trash2 size={18} />
          </IconButton>
        </Stack>
      </div>

      <div className="messages-list">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            <div className="message-bubble">{message.text}</div>
          </div>
        ))}
        {loading && (
          <div className="message bot">
            <div className="message-bubble typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSend}>
        <TextField
          fullWidth
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type a plant care question"
          disabled={loading}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={loading || !input.trim()}
          endIcon={<Send size={17} />}
        >
          Send
        </Button>
      </form>
    </Paper>
  );
};

export default Chatbot;
