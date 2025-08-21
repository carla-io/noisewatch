import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, FlatList,
  ActivityIndicator, Image, ScrollView, RefreshControl, DrawerLayoutAndroid
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../../utils/api';
import { showToast } from '../../utils/toast';
import CustomDrawer from '../CustomDrawer';

// Utility functions
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

const formatStatus = (status) => {
  if (!status) return '';
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const getStatusColor = (status) => {
  const colors = {
    active: '#FFA500',
    resolved: '#4CAF50',
    follow_up: '#2196F3'
  };
  return colors[status] || '#666';
};

// ViewCheckup Component
const ViewCheckup = ({ record, animals, onClose }) => {
  const getAnimalName = () => {
    if (!record.animal) return 'Unknown Animal';
    if (typeof record.animal === 'object' && record.animal.name) {
      return record.animal.name;
    }
    const animal = animals.find(a => a._id === record.animal);
    return animal ? animal.name : 'Unknown Animal';
  };

  const fields = [
    { label: 'Animal', value: getAnimalName() },
    { label: 'Checkup Date', value: formatDate(record.date) },
    { label: 'Description', value: record.description, multiline: true },
    { label: 'Diagnosis', value: record.diagnosis, multiline: true, optional: true },
    { label: 'Treatment', value: record.treatment, multiline: true, optional: true },
    { label: 'Weight', value: record.weight ? `${record.weight} kg` : null, optional: true },
    { label: 'Temperature', value: record.temperature ? `${record.temperature} °C` : null, optional: true },
    { label: 'Follow-up Date', value: formatDate(record.followUpDate), optional: true },
    { label: 'Status', value: formatStatus(record.status) },
    { label: 'Critical Case', value: record.isCritical ? 'Yes' : 'No' },
    { label: 'Additional Notes', value: record.notes, multiline: true, optional: true },
    { label: 'Veterinarian', value: record.veterinarian?.name || 'Unknown Vet', optional: true }
  ];

  return (
    <ScrollView style={styles.recordModal}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordTitle}>Checkup Details</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="#315342" />
        </TouchableOpacity>
      </View>

      {fields.map((field, index) => {
        if (field.optional && !field.value) return null;
        return (
          <View key={index} style={styles.formGroup}>
            <Text style={styles.formLabel}>{field.label}</Text>
            <View style={[styles.viewField, field.multiline && styles.multilineField]}>
              <Text>{field.value}</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

// Main Component
const UserMedicalCheckups = ({ navigation }) => {
  const drawerRef = useRef(null);
  
  // State
  const [checkups, setCheckups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [animals, setAnimals] = useState([]);
  const [userId, setUserId] = useState(null);
  
  // Modals
  const [modals, setModals] = useState({
    animalPicker: false,
    statusPicker: false,
    filter: false,
    view: false,
    datePicker: false
  });
  
  const [currentRecord, setCurrentRecord] = useState(null);
  const [datePickerMode, setDatePickerMode] = useState('from');
  
  // Filters
  const [filter, setFilter] = useState({
    animal: '',
    status: '',
    dateFrom: null,
    dateTo: null
  });

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'follow_up', label: 'Follow Up' }
  ];

  // API Functions
  const fetchUserId = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_BASE_URL}/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const fetchedUserId = response.data.user?.id || response.data.user?._id;
      setUserId(fetchedUserId && fetchedUserId !== 'null' ? fetchedUserId : null);
    } catch (error) {
      console.error('Error fetching user ID:', error);
      setUserId(null);
    }
  };

  const fetchUserAnimals = async () => {
    if (!userId) return [];
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_BASE_URL}/user/${userId}/animals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data.animals || [];
    } catch (error) {
      console.error('Error fetching user animals:', error);
      return [];
    }
  };

  const fetchCheckups = async () => {
    try {
      setLoading(true);
      if (!userId) {
        setCheckups([]);
        return;
      }

      const token = await AsyncStorage.getItem('userToken');
      const userAnimals = await fetchUserAnimals();
      
      if (userAnimals.length === 0) {
        setCheckups([]);
        setAnimals([]);
        return;
      }

      setAnimals(userAnimals);
      
      const checkupPromises = userAnimals.map(animal => 
        axios.get(`${API_BASE_URL}/medical-records?recordType=checkup&animal=${animal._id}&populate=animal,veterinarian`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ data: [] }))
      );
      
      const checkupResponses = await Promise.all(checkupPromises);
      let allCheckups = checkupResponses.flatMap((response, index) => 
        response.data.map(checkup => ({ ...checkup, animal: userAnimals[index] }))
      );

      // Apply filters
      if (filter.animal) allCheckups = allCheckups.filter(c => c.animal._id === filter.animal);
      if (filter.status) allCheckups = allCheckups.filter(c => c.status === filter.status);
      if (filter.dateFrom) allCheckups = allCheckups.filter(c => new Date(c.date) >= filter.dateFrom);
      if (filter.dateTo) allCheckups = allCheckups.filter(c => new Date(c.date) <= filter.dateTo);

      allCheckups.sort((a, b) => new Date(b.date) - new Date(a.date));
      setCheckups(allCheckups);
    } catch (error) {
      console.error('Error fetching checkups:', error);
      showToast('error', 'Error', 'Failed to fetch medical checkups');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Event Handlers
  const toggleModal = (modalName, value = null) => {
    setModals(prev => ({ ...prev, [modalName]: value ?? !prev[modalName] }));
  };

  const handleSelectAnimal = (animalId) => {
    setFilter(prev => ({ ...prev, animal: animalId }));
    toggleModal('animalPicker', false);
  };

  const handleSelectStatus = (status) => {
    setFilter(prev => ({ ...prev, status }));
    toggleModal('statusPicker', false);
  };

  const handleDateChange = (event, selectedDate) => {
    toggleModal('datePicker', false);
    if (selectedDate) {
      const key = datePickerMode === 'from' ? 'dateFrom' : 'dateTo';
      setFilter(prev => ({ ...prev, [key]: selectedDate }));
    }
  };

  const openViewModal = (record) => {
    setCurrentRecord(record);
    toggleModal('view', true);
  };

  const applyFilters = () => {
    toggleModal('filter', false);
    fetchCheckups();
  };

  const resetFilters = () => {
    setFilter({ animal: '', status: '', dateFrom: null, dateTo: null });
    toggleModal('filter', false);
    fetchCheckups();
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCheckups();
  };

  // Effects
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchUserId);
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (userId) fetchCheckups();
  }, [userId]);

  // Render Functions
  const renderCheckupItem = ({ item }) => (
    <TouchableOpacity style={styles.checkupItem} onPress={() => openViewModal(item)}>
      <View style={styles.checkupHeader}>
        <View style={styles.animalInfo}>
          {item.animal?.photo && (
            <Image source={{ uri: item.animal.photo }} style={styles.animalImage} />
          )}
          <Text style={styles.animalName}>{item.animal?.name || 'Unknown Animal'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{formatStatus(item.status)}</Text>
        </View>
      </View>
      
      <Text style={styles.checkupDate}>{formatDate(item.date)}</Text>
      <Text style={styles.checkupDescription} numberOfLines={2}>{item.description}</Text>
      
      {item.isCritical && (
        <View style={styles.criticalBadge}>
          <Ionicons name="warning" size={16} color="#fff" />
          <Text style={styles.criticalText}>Critical Case</Text>
        </View>
      )}
      
      <View style={styles.checkupFooter}>
        <Text style={styles.vetName}>By: Dr. {item.veterinarian?.name || 'Unknown Vet'}</Text>
        {item.followUpDate && (
          <Text style={styles.followUpDate}>Follow-up: {formatDate(item.followUpDate)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderPickerModal = (visible, title, data, selectedValue, onSelect, valueKey = 'value', labelKey = 'label') => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => toggleModal(title.toLowerCase().replace(' ', ''), false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{title}</Text>
            <TouchableOpacity onPress={() => toggleModal(title.toLowerCase().replace(' ', ''), false)}>
              <Ionicons name="close" size={24} color="#315342" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={data}
            keyExtractor={(item, index) => item[valueKey] || index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.pickerItem, selectedValue === item[valueKey] && styles.pickerItemSelected]}
                onPress={() => onSelect(item[valueKey])}
              >
                {item.photo && <Image source={{ uri: item.photo }} style={styles.animalImage} />}
                <Text style={styles.pickerItemText}>{item[labelKey]}</Text>
                {selectedValue === item[valueKey] && (
                  <Ionicons name="checkmark" size={20} color="#315342" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#315342" />
        <Text style={styles.loadingText}>Loading medical checkups...</Text>
      </View>
    );
  }

  const animalPickerData = [{ _id: '', name: 'All Animals' }, ...animals];
  const statusPickerData = [{ value: '', label: 'All Statuses' }, ...statusOptions];

  return (
    <DrawerLayoutAndroid
      ref={drawerRef}
      drawerWidth={300}
      drawerPosition="left"
      renderNavigationView={() => (
        <CustomDrawer navigation={navigation} onClose={() => drawerRef.current?.closeDrawer()} />
      )}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => drawerRef.current?.openDrawer()} style={styles.menuButton}>
            <Ionicons name="menu" size={28} color="#315342" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medical Checkups</Text>
          <TouchableOpacity style={styles.filterButton} onPress={() => toggleModal('filter', true)}>
            <Ionicons name="filter" size={24} color="#315342" />
          </TouchableOpacity>
        </View>

        {/* Checkups List */}
        <FlatList
          data={checkups}
          renderItem={renderCheckupItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="medkit-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No medical checkups found</Text>
              <Text style={styles.emptySubText}>Your animals' medical checkups will appear here</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#315342']} tintColor="#315342" />
          }
        />

        {/* Modals */}
        {renderPickerModal(modals.animalPicker, 'Select Animal', animalPickerData, filter.animal, handleSelectAnimal, '_id', 'name')}
        {renderPickerModal(modals.statusPicker, 'Select Status', statusPickerData, filter.status, handleSelectStatus)}

        {/* Filter Modal */}
        <Modal visible={modals.filter} transparent animationType="slide" onRequestClose={() => toggleModal('filter', false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.filterModal}>
              <Text style={styles.modalTitle}>Filter Checkups</Text>
              
              {/* Animal Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Animal</Text>
                <TouchableOpacity style={styles.filterInput} onPress={() => toggleModal('animalPicker', true)}>
                  <Text>{filter.animal ? animals.find(a => a._id === filter.animal)?.name || 'Unknown' : 'All Animals'}</Text>
                  <Ionicons name="chevron-down" size={20} color="#315342" />
                </TouchableOpacity>
              </View>

              {/* Status Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Status</Text>
                <TouchableOpacity style={styles.filterInput} onPress={() => toggleModal('statusPicker', true)}>
                  <Text>{filter.status ? statusOptions.find(s => s.value === filter.status)?.label || 'Unknown' : 'All Statuses'}</Text>
                  <Ionicons name="chevron-down" size={20} color="#315342" />
                </TouchableOpacity>
              </View>

              {/* Date Range Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Date Range</Text>
                <View style={styles.dateRangeContainer}>
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => {
                      setDatePickerMode('from');
                      toggleModal('datePicker', true);
                    }}
                  >
                    <Text>{filter.dateFrom ? formatDate(filter.dateFrom) : 'From Date'}</Text>
                    <Ionicons name="calendar" size={20} color="#315342" />
                  </TouchableOpacity>
                  <Text style={styles.dateRangeSeparator}>to</Text>
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => {
                      setDatePickerMode('to');
                      toggleModal('datePicker', true);
                    }}
                  >
                    <Text>{filter.dateTo ? formatDate(filter.dateTo) : 'To Date'}</Text>
                    <Ionicons name="calendar" size={20} color="#315342" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Filter Buttons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, styles.resetButton]} onPress={resetFilters}>
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.applyButton]} onPress={applyFilters}>
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* View Record Modal */}
        <Modal visible={modals.view} transparent={false} animationType="slide" onRequestClose={() => toggleModal('view', false)}>
          <ViewCheckup record={currentRecord} animals={animals} onClose={() => toggleModal('view', false)} />
        </Modal>

        {/* Date Picker */}
        {modals.datePicker && (
          <DateTimePicker
            value={datePickerMode === 'from' ? (filter.dateFrom || new Date()) : (filter.dateTo || new Date())}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
      </View>
    </DrawerLayoutAndroid>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#315342' },
  header: { backgroundColor: '#315342', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', flex: 1, marginLeft: 15 },
  filterButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
  listContent: { padding: 15, paddingBottom: 100 },
  checkupItem: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  checkupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  animalInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  animalImage: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  animalName: { fontSize: 16, fontWeight: 'bold', color: '#315342', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  checkupDate: { fontSize: 14, color: '#666', marginBottom: 8 },
  checkupDescription: { fontSize: 14, color: '#333', lineHeight: 20, marginBottom: 8 },
  criticalBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ff4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 8 },
  criticalText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  checkupFooter: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8 },
  vetName: { fontSize: 12, color: '#666', fontStyle: 'italic' },
  followUpDate: { fontSize: 12, color: '#2196F3', marginTop: 2 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
  emptyText: { fontSize: 18, color: '#666', marginTop: 16, textAlign: 'center' },
  emptySubText: { fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  pickerContainer: { backgroundColor: '#fff', borderRadius: 12, width: '90%', maxHeight: '70%' },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  pickerTitle: { fontSize: 18, fontWeight: 'bold', color: '#315342' },
  pickerItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  pickerItemSelected: { backgroundColor: '#f0f8f0' },
  pickerItemText: { flex: 1, marginLeft: 10 },
  filterModal: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '90%', maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#315342', marginBottom: 20, textAlign: 'center' },
  filterGroup: { marginBottom: 16 },
  filterLabel: { fontSize: 16, fontWeight: '600', color: '#315342', marginBottom: 8 },
  filterInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, backgroundColor: '#f9f9f9' },
  dateRangeContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, backgroundColor: '#f9f9f9', flex: 0.45 },
  dateRangeSeparator: { fontSize: 14, color: '#666', marginHorizontal: 8 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  modalButton: { flex: 0.48, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  resetButton: { backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ddd' },
  resetButtonText: { color: '#666', fontWeight: '600' },
  applyButton: { backgroundColor: '#315342' },
  applyButtonText: { color: '#fff', fontWeight: '600' },
  recordModal: { flex: 1, backgroundColor: '#f5f5f5' },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#315342', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  recordTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  formGroup: { marginBottom: 16, marginHorizontal: 20 },
  formLabel: { fontSize: 16, fontWeight: '600', color: '#315342', marginBottom: 8 },
  viewField: { backgroundColor: '#fff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#e0e0e0', minHeight: 45, justifyContent: 'center' },
  multilineField: { minHeight: 80, alignItems: 'flex-start', paddingTop: 12 }
});

export default UserMedicalCheckups;