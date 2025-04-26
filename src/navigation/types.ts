import { Routes } from './Routes';

// Definizione dei parametri per ogni rotta
export type RootStackParamList = {
  [Routes.Home]: undefined;
  [Routes.ListingDetail]: { id: string };
  [Routes.CategoryResults]: { categoryId: string; categoryName: string; categoryIcon?: string };
  [Routes.Search]: undefined;
  [Routes.Favorites]: undefined;
  
  // Auth
  [Routes.Login]: undefined;
  [Routes.Register]: undefined;
  [Routes.ForgotPassword]: undefined;
  
  // Profile
  [Routes.Profile]: undefined;
  [Routes.EditProfile]: undefined;
  [Routes.Settings]: undefined;
  
  // Create Listing
  [Routes.CreateListing]: undefined;
  [Routes.PublishListing]: { draftId?: string };
  
  // Admin
  [Routes.Admin]: undefined;
  
  // TabNavigator
  [Routes.TabNavigator]: undefined;
  
  Conversation: {
    conversationId: string;
    otherUserId: string;
    otherUserName?: string;
  };
}; 