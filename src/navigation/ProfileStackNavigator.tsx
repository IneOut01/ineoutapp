import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SupportScreen from '../screens/SupportScreen';
import MyListingsScreen from '../screens/MyListingsScreen';
import { commonScreenOptions } from './commonScreenOptions';

const ProfileStack = createStackNavigator();

const ProfileStackNavigator = () => {
  return (
    <ProfileStack.Navigator screenOptions={commonScreenOptions}>
      <ProfileStack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          headerTitle: 'Profilo',
          headerShown: false,
        }}
      />
      <ProfileStack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{
          headerTitle: 'Accedi',
          headerShown: true,
        }}
      />
      <ProfileStack.Screen 
        name="Signup" 
        component={SignupScreen} 
        options={{
          headerTitle: 'Registrati',
          headerShown: true,
        }}
      />
      <ProfileStack.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
        options={{
          headerTitle: 'Notifiche',
          headerShown: true,
        }}
      />
      <ProfileStack.Screen 
        name="Support" 
        component={SupportScreen} 
        options={{
          headerTitle: 'Supporto',
          headerShown: true,
        }}
      />
      <ProfileStack.Screen 
        name="MyListings" 
        component={MyListingsScreen} 
        options={{
          headerTitle: 'I miei annunci',
          headerShown: true,
        }}
      />
    </ProfileStack.Navigator>
  );
};

export default ProfileStackNavigator; 