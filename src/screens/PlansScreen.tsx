import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/colors';

const PlansScreen = () => {
  const navigation = useNavigation();
  
  const navigateToSubscription = () => {
    navigation.navigate('Subscription' as never);
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Abbonamenti</Text>
      </View>
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>Seleziona un piano</Text>
          <Text style={styles.descriptionText}>
            Scegli il piano più adatto alle tue esigenze di pubblicazione annunci
          </Text>
          
          <TouchableOpacity 
            style={styles.subscriptionButton}
            onPress={navigateToSubscription}
          >
            <Text style={styles.buttonText}>Visualizza Abbonamenti</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 60,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    minHeight: '100%',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 24,
    marginBottom: 30,
  },
  subscriptionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  }
});

export default PlansScreen; 