import React, { useState, useRef, useEffect } from 'react';
import api from '../api';
import './Chatbot.css';

const Chatbot = () => {
    const [messages, setMessages] = useState(() => {
        const savedChats = localStorage.getItem('chatHistory');
        return savedChats ? JSON.parse(savedChats) : [
            { text: "Hello! I'm your Plant Care Assistant. Ask me anything about your plants! 🌱", sender: 'bot' }
        ];
    });
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        localStorage.setItem('chatHistory', JSON.stringify(messages));
    }, [messages]);

    const handleClear = () => {
        if (window.confirm("Are you sure you want to clear the chat history?")) {
            const initialMsg = [{ text: "Hello! I'm your Plant Care Assistant. Ask me anything about your plants! 🌱", sender: 'bot' }];
            setMessages(initialMsg);
            localStorage.setItem('chatHistory', JSON.stringify(initialMsg));
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { text: input, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('chatbot/', { message: input });
            const botMsg = { text: res.data.response, sender: 'bot' };
            setMessages(prev => [...prev, botMsg]);
        } catch (err) {
            console.error("Chatbot error:", err);
            const errorMsg = { text: "Sorry, I'm having trouble connecting right now.", sender: 'bot' };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chatbot-container">
            <div className="chatbot-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1 className="chat-title" style={{ margin: 0 }}>Plant Assistant 🤖</h1>
                <button onClick={handleClear} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem' }}>
                    Clear Chat
                </button>
            </div>
            <div className="chat-window">
                <div className="messages-list">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.sender}`}>
                            <div className="message-bubble">
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="message bot">
                            <div className="message-bubble typing">
                                <span>.</span><span>.</span><span>.</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <form className="chat-input-form" onSubmit={handleSend}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
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
