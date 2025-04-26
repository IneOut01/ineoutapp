import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useTranslation } from '../../contexts/LanguageContext';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { MaterialIcons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useLanguage } from '../../contexts/LanguageContext';

interface Report {
  id: string;
  listingId: string;
  listingTitle: string;
  userId: string;
  userEmail: string;
  reason: string;
  otherReason: string;
  createdAt: string;
  status: 'pending' | 'reviewed' | 'rejected';
}

const getReasonLabel = (reason: string, t: any) => {
  switch(reason) {
    case 'inappropriate_content': return t('report.inappropriateContent');
    case 'fake_listing': return t('report.fakeListing');
    case 'misleading_information': return t('report.misleadingInformation');
    case 'spam': return t('report.spam');
    case 'other': return t('report.other');
    default: return reason;
  }
}

const ReportsScreen = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const reportsRef = collection(db, 'reports');
      const q = query(reportsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const fetchedReports: Report[] = [];
      querySnapshot.forEach((doc) => {
        fetchedReports.push({
          id: doc.id,
          ...doc.data()
        } as Report);
      });
      
      setReports(fetchedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      Alert.alert('Error', 'Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const markAsReviewed = async (reportId: string) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status: 'reviewed'
      });
      
      setReports(reports.map(report => 
        report.id === reportId 
          ? { ...report, status: 'reviewed' } 
          : report
      ));
    } catch (error) {
      console.error('Error updating report:', error);
      Alert.alert('Error', 'Failed to update report status');
    }
  };

  const rejectReport = async (reportId: string) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status: 'rejected'
      });
      
      setReports(reports.map(report => 
        report.id === reportId 
          ? { ...report, status: 'rejected' } 
          : report
      ));
    } catch (error) {
      console.error('Error rejecting report:', error);
      Alert.alert('Error', 'Failed to reject report');
    }
  };

  const deleteReport = async (reportId: string) => {
    try {
      await deleteDoc(doc(db, 'reports', reportId));
      setReports(reports.filter(report => report.id !== reportId));
    } catch (error) {
      console.error('Error deleting report:', error);
      Alert.alert('Error', 'Failed to delete report');
    }
  };

  const checkListing = async (listingId: string, reportId: string) => {
    try {
      const listingRef = doc(db, 'listings', listingId);
      const listingDoc = await getDoc(listingRef);
      
      if (!listingDoc.exists()) {
        Alert.alert(
          'Listing Not Found',
          'This listing may have been deleted already. Would you like to delete this report?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Delete Report', 
              style: 'destructive',
              onPress: () => deleteReport(reportId)
            }
          ]
        );
      } else {
        Alert.alert(
          'Listing Exists',
          'Would you like to mark this report as reviewed or reject it?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Reject', 
              onPress: () => rejectReport(reportId)
            },
            {
              text: 'Mark Reviewed',
              onPress: () => markAsReviewed(reportId)
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error checking listing:', error);
      Alert.alert('Error', 'Failed to check listing status');
    }
  };

  const handleAction = (report: Report) => {
    Alert.alert(
      'Report Actions',
      'What would you like to do with this report?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Check Listing', 
          onPress: () => checkListing(report.listingId, report.id)
        },
        {
          text: 'Mark as Reviewed',
          onPress: () => markAsReviewed(report.id)
        },
        {
          text: 'Reject Report',
          onPress: () => rejectReport(report.id)
        },
        {
          text: 'Delete Report',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Delete',
              'Are you sure you want to delete this report?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete', 
                  style: 'destructive',
                  onPress: () => deleteReport(report.id)
                }
              ]
            );
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return '#FFA500';
      case 'reviewed': return '#4CAF50';
      case 'rejected': return '#F44336';
      default: return '#757575';
    }
  };

  const getFormattedDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { 
        addSuffix: true,
        locale: language === 'es' ? es : enUS
      });
    } catch (error) {
      return dateString;
    }
  };

  const renderItem = ({ item }: { item: Report }) => (
    <TouchableOpacity 
      style={[styles.reportCard, { backgroundColor: colors.card }]}
      onPress={() => handleAction(item)}
    >
      <View style={styles.reportHeader}>
        <Text style={[styles.reportTitle, { color: colors.text }]} numberOfLines={1}>
          {item.listingTitle}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status === 'pending' ? t('common.pending') : 
             item.status === 'reviewed' ? t('common.reviewed') : 
             t('common.rejected')}
          </Text>
        </View>
      </View>
      
      <View style={styles.reportInfo}>
        <MaterialIcons 
          name={item.reason === 'inappropriate_content' ? 'warning' : 
                item.reason === 'fake_listing' ? 'fake' :
                item.reason === 'misleading_information' ? 'info' :
                item.reason === 'spam' ? 'report' : 'help'}
          size={20}
          color={colors.text}
          style={styles.reasonIcon}
        />
        <Text style={[styles.reasonText, { color: colors.text }]}>
          {getReasonLabel(item.reason, t)}
          {item.reason === 'other' && item.otherReason ? `: ${item.otherReason}` : ''}
        </Text>
      </View>
      
      <View style={styles.reportFooter}>
        <Text style={[styles.reporterInfo, { color: colors.text }]} numberOfLines={1}>
          {item.userEmail}
        </Text>
        <Text style={[styles.timeStamp, { color: colors.text }]}>
          {getFormattedDate(item.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.screenTitle, { color: colors.text }]}>
        {t('admin.reportedListings')}
      </Text>
      
      {reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="check-circle" size={48} color={colors.primary} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            {t('admin.noReports')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  reportCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  reportInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reasonIcon: {
    marginRight: 8,
  },
  reasonText: {
    fontSize: 14,
    flex: 1,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reporterInfo: {
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  timeStamp: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default ReportsScreen; 