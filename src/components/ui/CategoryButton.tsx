import React, { useRef } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  View,
  Animated 
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../theme/colors';

interface CategoryButtonProps {
  title: string;
  icon: string;
  onPress: () => void;
  selected?: boolean;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({
  title,
  icon,
  onPress,
  selected = false
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 150,
      useNativeDriver: true
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.container,
          selected && styles.containerSelected
        ]}
        onPress={onPress}
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={selected ? COLORS.white : COLORS.primary}
        />
        <Text style={[
          styles.title,
          selected && styles.titleSelected
        ]}>
          {title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginRight: 8,
    backgroundColor: COLORS.white,
  },
  containerSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  title: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: 6,
  },
  titleSelected: {
    color: COLORS.white,
  }
});

export default CategoryButton; 