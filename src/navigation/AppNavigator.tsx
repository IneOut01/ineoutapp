import React, { useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { View, StyleSheet, Platform, TouchableOpacity, ActivityIndicator, Alert, StatusBar as RNStatusBar, Text } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { COLORS } from '../theme/colors';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import StatusBarManager from '../components/ui/StatusBarManager';
import { useNavigation } from '@react-navigation/native';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import GuestModeBanner from '../components/GuestModeBanner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Screens
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PlansScreen from '../screens/PlansScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import PublishListingScreen from '../screens/PublishListingScreen';
import ListingDetailScreen from '../screens/ListingDetailScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import WebViewScreen from '../screens/WebViewScreen';
import GuestModeScreen from '../screens/GuestModeScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import AdvancedFiltersScreen from '../screens/AdvancedFiltersScreen';
import MyListingsScreen from '../screens/MyListingsScreen';
import ChatScreen from '../screens/ChatScreen';
import ConversationScreen from '../screens/ConversationScreen';
// import SettingsScreen from '../screens/SettingsScreen';
import CategoryResultsScreen from '../screens/CategoryResultsScreen';
import PasswordResetScreen from '../screens/PasswordResetScreen';

// Admin Screens
import AdminNavigator from './AdminNavigator';

// Type definitions for the navigator
type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

type HomeStackParamList = {
  Home: undefined;
  ComeFunziona: undefined;
  Privacy: undefined;
  Contatti: undefined;
  ListingDetail: { id: string };
  WebViewScreen: { url: string };
  CategoryResults: { categoryId: string; categoryName: string; categoryIcon: string };
};

type SearchStackParamList = {
  Search: undefined;
  ListingDetail: { id: string };
  AdvancedFilters: undefined;
};

type FavoritesStackParamList = {
  Favorites: undefined;
  ListingDetail: { id: string };
  Login: undefined;
};

type ChatStackParamList = {
  Chat: undefined;
  Login: undefined;
};

type ProfileStackParamList = {
  Profile: undefined;
  Subscription: undefined;
  Login: { message?: string };
  Signup: undefined;
  Admin: undefined;
  MyListings: undefined;
  Settings: undefined;
  Favorites: undefined;
};

type PlansStackParamList = {
  Plans: undefined;
  Subscription: { needed?: boolean };
  Checkout: {
    planId: string;
    planTitle: string;
    planPrice: string;
    planDescription: string;
  };
};

type RootStackParamList = {
  HomeStack: undefined;
  SearchStack: { screen?: string; params?: any };
  ChatStack: undefined;
  CreateListingTab: undefined;
  PlansStack: { 
    screen?: string; 
    params?: any;
  };
  ProfileStack: { screen?: string; params?: any };
  AuthStack: undefined;
  ChatScreen: undefined;
  Conversation: undefined;
};

// Create Navigators
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();
const FavoritesStack = createNativeStackNavigator<FavoritesStackParamList>();
const ChatStack = createNativeStackNavigator<ChatStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const PlansStack = createNativeStackNavigator<PlansStackParamList>();
const PublishStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator<RootStackParamList>();

// Configurazione comune per tutti gli stack navigator
const commonScreenOptions = {
  headerShown: false, // Di default nascondiamo l'header
  contentStyle: { backgroundColor: COLORS.background }, // Impostiamo il colore di sfondo su verde acqua chiaro
};

// Stack per l'autenticazione
const AuthStackNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
};

// Stack per la Home
const HomeStackNavigator = () => {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ headerShown: false }}
      />
      <HomeStack.Screen 
        name="ListingDetail" 
        component={ListingDetailScreen} 
        options={{ headerShown: false }}
      />
      <HomeStack.Screen 
        name="WebViewScreen" 
        component={WebViewScreen} 
        options={{ headerShown: false }}
      />
      <HomeStack.Screen 
        name="CategoryResults" 
        component={CategoryResultsScreen} 
        options={{ headerShown: false }}
      />
    </HomeStack.Navigator>
  );
};

// Stack per la Ricerca
const SearchStackNavigator = () => {
  return (
    <SearchStack.Navigator
      screenOptions={commonScreenOptions}
    >
      <SearchStack.Screen name="Search" component={SearchScreen} />
      <SearchStack.Screen name="ListingDetail" component={ListingDetailScreen} />
      <SearchStack.Screen name="AdvancedFilters" component={AdvancedFiltersScreen} />
    </SearchStack.Navigator>
  );
};

// Stack per i Piani
const PlansStackNavigator = () => {
  return (
    <PlansStack.Navigator
      screenOptions={commonScreenOptions}
    >
      <PlansStack.Screen 
        name="Plans" 
        component={PlansScreen} 
        options={{ 
          headerShown: false,
        }}
      />
      <PlansStack.Screen 
        name="Subscription" 
        component={SubscriptionScreen} 
        options={{ 
          headerShown: false,
        }}
      />
      <PlansStack.Screen 
        name="Checkout" 
        component={CheckoutScreen} 
        options={{ 
          headerShown: false,
        }}
      />
    </PlansStack.Navigator>
  );
};

// Stack per il Profilo
const ProfileStackNavigator = () => {
  return (
    <ProfileStack.Navigator
      screenOptions={commonScreenOptions}
    >
      <ProfileStack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="Login" component={LoginScreen} options={{ headerShown: true, title: 'Accedi' }} />
      <ProfileStack.Screen name="Signup" component={SignupScreen} options={{ headerShown: true, title: 'Registrati' }} />
      <ProfileStack.Screen name="MyListings" component={MyListingsScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="Favorites" component={FavoritesScreen} options={{ headerShown: false }} />
      {/* <ProfileStack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, title: 'Impostazioni' }} /> */}
      <ProfileStack.Screen 
        name="Subscription" 
        component={SubscriptionScreen}
        options={{
          headerShown: true,
          title: 'Abbonamento',
          headerStyle: {
            backgroundColor: COLORS.background,
          },
          headerTintColor: COLORS.black,
        }}
      />
      <ProfileStack.Screen name="Admin" component={AdminNavigator} />
    </ProfileStack.Navigator>
  );
};

// Stack per la Chat
const ChatStackNavigator = () => {
  return (
    <ChatStack.Navigator
      screenOptions={commonScreenOptions}
    >
      <ChatStack.Screen name="Chat" component={ChatScreen} />
      <ChatStack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          headerShown: false,
        }}
      />
    </ChatStack.Navigator>
  );
};

// Stack per i Preferiti
const FavoritesStackNavigator = () => {
  return (
    <FavoritesStack.Navigator
      screenOptions={commonScreenOptions}
    >
      <FavoritesStack.Screen name="Favorites" component={FavoritesScreen} />
      <FavoritesStack.Screen 
        name="ListingDetail" 
        component={ListingDetailScreen} 
        options={{ 
          headerShown: false,
        }} 
      />
      <FavoritesStack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          headerShown: false,
        }}
      />
    </FavoritesStack.Navigator>
  );
};

// Stack per la pubblicazione degli annunci
const PublishStackNavigator = () => {
  const { isAuthenticated, isGuest } = useAuth();
  
  // Per gli utenti ospiti, mostra la schermata informativa
  if (isGuest || !isAuthenticated) {
    return <GuestModeScreen />;
  }
  
  return (
    <PublishStack.Navigator
      screenOptions={commonScreenOptions}
    >
      <PublishStack.Screen name="PublishListing" component={PublishListingScreen} />
    </PublishStack.Navigator>
  );
};

// Aggiungiamo questo componente prima del TabNavigator
const AuthenticationWrapper = ({ children }) => {
  const { user, isAuthenticated, isGuest, exitGuestMode } = useAuth();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      setIsLoading(true);
      // Log per debug
      console.log("⚠️ Verifica stato autenticazione:");
      console.log("- isAuthenticated:", isAuthenticated);
      console.log("- isGuest:", isGuest);
      console.log("- user:", user ? `${user.email} (${user.uid})` : "nessun utente");

      // Controlla coerenza dello stato
      if (user && user.uid !== 'guest' && isGuest) {
        console.log("🔄 Rilevato utente autenticato in modalità ospite, uscendo dalla modalità ospite...");
        try {
          // Esci dalla modalità ospite quando c'è un utente autenticato
          await AsyncStorage.removeItem('isGuestMode');
          await exitGuestMode();
          console.log("✅ Modalità ospite disattivata con successo");
        } catch (error) {
          console.error("❌ Errore durante l'uscita dalla modalità ospite:", error);
        }
      } else if (user && user.uid === 'guest' && !isGuest) {
        console.log("⚠️ Modalità ospite incoerente: utente guest ma isGuest=false");
      } else if (!user && !isGuest && !isAuthenticated) {
        console.log("⚠️ STATO COERENTE: Nessun utente autenticato e modalità ospite disattivata");
      } else if (!user && isGuest) {
        console.log("⚠️ STATO COERENTE: Modalità ospite attiva");
      } else if (user && user.uid !== 'guest' && !isGuest) {
        console.log("✅ STATO COERENTE: Utente autenticato correttamente");
      }

      setIsLoading(false);
    };

    verifyAuth();
  }, [user, isAuthenticated, isGuest, exitGuestMode]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 20, color: COLORS.primary }}>{t('common.loading')}</Text>
      </View>
    );
  }

  return children;
};

// Tab Navigator principale
const TabNavigator = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isGuest } = useAuth();

  return (
    <View style={{ flex: 1 }}>
      <GuestModeBanner />
      
      <Tab.Navigator
        screenOptions={{
          tabBarShowLabel: true,
          tabBarStyle: {
            backgroundColor: COLORS.white,
            borderTopColor: COLORS.border,
            height: 60,
            elevation: 8,
            shadowOpacity: 0.1,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: -3 },
            paddingBottom: insets.bottom > 0 ? 15 : 5,
            height: insets.bottom > 0 ? 80 : 60,
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.grey,
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="HomeStack"
          component={HomeStackNavigator}
          options={{
            title: t('navigation.home', 'Home'),
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="home" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="SearchStack"
          component={SearchStackNavigator}
          options={{
            title: t('navigation.search', 'Cerca'),
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="magnify" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="PublishStack"
          component={PublishStackNavigator}
          options={{
            title: t('navigation.publish', 'Pubblica'),
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="plus-circle" color={color} size={size + 4} />
            ),
            tabBarBadge: isGuest ? '!' : undefined,
            tabBarBadgeStyle: isGuest ? { backgroundColor: COLORS.danger } : undefined
          }}
        />
        <Tab.Screen
          name="ChatStack"
          component={ChatStackNavigator}
          options={{
            title: t('navigation.chat', 'Chat'),
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="chat" color={color} size={size} />
            ),
            tabBarBadge: isGuest ? '?' : undefined,
            tabBarBadgeStyle: isGuest ? { backgroundColor: COLORS.grey } : undefined
          }}
        />
        <Tab.Screen
          name="PlansStack"
          component={PlansStackNavigator}
          options={{
            title: t('navigation.plans', 'Piani'),
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="crown" color={color} size={size} />
            )
          }}
        />
        <Tab.Screen
          name="ProfileStack"
          component={ProfileStackNavigator}
          options={{
            title: isGuest ? t('navigation.guest', 'Ospite') : t('navigation.profile', 'Profilo'),
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name={isGuest ? "account-question" : "account"}
                color={color}
                size={size}
              />
            ),
            tabBarBadge: isGuest ? '?' : undefined,
            tabBarBadgeStyle: isGuest ? { backgroundColor: COLORS.grey } : undefined
          }}
        />
      </Tab.Navigator>
    </View>
  );
};

// App Navigator principale
const AppNavigator = () => {
  return (
    <SafeAreaProvider>
      <StatusBarManager 
        style="dark" 
        backgroundColor="transparent" 
        translucent={true}
      />
      <NavigationContainer>
        <AuthenticationWrapper>
          <TabNavigator />
        </AuthenticationWrapper>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  publishButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  publishButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});

export default AppNavigator; 