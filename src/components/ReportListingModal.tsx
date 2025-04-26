import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useTranslation } from '../contexts/LanguageContext';
import { auth, db } from '../config/firebaseConfig';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';

interface ReportListingModalProps {
  visible: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
}

const reportReasons = [
  'inappropriate_content',
  'spam',
  'scam',
  'offensive',
  'wrong_category',
  'other'
];

const ReportListingModal: React.FC<ReportListingModalProps> = ({ 
  visible, 
  onClose,
  listingId,
  listingTitle
}) => {
  const { t } = useTranslation();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherReason, setOtherReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const resetForm = () => {
    setSelectedReason(null);
    setOtherReason('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const submitReport = async () => {
    if (!selectedReason) {
      Alert.alert(
        t('common.error', 'Error'),
        t('listing.selectReportReason', 'Please select a reason for reporting')
      );
      return;
    }

    if (selectedReason === 'other' && !otherReason.trim()) {
      Alert.alert(
        t('common.error', 'Error'),
        t('listing.specifyOtherReason', 'Please specify the reason for reporting')
      );
      return;
    }

    if (!auth.currentUser) {
      Alert.alert(
        t('common.error', 'Error'),
        t('auth.loginRequired', 'You must be logged in to report a listing')
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if user already reported this listing
      const reportsRef = collection(db, 'reports');
      const q = query(
        reportsRef, 
        where('listingId', '==', listingId),
        where('userId', '==', auth.currentUser.uid)
      );
      const existingReports = await getDocs(q);

      if (!existingReports.empty) {
        Alert.alert(
          t('common.notice', 'Notice'),
          t('listing.alreadyReported', 'You have already reported this listing')
        );
        setIsSubmitting(false);
        return;
      }

      // Add new report
      await addDoc(collection(db, 'reports'), {
        listingId,
        listingTitle,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        reason: selectedReason,
        otherReason: selectedReason === 'other' ? otherReason : '',
        createdAt: new Date().toISOString(),
        status: 'pending' // pending, reviewed, dismissed
      });

      Alert.alert(
        t('common.success', 'Success'),
        t('listing.reportSubmitted', 'Your report has been submitted. Thank you for helping us maintain a safe community.'),
        [{ text: t('common.ok', 'OK'), onPress: handleClose }]
      );
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert(
        t('common.error', 'Error'),
        t('listing.reportError', 'There was an error submitting your report. Please try again.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getReasonTranslation = (reason: string) => {
    const translations: {[key: string]: string} = {
      'inappropriate_content': t('listing.inappropriateContent', 'Inappropriate content'),
      'spam': t('listing.spam', 'Spam or misleading'),
      'scam': t('listing.scam', 'Scam or fraud'),
      'offensive': t('listing.offensive', 'Offensive content'),
      'wrong_category': t('listing.wrongCategory', 'Wrong category'),
      'other': t('listing.otherReason', 'Other reason')
    };
    
    return translations[reason] || reason;
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.iconContainer}>
                <MaterialIcons name="report-problem" size={40} color={COLORS.error} />
              </View>
              
              <Text style={styles.modalTitle}>{t('listing.reportListing', 'Report Listing')}</Text>
              <Text style={styles.modalMessage}>
                {t('listing.reportDescription', 'Please select a reason for reporting this listing:')}
              </Text>
              
              <ScrollView style={styles.reasonsContainer}>
                {reportReasons.map((reason) => (
                  <TouchableOpacity
                    key={reason}
                    style={[
                      styles.reasonItem,
                      selectedReason === reason && styles.selectedReason
                    ]}
                    onPress={() => setSelectedReason(reason)}
                  >
                    <Text style={[
                      styles.reasonText,
                      selectedReason === reason && styles.selectedReasonText
                    ]}>
                      {getReasonTranslation(reason)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              {selectedReason === 'other' && (
                <TextInput
                  style={styles.otherReasonInput}
                  placeholder={t('listing.specifyReason', 'Please specify the reason')}
                  value={otherReason}
                  onChangeText={setOtherReason}
                  multiline
                  numberOfLines={3}
                />
              )}
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleClose}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelButtonText}>{t('common.cancel', 'Cancel')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={submitReport}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={COLORS.white} size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>{t('common.submit', 'Submit')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxHeight: '80%',
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  reasonsContainer: {
    width: '100%',
    maxHeight: 200,
    marginBottom: 16,
  },
  reasonItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  selectedReason: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(90, 200, 250, 0.1)',
  },
  selectedReasonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  otherReasonInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: COLORS.primary,
  },
  submitButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: COLORS.white,
  },
});

export default ReportListingModal; 