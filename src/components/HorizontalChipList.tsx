import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { COLORS } from '../theme/colors';

interface HorizontalChipListProps {
  children: React.ReactNode;
  containerStyle?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

const HorizontalChipList: React.FC<HorizontalChipListProps> = ({
  children,
  containerStyle,
  contentContainerStyle,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      >
        {children}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  contentContainer: {
    paddingVertical: 8,
    paddingRight: 16,
  },
});

export default HorizontalChipList; 