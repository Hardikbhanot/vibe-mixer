
import { StyleSheet, Dimensions, TextInput, FlatList, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState } from 'react';

const MESSAGES = [
    {
        id: '1',
        name: 'hb1223',
        initial: 'h',
        lastMessage: 'Start a conversation!',
        date: '04/01/2026',
        selected: true,
    },
    {
        id: '2',
        name: 'hardikbhanot12',
        initial: 'h',
        lastMessage: 'hi',
        date: '03/01/2026',
        selected: false,
    },
    {
        id: '3',
        name: 'loze',
        initial: 'l',
        lastMessage: 'HIII cutiee baby',
        date: '03/01/2026',
        selected: false,
    },
];

export default function MessagesScreen() {
    const router = useRouter();
    const [selectedId, setSelectedId] = useState('1');
    const [inputText, setInputText] = useState('');

    const selectedChat = MESSAGES.find(m => m.id === selectedId);

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <Stack.Screen options={{ headerShown: true, title: 'Messages', headerStyle: { backgroundColor: 'black' }, headerTintColor: 'white' }} />

            {/* Sidebar / List (Always visible, but detailed view simulates the split or full screen on mobile) */}
            {/* On standard mobile, this would normally be two screens. For "Replication", I'll build a split view that stacks vertically or just the list? 
                The user provided a DESKTOP-like wide screenshot. 
                I will build a list that looks like the sidebar, and when clicked, it *would* open the chat. 
                But to match the "Replicate" request, I'll put the chat list ON TOP and the active chat BELOW it (or just toggle).
                Actually, let's just make it a clean List View, and clicking one simulates opening a chat modal or navigate.
                WAIT: The prompt says "replicate this messages page". 
                If I strictly replicate the desktop view on mobile, it will be tiny. 
                I'll assume "Replicate UI" means "Make the mobile version of this".
                Mobile = Full Screen List of chats.
            */}

            <View style={{ flex: 1, flexDirection: 'column' }}>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <FontAwesome name="search" size={16} color="#666" style={{ marginRight: 10 }} />
                    <TextInput
                        placeholder="Search vibes..."
                        placeholderTextColor="#666"
                        style={styles.searchInput}
                    />
                </View>

                {/* Chat List */}
                <View style={{ maxHeight: 220 }}>
                    <FlatList
                        data={MESSAGES}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.chatItem, item.id === selectedId && styles.selectedChat]}
                                onPress={() => setSelectedId(item.id)}
                            >
                                <View style={styles.avatar}>
                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>{item.name[0].toUpperCase()}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <Text style={styles.chatName}>{item.name}</Text>
                                        <Text style={styles.chatDate}>{item.date}</Text>
                                    </View>
                                    <Text style={styles.chatPreview}>{item.lastMessage}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </View>

                {/* Active Chat Area */}
                <View style={styles.chatArea}>
                    {/* Header */}
                    <View style={styles.chatHeader}>
                        <View style={[styles.avatar, { width: 30, height: 30, backgroundColor: '#8B5CF6' }]}>
                            <Text style={{ color: 'white', fontSize: 12 }}>U</Text>
                        </View>
                        <Text style={{ color: '#4ade80', marginLeft: 10, fontSize: 12 }}>● Online</Text>
                    </View>

                    {/* Messages */}
                    <View style={styles.messagesContainer}>
                        <Text style={{ color: '#666', marginBottom: 10 }}>No messages yet.</Text>
                        <Text style={{ color: '#888' }}>Say hi to {selectedChat?.name}! 👋</Text>
                    </View>

                    {/* Input */}
                    <View style={styles.inputArea}>
                        <TextInput
                            style={styles.msgInput}
                            placeholder="Type a vibe..."
                            placeholderTextColor="#666"
                            value={inputText}
                            onChangeText={setInputText}
                        />
                        <TouchableOpacity style={styles.sendButton}>
                            <FontAwesome name="paper-plane" size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

            </View>

        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050505',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        margin: 15,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#222',
    },
    searchInput: {
        color: 'white',
        flex: 1,
        fontSize: 14,
    },
    chatItem: {
        flexDirection: 'row',
        padding: 15,
        alignItems: 'center',
    },
    selectedChat: {
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderLeftWidth: 3,
        borderLeftColor: '#8B5CF6',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    chatName: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    chatDate: {
        color: '#666',
        fontSize: 10,
    },
    chatPreview: {
        color: '#888',
        fontSize: 12,
        marginTop: 2,
    },
    chatArea: {
        flex: 1,
        backgroundColor: 'black',
        borderTopWidth: 1,
        borderTopColor: '#222',
    },
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#111',
    },
    messagesContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputArea: {
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },
    msgInput: {
        flex: 1,
        backgroundColor: '#111',
        color: 'white',
        padding: 15,
        borderRadius: 25,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#222',
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#8B5CF6',
        justifyContent: 'center',
        alignItems: 'center',
    }
});
