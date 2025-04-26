import { collection, query, where, addDoc, updateDoc, doc, getDoc, getDocs, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export interface Message {
  id?: string;
  text: string;
  senderId: string;
  timestamp: Timestamp | Date;
  read: boolean;
}

export interface Conversation {
  id?: string;
  participants: string[];
  lastMessage?: string;
  lastMessageDate?: Timestamp | Date;
  updatedAt: Timestamp | Date;
  createdAt: Timestamp | Date;
  unreadCount?: number;
}

const conversationsService = {
  /**
   * Create a new conversation between two users
   */
  async createConversation(userId: string, otherUserId: string): Promise<string> {
    try {
      // Check if conversation already exists
      const existingConversation = await this.getConversationBetweenUsers(userId, otherUserId);
      
      if (existingConversation) {
        return existingConversation.id!;
      }
      
      // Create new conversation
      const conversationData: Conversation = {
        participants: [userId, otherUserId],
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        unreadCount: 0
      };
      
      const conversationRef = await addDoc(collection(db, 'conversations'), conversationData);
      return conversationRef.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw new Error('Failed to create conversation');
    }
  },
  
  /**
   * Get conversation between two specific users
   */
  async getConversationBetweenUsers(userId: string, otherUserId: string): Promise<Conversation | null> {
    try {
      const conversationsRef = collection(db, 'conversations');
      
      // Query for conversations containing both users as participants
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Find the conversation where the other participant is the specified otherUserId
      for (const doc of querySnapshot.docs) {
        const conversation = doc.data() as Conversation;
        conversation.id = doc.id;
        
        if (conversation.participants.includes(otherUserId)) {
          return conversation;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw new Error('Failed to get conversation');
    }
  },
  
  /**
   * Send a message in a conversation
   */
  async sendMessage(conversationId: string, message: Message): Promise<string> {
    try {
      // Add message to messages subcollection
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      
      const messageWithTimestamp = {
        ...message,
        timestamp: serverTimestamp()
      };
      
      const messageRef = await addDoc(messagesRef, messageWithTimestamp);
      
      // Update conversation with last message
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        lastMessage: message.text,
        lastMessageDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return messageRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  },
  
  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data() as Conversation;
        return {
          ...data,
          id: doc.id,
        };
      });
    } catch (error) {
      console.error('Error fetching user conversations:', error);
      throw new Error('Failed to fetch conversations');
    }
  },
  
  /**
   * Get messages for a specific conversation
   */
  async getConversationMessages(conversationId: string): Promise<Message[]> {
    try {
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data() as Message;
        return {
          ...data,
          id: doc.id,
          timestamp: data.timestamp
        };
      });
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      throw new Error('Failed to fetch messages');
    }
  },
  
  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const q = query(
        messagesRef,
        where('senderId', '!=', userId),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      
      const batch = [];
      querySnapshot.docs.forEach(doc => {
        const messageRef = doc.ref;
        batch.push(updateDoc(messageRef, { read: true }));
      });
      
      await Promise.all(batch);
      
      // Reset unread count in conversation
      if (querySnapshot.docs.length > 0) {
        const conversationRef = doc(db, 'conversations', conversationId);
        await updateDoc(conversationRef, { unreadCount: 0 });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw new Error('Failed to mark messages as read');
    }
  }
};

export default conversationsService; 