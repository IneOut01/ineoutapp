// Definizione delle rotte dell'applicazione
// Questo file è importato da ListingCard.tsx

export enum Routes {
  // Stack principale
  Home = "Home",
  ListingDetail = "ListingDetail",
  CategoryResults = "CategoryResults",
  Search = "Search",
  Favorites = "Favorites",
  
  // Stack di autenticazione
  Login = "Login",
  Register = "Register",
  ForgotPassword = "ForgotPassword",
  
  // Stack del profilo
  Profile = "Profile",
  EditProfile = "EditProfile",
  Settings = "Settings",
  
  // Stack di creazione annuncio
  CreateListing = "CreateListing",
  PublishListing = "PublishListing",
  
  // Stack di admin
  Admin = "Admin",
  
  // Tab navigator
  TabNavigator = "TabNavigator",
  
  // Verifica o crea la definizione della rotta di Checkout
  Checkout = "Checkout",
  
  MyListings = 'MyListings',
  Notifications = 'Notifications',
  PaymentHistory = 'PaymentHistory',
  ChatScreen = 'ChatScreen',
  Conversation = 'Conversation',
} 