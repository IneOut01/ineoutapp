import { useState } from 'react';
import { db as firestore } from '../config/firebaseConfig';
import { getAuth } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { useTranslation } from '../contexts/LanguageContext';
import { Alert } from 'react-native';

export type ReportReason = 
  | 'inappropriate_content' 
  | 'fake_listing' 
  | 'misleading_information'
  | 'spam'
  | 'other';

interface UseReportListingProps {
  listingId: string;
  listingTitle: string;
}

export const useReportListing = ({ listingId, listingTitle }: UseReportListingProps) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { t } = useTranslation();
  const auth = getAuth();

  const submitReport = async (reason: ReportReason, otherReason?: string) => {
    if (!auth.currentUser) {
      Alert.alert(
        t('common.error'),
        t('common.loginRequired'),
        [{ text: t('common.ok') }]
      );
      return;
    }

    try {
      setLoading(true);
      
      // Check if user already reported this listing
      const reportsRef = collection(firestore, 'reports');
      const q = query(
        reportsRef,
        where('userId', '==', auth.currentUser.uid),
        where('listingId', '==', listingId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        Alert.alert(
          t('common.error'),
          t('common.alreadyReported'),
          [{ text: t('common.ok') }]
        );
        setLoading(false);
        return;
      }
      
      // Add new report
      await addDoc(collection(firestore, 'reports'), {
        listingId,
        listingTitle,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        reason,
        otherReason: reason === 'other' ? otherReason : '',
        createdAt: new Date().toISOString(),
        status: 'pending' // pending, reviewed, rejected
      });
      
      setSuccess(true);
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert(
        t('common.error'),
        t('common.errorSubmittingReport'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    submitReport,
    loading,
    success
  };
}; 