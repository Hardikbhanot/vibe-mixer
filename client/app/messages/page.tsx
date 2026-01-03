"use client";

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '../../components/Header';
import ChatInterface from './chat-interface';
import { MessageSquare, Search, User, ChevronRight } from 'lucide-react';
import Image from 'next/image';

function MessagesContent() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedChat, setSelectedChat] = useState<any>(null);
    const [isLoadingList, setIsLoadingList] = useState(true);
    const searchParams = useSearchParams();
    const targetUserId = searchParams.get('userId');

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth');
        }
    }, [user, loading, router]);

    const fetchConversations = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
            const res = await fetch(`${apiUrl}/api/messages/conversations`, { credentials: 'include' });
            const data = await res.json();

            let convos = [];
            if (data.conversations) {
                convos = data.conversations;
            }

            // check if we need to insert the target user (if not already in list)
            if (targetUserId) {
                const existing = convos.find((c: any) => c.user.id === targetUserId);
                if (existing) {
                    setSelectedChat(existing.user);
                } else {
                    // Fetch details and add temp
                    try {
                        const userRes = await fetch(`${apiUrl}/api/user/details/${targetUserId}`);
                        if (userRes.ok) {
                            const userData = await userRes.json();
                            const newUser = userData.user;

                            // Mock a conversation item
                            const newConvo = {
                                user: newUser,
                                lastMessage: 'Start a conversation!',
                                timestamp: new Date().toISOString(),
                                unread: 0
                            };

                            // Add to top
                            convos = [newConvo, ...convos];
                            setSelectedChat(newUser);
                        }
                    } catch (e) {
                        console.error('Failed to fetch target user', e);
                    }
                }
            }

            setConversations(convos);

        } catch (error) {
            console.error('Error fetching conversations', error);
        } finally {
            setIsLoadingList(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchConversations();
        }
    }, [user, targetUserId]);

    if (loading || !user) return null;

    return (
        <div className="flex-1 container mx-auto px-4 py-8 z-10 flex gap-6 h-[calc(100vh-100px)]">

            {/* Conversations List (Sidebar) */}
            <div className={`w-full md:w-1/3 lg:w-1/4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-white/10">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <MessageSquare className="text-primary" size={24} />
                        Messages
                    </h2>
                    <div className="mt-4 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                        <input
                            type="text"
                            placeholder="Search vibes..."
                            className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {isLoadingList ? (
                        <div className="text-center p-4 text-white/40">Loading chats...</div>
                    ) : conversations.length === 0 ? (
                        <div className="text-center p-8 text-white/40">
                            <p>No messages yet.</p>
                            <p className="text-sm mt-2">Go to the Discovery Feed to find people to vibe with!</p>
                            <button
                                onClick={() => router.push('/discover')}
                                className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors"
                            >
                                Explore People
                            </button>
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <button
                                key={conv.user.id}
                                onClick={() => setSelectedChat(conv.user)}
                                className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${selectedChat?.id === conv.user.id
                                        ? 'bg-primary/20 border border-primary/30'
                                        : 'hover:bg-white/5 border border-transparent'
                                    }`}
                            >
                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden relative border border-white/10">
                                    {conv.user.avatarUrl ? (
                                        <Image src={conv.user.avatarUrl} alt={conv.user.username} fill className="object-cover" />
                                    ) : (
                                        <User size={20} className="text-white/50" />
                                    )}
                                    {conv.unread > 0 && (
                                        <div className="absolute top-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-black"></div>
                                    )}
                                </div>
                                <div className="flex-1 text-left overflow-hidden">
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className="font-bold text-sm truncate">{conv.user.username}</h3>
                                        <span className="text-[10px] text-white/40">{new Date(conv.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className={`text-xs truncate ${conv.unread > 0 ? 'text-white font-semibold' : 'text-white/50'}`}>
                                        {conv.lastMessage}
                                    </p>
                                </div>
                                <ChevronRight size={16} className="text-white/20" />
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Interface (Main) */}
            <div className={`flex-1 ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
                {selectedChat ? (
                    <div className="w-full h-full flex flex-col">
                        {/* Mobile Back Button */}
                        <button
                            onClick={() => setSelectedChat(null)}
                            className="md:hidden mb-2 flex items-center text-sm text-white/60 hover:text-white"
                        >
                            ← Back to messages
                        </button>
                        <ChatInterface
                            partnerId={selectedChat.id}
                            partnerName={selectedChat.username}
                            partnerAvatar={selectedChat.avatarUrl}
                        />
                    </div>
                ) : (
                    <div className="w-full h-full rounded-2xl border border-white/10 bg-white/5 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 animate-float">
                            <MessageSquare size={40} className="text-primary/50" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Your Vibe Inbox</h2>
                        <p className="text-white/50 max-w-sm">
                            Select a conversation from the left to start chatting about music, playlists, and vibes.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function MessagesPage() {
    return (
        <div className="min-h-screen bg-black text-white relative flex flex-col">
            {/* Background elements */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
            </div>

            <Header />

            <Suspense fallback={<div className="flex-1 flex items-center justify-center text-white/50">Loading messages...</div>}>
                <MessagesContent />
            </Suspense>
        </div>
    );
}
