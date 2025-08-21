import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import API from '../api';
import { formatDate } from '../utils/date';
import { showToast } from '../utils/toast';

const MedicalRecordDetailScreen = () => {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const route = useRoute();
  const { recordId } = route.params;

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        setLoading(true);
        const response = await API.get(`/medical-records/${recordId}`);
        setRecord(response.data);
      } catch (error) {
        console.error('Error fetching record:', error);
        showToast('error', 'Error', 'Failed to load medical record');
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [recordId]);

  const handleEdit = () => {
    navigation.navigate('EditMedicalRecord', { recordId });
  };

  const handleOpenAttachment = (url) => {
    Linking.openURL(url).catch(err => {
      console.error('Failed to open URL:', err);
      showToast('error', 'Error', 'Failed to open attachment');
    });
  };

  if (loading || !record) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#315342" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{record.recordType.toUpperCase()}</Text>
        <TouchableOpacity onPress={handleEdit}>
          <Ionicons name="create-outline" size={24} color="#315342" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Animal Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name:</Text>
          <Text style={styles.infoValue}>{record.animal?.name || 'Unknown'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Species:</Text>
          <Text style={styles.infoValue}>{record.animal?.species || 'Unknown'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Breed:</Text>
          <Text style={styles.infoValue}>{record.animal?.breed || 'Unknown'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Record Details</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date:</Text>
          <Text style={styles.infoValue}>{formatDate(record.date)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Veterinarian:</Text>
          <Text style={styles.infoValue}>{record.veterinarian?.name || 'Unknown'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status:</Text>
          <Text style={[styles.infoValue, styles[`status${record.status.replace('_', '')}`]]}>
            {record.status.replace('_', ' ')}
          </Text>
        </View>
        {record.followUpDate && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Follow-up Date:</Text>
            <Text style={styles.infoValue}>{formatDate(record.followUpDate)}</Text>
          </View>
        )}
      </View>

      {record.diagnosis && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnosis</Text>
          <Text style={styles.descriptionText}>{record.diagnosis}</Text>
        </View>
      )}

      {record.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{record.description}</Text>
        </View>
      )}

      {record.treatment && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Treatment</Text>
          <Text style={styles.descriptionText}>{record.treatment}</Text>
        </View>
      )}

      {record.medications && record.medications.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medications</Text>
          {record.medications.map((med, index) => (
            <View key={index} style={styles.medicationItem}>
              <Text style={styles.medicationName}>{med.name}</Text>
              <Text style={styles.medicationDetails}>Dosage: {med.dosage}</Text>
              <Text style={styles.medicationDetails}>Frequency: {med.frequency}</Text>
              <Text style={styles.medicationDetails}>Duration: {med.duration}</Text>
            </View>
          ))}
        </View>
      )}

      {record.vaccines && record.vaccines.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vaccinations</Text>
          {record.vaccines.map((vaccine, index) => (
            <View key={index} style={styles.vaccineItem}>
              <Text style={styles.vaccineName}>{vaccine.name}</Text>
              <Text style={styles.vaccineDetails}>Type: {vaccine.type}</Text>
              <Text style={styles.vaccineDetails}>Administered: {formatDate(vaccine.dateAdministered)}</Text>
              {vaccine.nextDueDate && (
                <Text style={styles.vaccineDetails}>Next Due: {formatDate(vaccine.nextDueDate)}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {record.attachments && record.attachments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attachments</Text>
          {record.attachments.map((attachment, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.attachmentItem}
              onPress={() => handleOpenAttachment(attachment.url)}
            >
              <Ionicons 
                name={attachment.type === 'image' ? 'image-outline' : 'document-outline'} 
                size={24} 
                color="#315342" 
              />
              <Text style={styles.attachmentText}>{attachment.description || 'Attachment'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {record.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <Text style={styles.descriptionText}>{record.notes}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#315342',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#315342',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: 'bold',
    width: 120,
    color: '#666',
  },
  infoValue: {
    flex: 1,
  },
  descriptionText: {
    lineHeight: 22,
  },
  medicationItem: {
    backgroundColor: '#f0f7f1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  medicationName: {
    fontWeight: 'bold',
    color: '#315342',
    marginBottom: 4,
  },
  medicationDetails: {
    color: '#666',
    fontSize: 14,
  },
  vaccineItem: {
    backgroundColor: '#f0f7f1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  vaccineName: {
    fontWeight: 'bold',
    color: '#315342',
    marginBottom: 4,
  },
  vaccineDetails: {
    color: '#666',
    fontSize: 14,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f7f1',
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentText: {
    marginLeft: 12,
    color: '#315342',
  },
  statusactive: {
    color: '#1e88e5',
    fontWeight: 'bold',
  },
  statusresolved: {
    color: '#43a047',
    fontWeight: 'bold',
  },
  statusfollowup: {
    color: '#fb8c00',
    fontWeight: 'bold',
  },
});

export default MedicalRecordDetailScreen;