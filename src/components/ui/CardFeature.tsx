import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

// Definizione delle props del componente
interface CardFeatureProps {
  title: string;
  description: string;
  icon: string;
  delay?: number;
  onPress?: () => void;
}

const CardFeature: React.FC<CardFeatureProps> = ({ 
  title, 
  description,
  icon, 
  delay = 0,
  onPress 
}) => {
  return (
    <Animatable.View 
      animation="fadeInUp" 
      duration={600} 
      delay={delay} 
      style={styles.container}
      useNativeDriver
    >
      <TouchableOpacity 
        style={styles.card}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={28} color={COLORS.primary} />
        </View>
        
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </TouchableOpacity>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 8,
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
    minHeight: 150,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  }
});

export default CardFeature; 