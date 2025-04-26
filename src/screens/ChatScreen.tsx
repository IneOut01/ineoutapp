import React, { useState, useEffect } from 'react';
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
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useNavigation } from '@react-navigation/native';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import EmptyState from '../components/EmptyState';
import AuthRequiredModal from '../components/AuthRequiredModal';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

const ChatScreen = () => {
  const navigation = useNavigation();
  const { user, isGuest } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [error, setError] = useState(null);
  
  const statusBarHeight = getStatusBarHeight();
  
  // Utilizza l'hook authGuard per proteggere la schermata
  const { authVerified } = useAuthGuard({
    onUnauthenticated: () => setShowAuthModal(true)
  });
  
  useEffect(() => {
    if (!user || isGuest) {
      setLoading(false);
      return;
    }
    
    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Query per ottenere tutte le conversazioni in cui l'utente è coinvolto
        const conversationsRef = collection(db, 'conversations');
        const q = query(
          conversationsRef,
          where('participants', 'array-contains', user.uid),
          orderBy('updatedAt', 'desc')
        );
        
        // Utilizzo onSnapshot per avere aggiornamenti in tempo reale
        const unsubscribe = onSnapshot(q, async (snapshot) => {
          try {
            const conversationsData = [];
            
            for (const doc of snapshot.docs) {
              const conversationData = {
                id: doc.id,
                ...doc.data(),
                lastMessage: doc.data().lastMessage || "Nessun messaggio",
                timestamp: doc.data().updatedAt ? doc.data().updatedAt.toDate() : new Date(),
              };
              
              // Ottieni i dettagli dell'altro partecipante (per conversazioni 1:1)
              const otherUserId = conversationData.participants.find(id => id !== user.uid);
              
              if (otherUserId) {
                // Qui in una versione completa andremmo a prendere i dati dell'utente dal DB
                // Per ora aggiungiamo dei dati mock
                conversationData.otherUser = {
                  id: otherUserId,
                  displayName: "Utente " + otherUserId.substring(0, 5),
                  // In un'app reale andremmo a prendere questi dati dal DB
                  photoURL: null
                };
              }
              
              conversationsData.push(conversationData);
            }
            
            setConversations(conversationsData);
            setLoading(false);
          } catch (error) {
            console.error("Errore nell'elaborazione dati conversazioni:", error);
            setError("Errore nel caricamento delle conversazioni");
            setLoading(false);
          }
        }, (error) => {
          console.error("Errore nell'ascolto delle conversazioni:", error);
          setError("Errore nell'ascolto delle conversazioni");
          setLoading(false);
        });
        
        return () => unsubscribe();
      } catch (error) {
        console.error("Errore nel caricamento delle conversazioni:", error);
        setError("Errore nel caricamento delle conversazioni");
        setLoading(false);
      }
    };
    
    fetchConversations();
  }, [user, isGuest]);
  
  const handleConversationPress = (conversation) => {
    // Navigate to the conversation screen
    navigation.navigate('Conversation', {
      conversationId: conversation.id,
      otherUser: conversation.otherUser
    });
  };
  
  const renderConversationItem = ({ item }) => {
    const formattedDate = new Date(item.timestamp).toLocaleDateString();
    
    return (
      <TouchableOpacity 
        style={styles.conversationItem}
        onPress={() => handleConversationPress(item)}
      >
        <View style={styles.avatarContainer}>
          <MaterialCommunityIcons name="account" size={30} color={COLORS.grey} />
        </View>
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.userName}>{item.otherUser?.displayName || 'Utente'}</Text>
            <Text style={styles.timeStamp}>{formattedDate}</Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  if (showAuthModal) {
    return (
      <AuthRequiredModal 
        visible={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          navigation.goBack();
        }}
        onLogin={() => {
          setShowAuthModal(false);
          navigation.navigate('Login' as never);
        }}
      />
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { marginTop: Platform.OS === 'android' ? statusBarHeight : 0 }]}>
        <Text style={styles.headerTitle}>Chat</Text>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Caricamento conversazioni...</Text>
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
      ) : conversations.length === 0 ? (
        <EmptyState 
          title="Nessuna conversazione"
          message="Non hai ancora avviato conversazioni con altri utenti."
          icon="chat-outline"
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversationItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      <StatusBar style="dark" backgroundColor={COLORS.background} />
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
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
  listContent: {
    padding: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: COLORS.black,
  },
  timeStamp: {
    fontSize: 12,
    color: COLORS.grey,
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});

export default ChatScreen; 