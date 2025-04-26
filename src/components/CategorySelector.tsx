import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useTranslation } from '../contexts/LanguageContext';

const { width, height } = Dimensions.get('window');

// Lista delle categorie disponibili
const CATEGORIES = [
  { id: 'all', name: 'Tutte le categorie', icon: 'home' },
  { id: 'apartment', name: 'Appartamenti', icon: 'apartment' },
  { id: 'house', name: 'Case', icon: 'house' },
  { id: 'villa', name: 'Ville', icon: 'villa' },
  { id: 'room', name: 'Stanze', icon: 'bed-king' },
  { id: 'studio', name: 'Monolocali', icon: 'single-bed' },
  { id: 'loft', name: 'Loft', icon: 'domain' },
  { id: 'penthouse', name: 'Attici', icon: 'location-city' },
];

interface CategorySelectorProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onSelectCategory
}) => {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);

  // Trova la categoria selezionata
  const getSelectedCategory = () => {
    return CATEGORIES.find(cat => cat.id === selectedCategory) || CATEGORIES[0];
  };

  // Renderizza ogni item della categoria nella lista
  const renderCategoryItem = ({ item }: { item: typeof CATEGORIES[0] }) => {
    const isSelected = item.id === selectedCategory;

    return (
      <TouchableOpacity
        style={[styles.categoryItem, isSelected && styles.selectedCategoryItem]}
        onPress={() => {
          onSelectCategory(item.id);
          setModalVisible(false);
        }}
      >
        <MaterialIcons
          name={item.icon as any}
          size={22}
          color={isSelected ? COLORS.primary : COLORS.textSecondary}
          style={styles.categoryIcon}
        />
        <Text
          style={[
            styles.categoryName,
            isSelected && styles.selectedCategoryName
          ]}
        >
          {t(`categories.${item.id}`, item.name)}
        </Text>
        {isSelected && (
          <MaterialIcons name="check" size={20} color={COLORS.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <MaterialIcons
          name={getSelectedCategory().icon as any}
          size={18}
          color={COLORS.primary}
          style={styles.selectorIcon}
        />
        <Text style={styles.selectorText}>
          {t(`categories.${getSelectedCategory().id}`, getSelectedCategory().name)}
        </Text>
        <Ionicons
          name="chevron-down"
          size={16}
          color={COLORS.textSecondary}
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t('categories.select', 'Seleziona categoria')}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <MaterialIcons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={CATEGORIES}
              renderItem={renderCategoryItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.categoryList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectorIcon: {
    marginRight: 8,
  },
  selectorText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  categoryList: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedCategoryItem: {
    backgroundColor: COLORS.backgroundLight,
  },
  categoryIcon: {
    marginRight: 12,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  selectedCategoryName: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default CategorySelector; 