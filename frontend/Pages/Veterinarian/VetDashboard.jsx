import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
  Modal,
  Animated,
  StatusBar,
  Platform,
  Easing,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import CustomDrawer from '../CustomDrawer';
import API_BASE_URL from '../../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showToast } from '../../utils/toast';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

const getStatusBarHeight = () => {
  return Platform.OS === 'ios' ? (height >= 812 ? 44 : 20) : StatusBar.currentHeight || 24;
};

const VetDashboard = ({ navigation }) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [activeTab, setActiveTab] = useState('animals');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // State for fetched data
  const [animals, setAnimals] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({
    animalCount: 0,
    recordCount: 0,
    patientCount: 0
  });

  const fetchAnimals = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/animal/getAll`);
      const animalsData = res.data.animals || [];
      setAnimals(animalsData);
      setStats(prev => ({...prev, animalCount: animalsData.length}));
    } catch (error) {
      console.error('Error fetching animals:', error);
      showToast('error', 'Error', 'Failed to fetch animals');
    }
  };

  const fetchMedicalRecords = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await axios.get(`${API_BASE_URL}/medical-records`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const recordsData = res.data || [];
      setMedicalRecords(recordsData);
      setStats(prev => ({...prev, recordCount: recordsData.length}));
    } catch (error) {
      console.error('Error fetching medical records:', error);
      showToast('error', 'Error', 'Failed to fetch medical records');
    }
  };

  const fetchPatients = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      // Get current user info to get vet ID
      const userRes = await axios.get(`${API_BASE_URL}/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('User response:', userRes.data);
      
      const vetId = userRes.data.user?.id || userRes.data.user?._id;
      
      if (!vetId) {
        console.error('Vet ID not found in user profile:', userRes.data);
        showToast('error', 'Error', 'Unable to identify veterinarian');
        return;
      }

      console.log('Using vet ID:', vetId);

      // Fetch assigned animals that need medical attention
      const patientsRes = await axios.get(`${API_BASE_URL}/user/vet/${vetId}/assigned-animals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('Patients response:', patientsRes.data);

      // Fix: Use the correct path from your API response
      const patientsData = patientsRes.data.animals || [];
      
      console.log('Patients data:', patientsData);
      
      // Filter animals that need medical attention (status: needs_attention)
      const animalsNeedingAttention = patientsData.filter(animal => {
        console.log(`Animal ${animal.name} status:`, animal.status);
        return animal.status === 'needs_attention';
      });
      
      console.log('Animals needing attention:', animalsNeedingAttention);
      
      // Process the data to add additional checkup information
      const processedPatients = animalsNeedingAttention.map(animal => ({
        ...animal,
        checkupReason: animal.assignmentReason || 'Medical attention required',
        lastCheckup: animal.lastCheckup || null,
        urgencyLevel: 'high', // Since they need attention
        assignedDate: animal.assignedAt
      }));

      console.log('Processed patients:', processedPatients);

      setPatients(processedPatients);
      setStats(prev => ({...prev, patientCount: processedPatients.length}));
      
      console.log('Updated patients state with count:', processedPatients.length);
    } catch (error) {
      console.error('Error fetching patients:', error);
      console.error('Error details:', error.response?.data || error.message);
      showToast('error', 'Error', 'Failed to fetch patients');
      
      // Set empty patients array on error
      setPatients([]);
      setStats(prev => ({...prev, patientCount: 0}));
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAnimals(),
        fetchMedicalRecords(),
        fetchPatients()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('error', 'Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchData);
    return unsubscribe;
  }, [navigation]);

  const openDrawer = () => {
    setDrawerVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -width * 0.8,
        duration: 300,
        easing: Easing.bezier(0.55, 0.06, 0.68, 0.19),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      })
    ]).start(() => setDrawerVisible(false));
  };

  const renderAnimalItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.animalItem}
      onPress={() => navigation.navigate('AnimalProfiles', { animalId: item._id })}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: item.photo || `${API_BASE_URL}/default-profile.png` }} 
        style={styles.animalImage}
        defaultSource={{ uri: `${API_BASE_URL}/default-profile.png` }}
      />
      <View style={styles.animalInfo}>
        <Text style={styles.animalName}>{item.name}</Text>
        <Text style={styles.animalDetails}>{item.species} • {item.breed || 'Unknown'}</Text>
        <Text style={styles.animalDetails}>{item.age || 'Unknown'} years old</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{formatStatus(item.status)}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#a4d9ab" />
    </TouchableOpacity>
  );

  const renderRecordItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.recordItem}
      onPress={() => navigation.navigate('MedicalRecordsStack', { 
        screen: 'MedicalRecordDetailScreen',
        params: { recordId: item._id }
      })}
      activeOpacity={0.8}
    >
      <View style={styles.recordIconContainer}>
        <Ionicons 
          name={getRecordIcon(item.recordType)} 
          size={24} 
          color="#315342" 
        />
      </View>
      <View style={styles.recordInfo}>
        <Text style={styles.recordTitle}>{item.recordType} for {item.animal?.name || 'Animal'}</Text>
        <Text style={styles.recordDate}>{formatDate(item.date)}</Text>
        <Text style={styles.recordNotes} numberOfLines={1}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderPatientItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.patientItem}
      onPress={() => navigation.navigate('AnimalProfiles', { animalId: item._id })}
      activeOpacity={0.8}
    >
      <View style={styles.patientUrgency}>
        <Ionicons name="medical" size={20} color="#FF6347" />
      </View>
      <Image 
        source={{ uri: item.photo || `${API_BASE_URL}/default-profile.png` }} 
        style={styles.patientImage}
        defaultSource={{ uri: `${API_BASE_URL}/default-profile.png` }}
      />
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.name}</Text>
        <Text style={styles.patientDetails}>{item.species} • {item.breed || 'Unknown'}</Text>
        <Text style={styles.checkupReason}>{item.checkupReason}</Text>
        {item.lastCheckup && (
          <Text style={styles.lastCheckup}>Last checkup: {formatDate(item.lastCheckup)}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#a4d9ab" />
    </TouchableOpacity>
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'healthy': return '#a4d9ab';
      case 'needs_attention': return '#FFD700';
      case 'recovering': return '#FFA07A';
      default: return '#a4d9ab';
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getRecordIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'vaccination': return 'medkit-outline';
      case 'checkup': return 'medkit-outline';
      case 'treatment': return 'bandage-outline';
      case 'surgery': return 'medkit-outline';
      default: return 'document-text-outline';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#315342" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#315342" />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#315342']}
            tintColor="#315342"
          />
        }
      >
        {/* Header Section */}
        <LinearGradient
          colors={['#315342', '#1e3a2a']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={openDrawer} style={styles.headerButton}>
                <Ionicons name="menu" size={28} color="#a4d9ab" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Search')} style={styles.headerButton}>
                <Ionicons name="search" size={28} color="#a4d9ab" />
              </TouchableOpacity>
            </View>
            <Text style={styles.headerTitle}>Veterinarian Dashboard</Text>
            <Text style={styles.headerSubtitle}>Manage animal health records</Text>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.quickStatsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="paw" size={24} color="#315342" />
            <Text style={styles.statNumber}>{stats.animalCount}</Text>
            <Text style={styles.statLabel}>Animals</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="document-text" size={24} color="#315342" />
            <Text style={styles.statNumber}>{stats.recordCount}</Text>
            <Text style={styles.statLabel}>Records</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="medical" size={24} color="#315342" />
            <Text style={styles.statNumber}>{stats.patientCount}</Text>
            <Text style={styles.statLabel}>Patients</Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'animals' && styles.activeTab]}
            onPress={() => setActiveTab('animals')}
          >
            <Text style={[styles.tabText, activeTab === 'animals' && styles.activeTabText]}>Animals</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'records' && styles.activeTab]}
            onPress={() => setActiveTab('records')}
          >
            <Text style={[styles.tabText, activeTab === 'records' && styles.activeTabText]}>Records</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'patients' && styles.activeTab]}
            onPress={() => setActiveTab('patients')}
          >
            <Text style={[styles.tabText, activeTab === 'patients' && styles.activeTabText]}>Patients</Text>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Animals Tab */}
          {activeTab === 'animals' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Animal Profiles</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AllAnimals')}>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={animals.slice(0, 5)}
                renderItem={renderAnimalItem}
                keyExtractor={item => item._id}
                scrollEnabled={false}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No animals found</Text>
                }
              />
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => navigation.navigate('AddAnimal')}
              >
                <Ionicons name="add" size={24} color="#fff" />
                <Text style={styles.addButtonText}>Add New Animal</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Records Tab */}
          {activeTab === 'records' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Medical Records</Text>
                <View style={styles.recordActions}>
                  <TouchableOpacity onPress={() => navigation.navigate('MedicalRecordsStack')}>
                    <Text style={styles.seeAll}>See All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.filterButton}
                    onPress={() => navigation.navigate('MedicalRecordsStack', {
                      screen: 'MedicalRecords',
                      params: { filter: true }
                    })}
                  >
                    <Ionicons name="filter" size={18} color="#315342" />
                  </TouchableOpacity>
                </View>
              </View>
              <FlatList
                data={medicalRecords.slice(0, 5)}
                renderItem={renderRecordItem}
                keyExtractor={item => item._id}
                scrollEnabled={false}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No medical records found</Text>
                }
              />
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => navigation.navigate('MedicalRecordsStack', {
                  screen: 'AddMedicalRecord'
                })}
              >
                <Ionicons name="add" size={24} color="#fff" />
                <Text style={styles.addButtonText}>Add New Record</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Patients Tab */}
          {activeTab === 'patients' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Patients Needing Checkup</Text>
                <View style={styles.recordActions}>
                  <TouchableOpacity onPress={() => navigation.navigate('AllPatients')}>
                    <Text style={styles.seeAll}>See All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.filterButton}
                    onPress={() => navigation.navigate('FilterPatients')}
                  >
                    <Ionicons name="filter" size={18} color="#315342" />
                  </TouchableOpacity>
                </View>
              </View>
              <FlatList
                data={patients.slice(0, 5)}
                renderItem={renderPatientItem}
                keyExtractor={item => item._id}
                scrollEnabled={false}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No patients need checkup</Text>
                }
              />
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => navigation.navigate('ScheduleCheckup')}
              >
                <Ionicons name="calendar" size={24} color="#fff" />
                <Text style={styles.addButtonText}>Schedule Checkup</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('GenerateReport')}
            >
              <Ionicons name="document-text-outline" size={28} color="#315342" />
              <Text style={styles.quickActionText}>Generate Report</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('VaccinationSchedule')}
            >
              <Ionicons name="calendar-outline" size={28} color="#315342" />
              <Text style={styles.quickActionText}>Vaccination Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Custom Drawer */}
      <Modal visible={drawerVisible} transparent animationType="none" onRequestClose={closeDrawer}>
        <View style={styles.modalContainer}>
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeDrawer} />
          </Animated.View>
          <Animated.View style={[styles.drawerContainer, { transform: [{ translateX: slideAnim }] }]}>
            <CustomDrawer navigation={navigation} onClose={closeDrawer} />
          </Animated.View>
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
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#315342',
    fontWeight: '500',
  },
  header: {
    paddingTop: getStatusBarHeight() + 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#a4d9ab',
    opacity: 0.9,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#315342',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#315342',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#315342',
  },
  seeAll: {
    fontSize: 16,
    color: '#315342',
    fontWeight: '600',
  },
  recordActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterButton: {
    padding: 8,
  },
  animalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  animalImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  animalInfo: {
    flex: 1,
  },
  animalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#315342',
    marginBottom: 4,
  },
  animalDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recordIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  recordInfo: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#315342',
    marginBottom: 4,
  },
  recordDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  recordNotes: {
    fontSize: 14,
    color: '#888',
  },
  patientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6347',
  },
  patientUrgency: {
    marginRight: 12,
  },
  patientImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#315342',
    marginBottom: 4,
  },
  patientDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  checkupReason: {
    fontSize: 14,
    color: '#FF6347',
    fontWeight: '500',
    marginBottom: 2,
  },
  lastCheckup: {
    fontSize: 12,
    color: '#888',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#315342',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#315342',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  modalContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.8,
  },
});

export default VetDashboard;