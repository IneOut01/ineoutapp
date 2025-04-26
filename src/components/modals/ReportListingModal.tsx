import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from '../../contexts/LanguageContext';
import { useTheme } from '@react-navigation/native';
import { useReportListing, ReportReason } from '../../hooks/useReportListing';
import CustomInput from '../CustomInput';

interface ReportListingModalProps {
  visible: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
}

const ReportListingModal: React.FC<ReportListingModalProps> = ({
  visible,
  onClose,
  listingId,
  listingTitle,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [otherReason, setOtherReason] = useState('');
  const { submitReport, loading, success } = useReportListing({ listingId, listingTitle });

  const reasons: { value: ReportReason; label: string }[] = [
    { value: 'inappropriate_content', label: t('report.inappropriateContent') },
    { value: 'fake_listing', label: t('report.fakeListing') },
    { value: 'misleading_information', label: t('report.misleadingInformation') },
    { value: 'spam', label: t('report.spam') },
    { value: 'other', label: t('report.other') },
  ];

  const handleSubmit = async () => {
    if (!selectedReason) return;
    
    await submitReport(selectedReason, otherReason);
    
    if (success) {
      resetForm();
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  const resetForm = () => {
    setSelectedReason(null);
    setOtherReason('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t('report.reportListing')}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: colors.text }]}>
            {t('report.whyReporting')}
          </Text>

          {reasons.map((reason) => (
            <TouchableOpacity
              key={reason.value}
              style={[
                styles.reasonItem,
                selectedReason === reason.value && { 
                  backgroundColor: colors.primary + '20',
                  borderColor: colors.primary 
                },
              ]}
              onPress={() => setSelectedReason(reason.value)}
            >
              <Text style={[styles.reasonText, { color: colors.text }]}>
                {reason.label}
              </Text>
              {selectedReason === reason.value && (
                <MaterialIcons name="check-circle" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}

          {selectedReason === 'other' && (
            <CustomInput
              value={otherReason}
              onChangeText={setOtherReason}
              placeholder={t('report.pleaseExplain')}
              multiline
              containerStyle={styles.otherReasonInput}
              numberOfLines={3}
            />
          )}

          {success && (
            <View style={styles.successMessage}>
              <MaterialIcons name="check-circle" size={24} color="green" />
              <Text style={[styles.successText, { color: 'green' }]}>
                {t('report.reportSubmitted')}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.primary },
              (!selectedReason || (selectedReason === 'other' && !otherReason.trim())) && styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={!selectedReason || (selectedReason === 'other' && !otherReason.trim()) || loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitText}>{t('common.submit')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 15,
  },
  closeButton: {
    padding: 5,
  },
  reasonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
  },
  reasonText: {
    fontSize: 16,
  },
  otherReasonInput: {
    marginBottom: 20,
  },
  submitButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  successText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReportListingModal; 