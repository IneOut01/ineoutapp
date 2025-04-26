import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
  Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { Message } from '../services/conversationsService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MessageItem extends Message {
  id: string;
}

const ConversationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { conversationId, otherUser } = route.params as { conversationId: string, otherUser: any };
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const statusBarHeight = getStatusBarHeight();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!conversationId || !user) {
      setLoading(false);
      return;
    }
    
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Query per ottenere i messaggi della conversazione
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        
        // Utilizzo onSnapshot per aggiornamenti in tempo reale
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const messagesData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              text: data.text,
              senderId: data.senderId,
              timestamp: data.timestamp?.toDate() || new Date(),
              read: data.read || false
            } as MessageItem;
          });
          
          setMessages(messagesData);
          setLoading(false);
          
          // Scroll to bottom on new messages
          if (messagesData.length > 0 && flatListRef.current) {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        }, (error) => {
          console.error("Errore nell'ascolto dei messaggi:", error);
          setError("Errore nel caricamento dei messaggi");
          setLoading(false);
        });
        
        return () => unsubscribe();
      } catch (error) {
        console.error("Errore nel caricamento dei messaggi:", error);
        setError("Errore nel caricamento dei messaggi");
        setLoading(false);
      }
    };
    
    fetchMessages();
  }, [conversationId, user]);

  const sendMessage = async () => {
    if (!messageText.trim() || !user || !conversationId) return;
    
    try {
      setSending(true);
      
      // Creo nuovo messaggio
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const newMessage = {
        text: messageText.trim(),
        senderId: user.uid,
        timestamp: serverTimestamp(),
        read: false
      };
      
      // Aggiungo messaggio alla collezione
      await addDoc(messagesRef, newMessage);
      
      // Aggiorno la conversazione con l'ultimo messaggio
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        lastMessage: messageText.trim(),
        lastMessageDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Reset campo input
      setMessageText('');
      setSending(false);
    } catch (error) {
      console.error("Errore nell'invio del messaggio:", error);
      Alert.alert("Errore", "Impossibile inviare il messaggio. Riprova più tardi.");
      setSending(false);
    }
  };

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageItem = ({ item }: { item: MessageItem }) => {
    const isMyMessage = item.senderId === user?.uid;
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={styles.messageText}>{item.text}</Text>
          <Text style={styles.messageTime}>{formatMessageTime(item.timestamp)}</Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, { marginTop: Platform.OS === 'android' ? statusBarHeight : 0 }]}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.black} />
      </TouchableOpacity>
      
      <View style={styles.headerUserInfo}>
        <View style={styles.avatarContainer}>
          <MaterialCommunityIcons name="account" size={24} color={COLORS.grey} />
        </View>
        <Text style={styles.headerTitle}>
          {otherUser?.displayName || 'Utente'}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Caricamento messaggi...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle-outline" size={50} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => setLoading(true)}
            >
              <Text style={styles.retryButtonText}>Riprova</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}
        
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TextInput
            style={styles.input}
            placeholder="Scrivi un messaggio..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialCommunityIcons name="send" size={22} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      <StatusBar style="dark" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 4,
  },
  headerUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.grey,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    color: COLORS.error,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  messagesList: {
    padding: 12,
    flexGrow: 1,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    minWidth: 80,
  },
  myMessageBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: COLORS.black,
  },
  messageTime: {
    fontSize: 12,
    color: COLORS.grey,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.lightGrey,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.grey,
  },
});

export default ConversationScreen; 