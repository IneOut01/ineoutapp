import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  StatusBar,
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useNavigation } from '@react-navigation/native';

// Tipo Piano
interface SubscriptionPlan {
  id: string;
  title: string;
  price: string;
  annunci: string;
  features: string[];
  color: string;
}

const SubscriptionScreen = () => {
  const navigation = useNavigation();

  // Dati piani abbonamento
  const plans: SubscriptionPlan[] = [
    {
      id: 'lite',
      title: 'Lite',
      price: '0,99€/mese',
      annunci: '10 annunci',
      features: [
        'Pubblicazione facile e veloce',
        'Visibilità base',
        'Supporto email',
        '5 annunci gratuiti + 10 annunci premium'
      ],
      color: COLORS.lightGrey,
    },
    {
      id: 'pro',
      title: 'Pro',
      price: '5,99€/mese',
      annunci: '15 annunci',
      features: [
        'Pubblicazione facile e veloce',
        'Posizionamento preferenziale',
        'Supporto prioritario',
      ],
      color: COLORS.primary,
    },
    {
      id: 'plus',
      title: 'Plus',
      price: '9,99€/mese',
      annunci: '30 annunci',
      features: [
        'Pubblicazione facile e veloce',
        'Badge verificato',
        'Analisi visualizzazioni',
        'Supporto dedicato',
      ],
      color: COLORS.accent,
    },
    {
      id: 'unlimited',
      title: 'Unlimited',
      price: '29,99€/mese',
      annunci: 'Annunci illimitati',
      features: [
        'Pubblicazione facile e veloce',
        'Posizionamento in primo piano',
        'Badge verificato premium',
        'Analytics avanzate',
        'Supporto prioritario 24/7',
      ],
      color: COLORS.success,
    },
  ];

  // Card per piano abbonamento
  const renderPlanCard = (plan: SubscriptionPlan) => {
    const isDark = plan.id === 'pro';

    return (
      <View key={plan.id} style={[styles.planCard, { borderColor: plan.color }]}>
        <View style={[styles.planHeader, { backgroundColor: plan.color }]}>
          <Text style={[styles.planTitle, isDark && { color: COLORS.white }]}>
            {plan.title}
          </Text>
          <Text style={[styles.planPrice, isDark && { color: COLORS.white }]}>
            {plan.price}
          </Text>
          <Text style={[styles.planAnnunci, isDark && { color: COLORS.white }]}>
            {plan.annunci}
          </Text>
        </View>
        
        <View style={styles.planFeatures}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color={plan.color} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
        
        <TouchableOpacity 
          style={[styles.subscribeButton, { backgroundColor: plan.color }]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('PlansStack' as never, { 
            screen: 'Checkout',
            params: {
              planId: plan.id,
              planTitle: plan.title,
              planPrice: plan.price,
              planDescription: plan.annunci,
            }
          } as never)}
        >
          <Text style={[styles.subscribeButtonText, isDark && { color: COLORS.white }]}>
            Abbonati ora
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Abbonamenti</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.subtitle}>Scegli il piano più adatto a te</Text>
        {plans.map(renderPlanCard)}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
  },
  container: {
    padding: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
    color: COLORS.textSecondary,
  },
  planCard: {
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    overflow: 'hidden',
  },
  planHeader: {
    padding: 20,
    alignItems: 'center',
  },
  planTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  planAnnunci: {
    fontSize: 16,
    fontWeight: '500',
  },
  planFeatures: {
    padding: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  subscribeButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});

export default SubscriptionScreen; 