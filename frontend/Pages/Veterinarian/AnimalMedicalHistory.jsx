import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Image,
  ScrollView,
  RefreshControl,
  SectionList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../../utils/api';
import { showToast } from '../../utils/toast';

const AnimalMedicalHistory = ({ route, navigation }) => {
  const { animalId } = route.params;
  const [medicalHistory, setMedicalHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchMedicalHistory = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_BASE_URL}/medical-history/animal/${animalId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMedicalHistory(response.data);
    } catch (error) {
      console.error('Error fetching medical history:', error);
      showToast('error', 'Error', 'Failed to fetch medical history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMedicalHistory();
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMedicalHistory();
    });
    return unsubscribe;
  }, [navigation]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderConditionItem = ({ item }) => (
    <TouchableOpacity style={styles.itemContainer}>
      <Text style={styles.itemTitle}>{item.name}</Text>
      <Text style={styles.itemSubtitle}>Diagnosed: {formatDate(item.diagnosedDate)}</Text>
      <Text style={styles.itemStatus}>Status: {item.status}</Text>
      {item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}
    </TouchableOpacity>
  );

  const renderAllergyItem = ({ item }) => (
    <TouchableOpacity style={styles.itemContainer}>
      <Text style={styles.itemTitle}>{item.name}</Text>
      <Text style={styles.itemSubtitle}>Severity: {item.severity}</Text>
      <Text style={styles.itemSubtitle}>First Observed: {formatDate(item.firstObserved)}</Text>
      <Text style={styles.itemNotes}>Symptoms: {item.symptoms.join(', ')}</Text>
    </TouchableOpacity>
  );

  const renderNoteItem = ({ item }) => (
    <TouchableOpacity style={styles.itemContainer}>
      <Text style={styles.itemNotes}>{item.note}</Text>
      <Text style={styles.itemSubtitle}>
        Added by {item.addedBy?.name || 'Unknown'} on {formatDate(item.dateAdded)}
      </Text>
    </TouchableOpacity>
  );

  const renderWeightItem = ({ item }) => (
    <TouchableOpacity style={styles.itemContainer}>
      <Text style={styles.itemTitle}>{item.weight} kg</Text>
      <Text style={styles.itemSubtitle}>
        Recorded by {item.recordedBy?.name || 'Unknown'} on {formatDate(item.date)}
      </Text>
    </TouchableOpacity>
  );

  const sections = [
    {
      title: 'Overview',
      data: [medicalHistory?.overview || 'No overview available'],
      renderItem: ({ item }) => (
        <View style={styles.overviewContainer}>
          <Text style={styles.overviewText}>{item}</Text>
        </View>
      )
    },
    {
      title: 'Chronic Conditions',
      data: medicalHistory?.chronicConditions || [],
      renderItem: renderConditionItem
    },
    {
      title: 'Allergies',
      data: medicalHistory?.allergies || [],
      renderItem: renderAllergyItem
    },
    {
      title: 'Important Notes',
      data: medicalHistory?.importantNotes || [],
      renderItem: renderNoteItem
    },
    {
      title: 'Weight History',
      data: medicalHistory?.weightHistory || [],
      renderItem: renderWeightItem
    }
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#315342" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ section, item }) => section.renderItem({ item })}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{section.title}</Text>
            {section.title === 'Chronic Conditions' && (
              <TouchableOpacity onPress={() => setShowConditionModal(true)}>
                <Ionicons name="add" size={24} color="#315342" />
              </TouchableOpacity>
            )}
            {section.title === 'Allergies' && (
              <TouchableOpacity onPress={() => setShowAllergyModal(true)}>
                <Ionicons name="add" size={24} color="#315342" />
              </TouchableOpacity>
            )}
            {section.title === 'Important Notes' && (
              <TouchableOpacity onPress={() => setShowNoteModal(true)}>
                <Ionicons name="add" size={24} color="#315342" />
              </TouchableOpacity>
            )}
            {section.title === 'Weight History' && (
              <TouchableOpacity onPress={() => setShowWeightModal(true)}>
                <Ionicons name="add" size={24} color="#315342" />
              </TouchableOpacity>
            )}
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#315342']}
            tintColor="#315342"
          />
        }
        ListHeaderComponent={
          medicalHistory?.animal && (
            <View style={styles.animalHeader}>
              <Image 
                source={{ uri: medicalHistory.animal.photo || `${API_BASE_URL}/default_profile.png` }} 
                style={styles.animalImage}
              />
              <View style={styles.animalInfo}>
                <Text style={styles.animalName}>{medicalHistory.animal.name}</Text>
                <Text style={styles.animalDetails}>
                  {medicalHistory.animal.species} • {medicalHistory.animal.breed || 'Unknown breed'}
                </Text>
                <Text style={styles.animalDetails}>
                  Age: {medicalHistory.animal.age || 'Unknown'} • Status: {medicalHistory.animal.status.replace('_', ' ')}
                </Text>
              </View>
            </View>
          )
        }
      />

      {/* Add Condition Modal */}
      <Modal visible={showConditionModal} animationType="slide">
        <View style={styles.modalContainer}>
          {/* Implement form for adding chronic condition */}
        </View>
      </Modal>

      {/* Add Allergy Modal */}
      <Modal visible={showAllergyModal} animationType="slide">
        <View style={styles.modalContainer}>
          {/* Implement form for adding allergy */}
        </View>
      </Modal>

      {/* Add Note Modal */}
      <Modal visible={showNoteModal} animationType="slide">
        <View style={styles.modalContainer}>
          {/* Implement form for adding important note */}
        </View>
      </Modal>

      {/* Record Weight Modal */}
      <Modal visible={showWeightModal} animationType="slide">
        <View style={styles.modalContainer}>
          {/* Implement form for recording weight */}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animalHeader: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  animalImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  animalInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  animalName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#315342',
  },
  animalDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#e0e0e0',
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#315342',
  },
  overviewContainer: {
    padding: 15,
    backgroundColor: '#fff',
  },
  overviewText: {
    fontSize: 16,
    color: '#333',
  },
  itemContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#315342',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  itemStatus: {
    fontSize: 14,
    color: '#2196F3',
    marginTop: 5,
  },
  itemNotes: {
    fontSize: 14,
    color: '#333',
    marginTop: 5,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
});

export default AnimalMedicalHistory;