"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Send, User as UserIcon } from 'lucide-react';
import Image from 'next/image';

interface Message {
    id: string;
    content: string;
    senderId: string;
    sender: {
        username: string;
        avatarUrl?: string;
    };
    createdAt: string;
}

interface ChatInterfaceProps {
    partnerId: string;
    partnerName: string;
    partnerAvatar?: string;
}

export default function ChatInterface({ partnerId, partnerName, partnerAvatar }: ChatInterfaceProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = async () => {
        if (!user) return;
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
            const res = await fetch(`${apiUrl}/api/messages/${partnerId}`, {
                headers: { 'Authorization': `Bearer ${user.token}` }, // Assuming cookie auth, but sending bearer just in case logic changes. Actually context doesn't expose token usually if HTTPOnly. 
                // Wait, AuthContext uses cookies. So standard fetch credentials include should work.
                credentials: 'include'
            });
            const data = await res.json();
            if (data.messages) {
                setMessages(data.messages);
            }
        } catch (error) {
            console.error('Failed to load chat', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // Poll every 3s
        return () => clearInterval(interval);
    }, [partnerId, user]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        // Optimistic UI update could go here, but let's rely on fetch for consistency first
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
            await fetch(`${apiUrl}/api/messages/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId: partnerId, content: newMessage }),
                credentials: 'include'
            });
            setNewMessage('');
            fetchMessages(); // Instant refresh
        } catch (error) {
            console.error('Failed to send', error);
        }
    };

    if (loading) return <div className="p-10 text-center text-white/50">Loading chat...</div>;

    return (
        <div className="flex flex-col h-full bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-white/5">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden relative">
                    {partnerAvatar ? (
                        <Image src={partnerAvatar} alt={partnerName} fill className="object-cover" />
                    ) : (
                        <UserIcon size={20} className="text-primary" />
                    )}
                </div>
                <div>
                    <h3 className="font-bold text-white">{partnerName}</h3>
                    <p className="text-xs text-green-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Online
                    </p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/20">
                {messages.length === 0 && (
                    <div className="text-center text-white/40 mt-10">
                        <p>No messages yet.</p>
                        <p className="text-sm">Say hi to {partnerName}! 👋</p>
                    </div>
                )}

                {messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${isMe
                                ? 'bg-primary text-black rounded-tr-none'
                                : 'bg-white/10 text-white rounded-tl-none'
                                }`}>
                                <p>{msg.content}</p>
                                <span className="text-[10px] opacity-50 block text-right mt-1">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-white/5 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a vibe..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-full px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="w-12 h-12 rounded-full bg-primary text-black flex items-center justify-center hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
}
