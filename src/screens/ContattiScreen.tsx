import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  StatusBar 
} from 'react-native';
import { COLORS } from '../theme/colors';

const ContattiScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Contatti</Text>
        <Text style={styles.content}>TODO</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: COLORS.primary,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textPrimary,
  },
});

export default ContattiScreen; 