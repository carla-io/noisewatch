import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Menu, 
  Search, 
  Filter, 
  Calendar, 
  Eye, 
  AlertTriangle,
  Clock,
  User,
  Paw
} from 'lucide-react-native';
import API_BASE_URL from '../../utils/api';
import CustomDrawer from '../CustomDrawer';
import SeekVetModal from './SeekVetModal'; // Adjust path as needed

const { width, height } = Dimensions.get('window');

// Add navigation prop to the component
const AllBehaviorsScreen = ({ navigation }) => {
  const [behaviors, setBehaviors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedBehavior, setSelectedBehavior] = useState(null);
  const [seekVetModalVisible, setSeekVetModalVisible] = useState(false);
  const [selectedAnimalForVet, setSelectedAnimalForVet] = useState(null);

  // Animation values for drawer
  const [slideAnim] = useState(new Animated.Value(-width * 0.8));
  const [overlayOpacity] = useState(new Animated.Value(0));

  // Filter options - updated to show critical and normal animals
  const filterOptions = [
    { key: 'all', label: 'All' },
    { key: 'seekvet', label: 'Seek Vet' },
    { key: 'normal', label: 'Normal' },
  ];
  
  // Handle opening seek vet modal
  const handleSeekVet = (behavior) => {
    setSeekVetModalVisible(true);
    setSelectedAnimalForVet(behavior.animalId);
  };

  // Handle successful vet assignment
  const handleVetAssignSuccess = (assignment) => {
    console.log('Vet assigned successfully:', assignment);
    setSeekVetModalVisible(false);
    setSelectedAnimalForVet(null);
    // Refresh behaviors list
    fetchBehaviors();
  };

  const handleCloseSeekVetModal = () => {
    setSeekVetModalVisible(false);
    setSelectedAnimalForVet(null);
  };

  // Drawer animation functions
  const openDrawer = () => {
    setDrawerVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -width * 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => setDrawerVisible(false));
  };

  // Fetch all behaviors
  const fetchBehaviors = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/behavior/getAll`);
      const data = await response.json();
      
      if (data.success) {
        setBehaviors(data.behaviors);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch behaviors');
      }
    } catch (error) {
      console.error('Error fetching behaviors:', error);
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBehaviors();
  }, [fetchBehaviors]);

  // Check if behavior is critical
  const isCriticalBehavior = (behavior) => {
    return behavior.eating === 'None' || 
           behavior.movement === 'Limping' || 
           behavior.mood === 'Aggressive';
  };

  // Filter behaviors based on search and selected filter
  const filteredBehaviors = behaviors.filter(behavior => {
    const matchesSearch = !searchText || 
      behavior.animalId?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      behavior.animalId?.species?.toLowerCase().includes(searchText.toLowerCase()) ||
      behavior.notes?.toLowerCase().includes(searchText.toLowerCase());

    const isCritical = isCriticalBehavior(behavior);

    switch (selectedFilter) {
      case 'seekvet':
        return matchesSearch && isCritical;
      case 'normal':
        return matchesSearch && !isCritical;
      default:
        return matchesSearch;
    }
  });

  // Get status badge color
  const getStatusBadgeStyle = (behavior) => {
    if (isCriticalBehavior(behavior)) {
      return styles.statusCritical;
    }
    return styles.statusHealthy;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Render behavior card
  const renderBehaviorCard = (behavior) => (
    <View key={behavior._id} style={styles.behaviorCard}>
      <View style={styles.behaviorHeader}>
        <View style={styles.animalInfo}>
          <Text style={styles.animalName}>
            {behavior.animalId?.name || 'Unknown Animal'}
          </Text>
          <Text style={styles.animalSpecies}>
            {behavior.animalId?.species} • {behavior.animalId?.breed}
          </Text>
        </View>
        <View style={[styles.statusBadge, getStatusBadgeStyle(behavior)]}>
          <Text style={styles.statusText}>
            {isCriticalBehavior(behavior) ? 'Critical' : 'Normal'}
          </Text>
        </View>
      </View>

      <View style={styles.behaviorDetails}>
        <View style={styles.behaviorRow}>
          <Text style={styles.behaviorLabel}>Eating:</Text>
          <Text style={[
            styles.behaviorValue,
            behavior.eating === 'None' && styles.criticalText
          ]}>
            {behavior.eating}
          </Text>
        </View>

        <View style={styles.behaviorRow}>
          <Text style={styles.behaviorLabel}>Movement:</Text>
          <Text style={[
            styles.behaviorValue,
            behavior.movement === 'Limping' && styles.criticalText
          ]}>
            {behavior.movement}
          </Text>
        </View>

        <View style={styles.behaviorRow}>
          <Text style={styles.behaviorLabel}>Mood:</Text>
          <Text style={[
            styles.behaviorValue,
            behavior.mood === 'Aggressive' && styles.criticalText
          ]}>
            {behavior.mood}
          </Text>
        </View>

        {behavior.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.behaviorLabel}>Notes:</Text>
            <Text style={styles.notesText} numberOfLines={2}>
              {behavior.notes}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.behaviorFooter}>
        <View style={styles.timeInfo}>
          <Clock size={14} color="#718096" />
          <Text style={styles.timeText}>
            {formatDate(behavior.createdAt)}
          </Text>
        </View>

        <View style={styles.footerButtons}>
          {/* Show Seek Vet button for critical behaviors */}
          {isCriticalBehavior(behavior) && (
            <TouchableOpacity
              style={styles.seekVetButton}
              onPress={() => handleSeekVet(behavior)}
            >
              <AlertTriangle size={16} color="#e53e3e" />
              <Text style={styles.seekVetButtonText}>Seek Vet</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => {
              setSelectedBehavior(behavior);
              setDetailModalVisible(true);
            }}
          >
            <Eye size={16} color="#315342" />
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Render detail modal
  const renderDetailModal = () => (
    <Modal
      visible={detailModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setDetailModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Behavior Details</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setDetailModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {selectedBehavior && (
              <>
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Animal Information</Text>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Name</Text>
                    <Text style={styles.detailValue}>
                      {selectedBehavior.animalId?.name || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Species</Text>
                    <Text style={styles.detailValue}>
                      {selectedBehavior.animalId?.species || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Breed</Text>
                    <Text style={styles.detailValue}>
                      {selectedBehavior.animalId?.breed || 'N/A'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Behavior Data</Text>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Eating</Text>
                    <Text style={[
                      styles.detailValue,
                      selectedBehavior.eating === 'None' && styles.criticalText
                    ]}>
                      {selectedBehavior.eating}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Movement</Text>
                    <Text style={[
                      styles.detailValue,
                      selectedBehavior.movement === 'Limping' && styles.criticalText
                    ]}>
                      {selectedBehavior.movement}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Mood</Text>
                    <Text style={[
                      styles.detailValue,
                      selectedBehavior.mood === 'Aggressive' && styles.criticalText
                    ]}>
                      {selectedBehavior.mood}
                    </Text>
                  </View>
                </View>

                {selectedBehavior.notes && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Notes</Text>
                    <Text style={styles.fullNotesText}>
                      {selectedBehavior.notes}
                    </Text>
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Record Information</Text>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Recorded By</Text>
                    <Text style={styles.detailValue}>
                      {selectedBehavior.recordedBy?.name || 'Unknown'}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Date & Time</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(selectedBehavior.createdAt)}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#315342" />
          <Text style={styles.loadingText}>Loading behaviors...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={openDrawer}
            >
              <Menu size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Animal Behaviors</Text>
              <Text style={styles.headerSubtitle}>
                {filteredBehaviors.length} records found
              </Text>
            </View>
            <TouchableOpacity style={styles.refreshButton} onPress={fetchBehaviors}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#718096" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by animal name, species, or notes..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#a0aec0"
          />
        </View>

        {/* Filter Options */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.filterButton,
                selectedFilter === option.key && styles.filterButtonActive,
                // Add special styling for critical filter
                option.key === 'seekvet' && selectedFilter === option.key && styles.filterButtonCritical
              ]}
              onPress={() => setSelectedFilter(option.key)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedFilter === option.key && styles.filterButtonTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Behaviors List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchBehaviors();
              }}
              colors={['#315342']}
              tintColor="#315342"
            />
          }
        >
          {filteredBehaviors.length === 0 ? (
            <View style={styles.emptyState}>
              <Paw size={48} color="#a0aec0" style={styles.emptyStateIcon} />
              <Text style={styles.emptyStateTitle}>No behaviors found</Text>
              <Text style={styles.emptyStateText}>
                {searchText || selectedFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No behavior records have been added yet.'
                }
              </Text>
            </View>
          ) : (
            filteredBehaviors.map(renderBehaviorCard)
          )}
        </ScrollView>
      </View>

      {/* Custom Drawer Overlay */}
      {drawerVisible && (
        <View style={StyleSheet.absoluteFillObject}>
          {/* Overlay Background */}
          <Animated.View 
            style={[
              styles.drawerOverlay,
              { opacity: overlayOpacity }
            ]}
          >
            <TouchableOpacity 
              style={styles.overlayTouchable}
              onPress={closeDrawer}
              activeOpacity={1}
            />
          </Animated.View>

          {/* Drawer Content - PASS NAVIGATION PROP HERE */}
          <Animated.View
            style={[
              styles.drawerContainer,
              {
                transform: [{ translateX: slideAnim }]
              }
            ]}
          >
            <CustomDrawer
              visible={drawerVisible}
              onClose={closeDrawer}
              navigation={navigation} // Pass navigation prop to CustomDrawer
            />
          </Animated.View>
        </View>
      )}

      {/* Seek Vet Modal */}
      <SeekVetModal
        visible={seekVetModalVisible}
        onClose={handleCloseSeekVetModal}
        selectedAnimal={selectedAnimalForVet}
        onAssignSuccess={handleVetAssignSuccess}
      />

      {/* Detail Modal */}
      {renderDetailModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#315342',
    fontWeight: '500',
  },
  header: {
    paddingBottom: 25,
    paddingTop: 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    backgroundColor: '#315342',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#a4d9ab',
    marginTop: 2,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 80,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#2d3748',
  },
  searchIcon: {
    marginRight: 12,
  },
  filterContainer: {
    marginBottom: 16,
    maxHeight: 50,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#315342',
    borderColor: '#315342',
    shadowColor: '#315342',
    shadowOpacity: 0.2,
  },
  filterButtonCritical: {
    backgroundColor: '#e53e3e',
    borderColor: '#e53e3e',
    shadowColor: '#e53e3e',
    shadowOpacity: 0.3,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#4a5568',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  behaviorCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  behaviorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  animalInfo: {
    flex: 1,
    marginRight: 12,
  },
  animalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 4,
  },
  animalSpecies: {
    fontSize: 14,
    color: '#718096',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusHealthy: {
    backgroundColor: '#38a169',
  },
  statusCritical: {
    backgroundColor: '#e53e3e',
  },
  behaviorDetails: {
    marginBottom: 16,
  },
  behaviorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 4,
  },
  behaviorLabel: {
    fontSize: 14,
    color: '#4a5568',
    fontWeight: '600',
    minWidth: 80,
  },
  behaviorValue: {
    fontSize: 14,
    color: '#2d3748',
    flex: 1,
    textAlign: 'right',
    fontWeight: '500',
  },
  criticalText: {
    color: '#e53e3e',
    fontWeight: '700',
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  notesText: {
    fontSize: 14,
    color: '#4a5568',
    marginTop: 6,
    lineHeight: 20,
    backgroundColor: '#f7fafc',
    padding: 10,
    borderRadius: 8,
  },
  behaviorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: '#718096',
    marginLeft: 6,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0fff4',
    borderWidth: 1,
    borderColor: '#315342',
    minWidth: 120,
    justifyContent: 'center',
  },
  viewButtonText: {
    fontSize: 13,
    color: '#315342',
    marginLeft: 6,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: width * 0.92,
    maxHeight: height * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a202c',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#718096',
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 24,
    maxHeight: height * 0.65,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#315342',
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#1a202c',
    flex: 2,
    textAlign: 'right',
    fontWeight: '500',
  },
  fullNotesText: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 22,
    backgroundColor: '#f7fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyStateIcon: {
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Drawer overlay styles
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  overlayTouchable: {
    flex: 1,
  },
  drawerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.8,
    zIndex: 1000,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 16,
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seekVetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fef5e7',
    borderWidth: 1,
    borderColor: '#e53e3e',
    marginRight: 8,
  },
  seekVetButtonText: {
    fontSize: 12,
    color: '#e53e3e',
    marginLeft: 4,
    fontWeight: '600',
  },
});

export default AllBehaviorsScreen;