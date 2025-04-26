import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../theme/colors';
import ReportsScreen from '../screens/admin/ReportsScreen';

// Define Admin stack param list
export type AdminStackParamList = {
  Reports: undefined;
  // Add more admin screens as needed
};

const AdminStack = createNativeStackNavigator<AdminStackParamList>();

const AdminNavigator = () => {
  return (
    <AdminStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: '#fff',
      }}
    >
      <AdminStack.Screen 
        name="Reports" 
        component={ReportsScreen} 
        options={{ 
          title: 'Reports Management'
        }}
      />
      {/* Add more admin screens here */}
    </AdminStack.Navigator>
  );
};

export default AdminNavigator; 