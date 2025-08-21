import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
  TextInput,
} from 'react-native';
import {
  X,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  Stethoscope,
  Search,
  Calendar,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
} from 'lucide-react-native';
import API_BASE_URL from '../../utils/api';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

const SeekVetModal = ({ visible, onClose, selectedAnimal, onAssignSuccess }) => {
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [assigningVet, setAssigningVet] = useState(null);
  const [selectedVet, setSelectedVet] = useState(null);
  const [assignmentReason, setAssignmentReason] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // New state for vet assignments
  const [vetAssignments, setVetAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  
  // New state for checking existing assignment
  const [existingAssignment, setExistingAssignment] = useState(null);
  const [loadingExistingAssignment, setLoadingExistingAssignment] = useState(false);

  // Ensure visible is always a boolean
  const isModalVisible = Boolean(visible);

  // Fetch all users with userType = 'vet'
  const fetchVets = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/user/getAllVetsOnly`);
      console.log('Response:', response.data);
      
      if (response.data.success) {
        setVets(response.data.users || []);
        console.log('All users loaded:', response.data.users?.length);
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Check for existing assignment
  const checkExistingAssignment = async (animalId) => {
    if (!animalId) return;
    
    setLoadingExistingAssignment(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/behavior/assigned-vet/${animalId}`);
      console.log('Existing assignment response:', response.data);
      
      if (response.data.success) {
        const assignment = response.data.assignment;
        setExistingAssignment(assignment);
        
        // Find and set the assigned vet in the vets list
        const assignedVet = vets.find(vet => vet._id === assignment.vet._id);
        if (assignedVet) {
          setSelectedVet(assignedVet);
        }
        
        // Set the assignment reason
        if (assignment.reason) {
          setAssignmentReason(assignment.reason);
        }
      } else {
        setExistingAssignment(null);
      }
    } catch (error) {
      console.error('Error checking existing assignment:', error);
      setExistingAssignment(null);
      // Don't show alert for this as it's expected when no assignment exists
    } finally {
      setLoadingExistingAssignment(false);
    }
  };
  // const fetchVetAssignments = async (vetId) => {
  //   if (!vetId) return;
    
  //   setLoadingAssignments(true);
  //   try {
  //     const response = await axios.get(`${API_BASE_URL}/behavior/vet-assignments/${vetId}`);
  //     console.log('Vet assignments response:', response.data);
      
  //     if (response.data.success) {
  //       setVetAssignments(response.data.assignments || []);
  //     } else {
  //       setVetAssignments([]);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching vet assignments:', error);
  //     setVetAssignments([]);
  //     // Don't show alert for this as it's not critical
  //   } finally {
  //     setLoadingAssignments(false);
  //   }
  // };

  // Initialize modal when it becomes visible
  useEffect(() => {
    if (isModalVisible) {
      fetchVets();
      setSearchText('');
      setSelectedVet(null);
      setAssignmentReason('');
      setDropdownOpen(false);
      setVetAssignments([]);
      setExistingAssignment(null);
    }
  }, [isModalVisible]);

  // Check for existing assignment after vets are loaded
  useEffect(() => {
    if (isModalVisible && selectedAnimal && vets.length > 0) {
      checkExistingAssignment(selectedAnimal._id);
    }
  }, [isModalVisible, selectedAnimal, vets]);

  // Fetch assignments when vet is selected
  // useEffect(() => {
  //   if (selectedVet) {
  //     fetchVetAssignments(selectedVet._id);
  //   } else {
  //     setVetAssignments([]);
  //   }
  // }, [selectedVet]);

  // Filter vets based on search
  const filteredVets = vets.filter(vet =>
    !searchText ||
    vet.name?.toLowerCase().includes(searchText.toLowerCase()) ||
    vet.email?.toLowerCase().includes(searchText.toLowerCase()) ||
    vet.specialization?.toLowerCase().includes(searchText.toLowerCase()) ||
    vet.location?.toLowerCase().includes(searchText.toLowerCase())
  );

  // Assign veterinarian to animal - Updated to match your backend
  const assignVetToAnimal = async (vetId) => {
    if (!selectedAnimal || !vetId) {
      Alert.alert('Error', 'Missing animal or veterinarian information');
      return;
    }

    if (!assignmentReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the veterinary assignment');
      return;
    }

    setAssigningVet(vetId);
    try {
      const response = await axios.post(`${API_BASE_URL}/behavior/assign-vet`, {
        animalId: selectedAnimal._id,
        vetId: vetId,
        reason: assignmentReason.trim()
      });

      console.log('Assignment response:', response.data);

      // Check for success response
      if (response.data.success && response.data.assignment) {
        Alert.alert(
          'Assignment Successful',
          response.data.message,
          [
            {
              text: 'OK',
              onPress: () => {
                // Pass the complete assignment data from backend
                onAssignSuccess && onAssignSuccess(response.data.assignment);
                // Refresh assignments after successful assignment
                // fetchVetAssignments(selectedVet._id);
                onClose();
              },
            },
          ]
        );
      } else {
        // Handle unexpected response format
        Alert.alert(
          'Warning', 
          response.data.message || 'Assignment completed but with unexpected response format'
        );
      }

    } catch (error) {
      console.error('Error assigning vet:', error);
      
      let errorMessage = 'Failed to assign veterinarian';
      
      // Handle different error response formats
      if (error.response?.data?.success === false) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = `Network error: ${error.message}`;
      }
      
      Alert.alert('Assignment Failed', errorMessage);
    } finally {
      setAssigningVet(null);
    }
  };

  // Handle vet selection from dropdown
  const handleVetSelect = (vet) => {
    setSelectedVet(vet);
    setDropdownOpen(false);
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date unavailable';
    }
  };

  // Render assignment item
  const renderAssignmentItem = (assignment, index) => (
    <View key={assignment._id || index} style={styles.assignmentItem}>
      <View style={styles.assignmentHeader}>
        <View style={styles.assignmentAnimalInfo}>
          <User size={16} color="#315342" />
          <Text style={styles.assignmentAnimalName}>
            {assignment.animal?.name || 'Unknown Animal'}
          </Text>
        </View>
        <Text style={styles.assignmentDate}>
          {formatDate(assignment.createdAt || assignment.assignedAt)}
        </Text>
      </View>
      
      {assignment.animal && (
        <Text style={styles.assignmentAnimalDetails}>
          {assignment.animal.species} • {assignment.animal.breed}
          {assignment.animal.age && ` • ${assignment.animal.age} years old`}
        </Text>
      )}
      
      <View style={styles.assignmentReason}>
        <FileText size={14} color="#718096" />
        <Text style={styles.assignmentReasonText}>
          {assignment.reason || 'No reason provided'}
        </Text>
      </View>
      
      {assignment.status && (
        <View style={[
          styles.assignmentStatus,
          assignment.status === 'completed' && styles.assignmentStatusCompleted,
          assignment.status === 'pending' && styles.assignmentStatusPending,
          assignment.status === 'in-progress' && styles.assignmentStatusInProgress
        ]}>
          <Text style={styles.assignmentStatusText}>
            {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
          </Text>
        </View>
      )}
    </View>
  );

  // Render dropdown item
  const renderDropdownItem = (vet) => (
    <TouchableOpacity
      key={vet._id}
      style={styles.dropdownItem}
      onPress={() => handleVetSelect(vet)}
    >
      <View style={styles.dropdownItemContent}>
        <View style={styles.dropdownVetInfo}>
          <Text style={styles.dropdownVetName}>{vet.name}</Text>
          <Text style={styles.dropdownVetTitle}>
            {vet.specialization || 'General Veterinarian'}
          </Text>
          {vet.email && (
            <Text style={styles.dropdownVetEmail}>{vet.email}</Text>
          )}
        </View>
        <View style={styles.vetBadge}>
          <Stethoscope size={12} color="#315342" />
          <Text style={styles.vetBadgeText}>VET</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={isModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <AlertTriangle size={24} color="#e53e3e" />
              <View style={styles.headerText}>
                <Text style={styles.modalTitle}>Seek Veterinarian</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedAnimal ? `For ${selectedAnimal.name}` : 'Assign a vet'}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#718096" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalScrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Animal Info */}
            {selectedAnimal && (
              <View style={styles.animalInfoSection}>
                <Text style={styles.sectionTitle}>Animal Information</Text>
                <View style={styles.animalInfoCard}>
                  <Text style={styles.animalName}>{selectedAnimal.name}</Text>
                  <Text style={styles.animalDetails}>
                    {selectedAnimal.species} • {selectedAnimal.breed}
                  </Text>
                  {selectedAnimal.age && (
                    <Text style={styles.animalAge}>Age: {selectedAnimal.age}</Text>
                  )}
                </View>
              </View>
            )}

            {/* Existing Assignment Status */}
            {selectedAnimal && (
              <View style={styles.assignmentStatusSection}>
                <Text style={styles.sectionTitle}>Assignment Status</Text>
                
                {loadingExistingAssignment ? (
                  <View style={styles.loadingStatus}>
                    <ActivityIndicator size="small" color="#315342" />
                    <Text style={styles.loadingText}>Checking assignment status...</Text>
                  </View>
                ) : existingAssignment ? (
                  <View style={styles.existingAssignmentCard}>
                    <View style={styles.assignmentStatusHeader}>
                      <View style={styles.statusBadgeAssigned}>
                        <UserCheck size={16} color="#38a169" />
                        <Text style={styles.statusBadgeText}>ASSIGNED</Text>
                      </View>
                      <Text style={styles.assignmentDate}>
                        {formatDate(existingAssignment.assignedAt)}
                      </Text>
                    </View>
                    
                    <View style={styles.assignedVetInfo}>
                      <View style={styles.assignedVetHeader}>
                        <Stethoscope size={18} color="#315342" />
                        <Text style={styles.assignedVetName}>
                          Veterinarian ID: {existingAssignment.vet._id}
                        </Text>
                      </View>
                      
                      {existingAssignment.reason && (
                        <View style={styles.assignmentReasonContainer}>
                          <FileText size={14} color="#718096" />
                          <Text style={styles.existingReasonText}>
                            {existingAssignment.reason}
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.reassignmentNote}>
                      <AlertTriangle size={14} color="#d69e2e" />
                      <Text style={styles.reassignmentNoteText}>
                        This animal already has an assigned veterinarian. Proceeding will reassign to a new vet.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.unassignedCard}>
                    <View style={styles.statusBadgeUnassigned}>
                      <AlertTriangle size={16} color="#e53e3e" />
                      <Text style={styles.statusBadgeTextUnassigned}>UNASSIGNED</Text>
                    </View>
                    <Text style={styles.unassignedText}>
                      No veterinarian has been assigned to this animal yet.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Veterinarian Dropdown */}
            <View style={styles.dropdownSection}>
              <Text style={styles.sectionTitle}>
                {existingAssignment ? 'Assigned Veterinarian' : 'Select Veterinarian'}
              </Text>
              
              {loading ? (
                <View style={styles.loadingDropdown}>
                  <ActivityIndicator size="small" color="#315342" />
                  <Text style={styles.loadingText}>Loading veterinarians...</Text>
                </View>
              ) : (
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={[
                      styles.dropdownButton,
                      dropdownOpen && styles.dropdownButtonOpen,
                      existingAssignment && !dropdownOpen && styles.dropdownButtonReadonly
                    ]}
                    onPress={() => setDropdownOpen(!dropdownOpen)}
                    disabled={loadingExistingAssignment}
                  >
                    <View style={styles.dropdownButtonContent}>
                      <Text style={[
                        styles.dropdownButtonText,
                        selectedVet && styles.dropdownButtonTextSelected
                      ]}>
                        {selectedVet ? selectedVet.name : 'Choose a veterinarian...'}
                        {existingAssignment && selectedVet && ' (Currently Assigned)'}
                      </Text>
                      {dropdownOpen ? (
                        <ChevronUp size={20} color="#718096" />
                      ) : (
                        <ChevronDown size={20} color="#718096" />
                      )}
                    </View>
                  </TouchableOpacity>

                  {dropdownOpen && (
                    <View style={styles.dropdownList}>
                      {/* Search Bar inside dropdown */}
                      <View style={styles.dropdownSearchContainer}>
                        <Search size={16} color="#718096" />
                        <TextInput
                          style={styles.dropdownSearchInput}
                          placeholder="Search veterinarians..."
                          value={searchText}
                          onChangeText={setSearchText}
                          placeholderTextColor="#a0aec0"
                        />
                      </View>

                      <ScrollView 
                        style={styles.dropdownScrollView}
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled={true}
                      >
                        {filteredVets.length === 0 ? (
                          <View style={styles.emptyDropdown}>
                            <Stethoscope size={32} color="#a0aec0" />
                            <Text style={styles.emptyDropdownText}>
                              {searchText ? 'No veterinarians match your search' : 'No veterinarians available'}
                            </Text>
                          </View>
                        ) : (
                          filteredVets.map(renderDropdownItem)
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Selected Vet Details */}
            {selectedVet && (
              <View style={styles.selectedVetSection}>
                <Text style={styles.sectionTitle}>Selected Veterinarian</Text>
                <View style={styles.selectedVetCard}>
                  <View style={styles.selectedVetHeader}>
                    <View style={styles.selectedVetInfo}>
                      <Text style={styles.selectedVetName}>{selectedVet.name}</Text>
                      <Text style={styles.selectedVetTitle}>
                        {selectedVet.specialization || 'General Veterinarian'}
                      </Text>
                    </View>
                    <View style={styles.vetBadge}>
                      <Stethoscope size={16} color="#315342" />
                      <Text style={styles.vetBadgeText}>VET</Text>
                    </View>
                  </View>

                  <View style={styles.selectedVetDetails}>
                    {selectedVet.email && (
                      <View style={styles.selectedVetDetailRow}>
                        <Mail size={14} color="#718096" />
                        <Text style={styles.selectedVetDetailText}>{selectedVet.email}</Text>
                      </View>
                    )}
                    
                    {selectedVet.phone && (
                      <View style={styles.selectedVetDetailRow}>
                        <Phone size={14} color="#718096" />
                        <Text style={styles.selectedVetDetailText}>{selectedVet.phone}</Text>
                      </View>
                    )}
                    
                    {selectedVet.location && (
                      <View style={styles.selectedVetDetailRow}>
                        <MapPin size={14} color="#718096" />
                        <Text style={styles.selectedVetDetailText}>{selectedVet.location}</Text>
                      </View>
                    )}

                    {selectedVet.experience && (
                      <View style={styles.selectedVetDetailRow}>
                        <Clock size={14} color="#718096" />
                        <Text style={styles.selectedVetDetailText}>{selectedVet.experience} years experience</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Vet Assignments Section */}
            {/* {selectedVet && (
              <View style={styles.assignmentsSection}>
                <Text style={styles.sectionTitle}>
                  Current Assignments ({vetAssignments.length})
                </Text>
                
                {loadingAssignments ? (
                  <View style={styles.loadingAssignments}>
                    <ActivityIndicator size="small" color="#315342" />
                    <Text style={styles.loadingText}>Loading assignments...</Text>
                  </View>
                ) : vetAssignments.length === 0 ? (
                  <View style={styles.emptyAssignments}>
                    <FileText size={32} color="#a0aec0" />
                    <Text style={styles.emptyAssignmentsText}>
                      No current assignments for this veterinarian
                    </Text>
                  </View>
                ) : (
                  <View style={styles.assignmentsList}>
                    {vetAssignments.map(renderAssignmentItem)}
                  </View>
                )}
              </View>
            )} */}

            {/* Assignment Reason */}
            {(selectedVet || existingAssignment) && (
              <View style={styles.reasonSection}>
                <Text style={styles.sectionTitle}>
                  Assignment Reason
                  {existingAssignment && ' (Current)'}
                </Text>
                <TextInput
                  style={styles.reasonInput}
                  placeholder="Describe the reason for veterinary consultation..."
                  value={assignmentReason}
                  onChangeText={setAssignmentReason}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholderTextColor="#a0aec0"
                />
                {existingAssignment && (
                  <Text style={styles.reasonHint}>
                    You can modify the reason above if reassigning to a different veterinarian.
                  </Text>
                )}
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {existingAssignment && !selectedVet && (
              <TouchableOpacity
                style={styles.reassignButton}
                onPress={() => setDropdownOpen(true)}
              >
                <Text style={styles.reassignButtonText}>Reassign Veterinarian</Text>
              </TouchableOpacity>
            )}
            
            {selectedVet && (
              <>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setSelectedVet(null)}
                >
                  <Text style={styles.cancelButtonText}>Clear Selection</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.assignButton,
                    (!selectedVet || !assignmentReason.trim() || !!assigningVet) && styles.assignButtonDisabled
                  ]}
                  onPress={() => assignVetToAnimal(selectedVet._id)}
                  disabled={!selectedVet || !assignmentReason.trim() || assigningVet !== null}
                >
                  {assigningVet ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.assignButtonText}>
                      {existingAssignment ? 'Reassign Veterinarian' : 'Assign Veterinarian'}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
            
            {!existingAssignment && !selectedVet && (
              <TouchableOpacity
                style={[styles.assignButton, styles.assignButtonDisabled]}
                disabled={true}
              >
                <Text style={styles.assignButtonText}>Select a Veterinarian First</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: width * 0.95,
    maxHeight: height * 0.9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  // modalScrollView: {
  //   flex: 1,
  // },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a202c',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  animalInfoSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 12,
  },
  animalInfoCard: {
    backgroundColor: '#f0fff4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#c6f6d5',
  },
  animalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 4,
  },
  animalDetails: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 2,
  },
  animalAge: {
    fontSize: 14,
    color: '#4a5568',
  },
  assignmentStatusSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  loadingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4a5568',
  },
  existingAssignmentCard: {
    backgroundColor: '#f0fff4',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#38a169',
    borderWidth: 1,
    borderColor: '#c6f6d5',
  },
  unassignedCard: {
    backgroundColor: '#fff5f5',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#e53e3e',
    borderWidth: 1,
    borderColor: '#fed7d7',
  },
  assignmentStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadgeAssigned: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#c6f6d5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeUnassigned: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fed7d7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38a169',
    marginLeft: 4,
  },
  statusBadgeTextUnassigned: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e53e3e',
    marginLeft: 4,
  },
  assignedVetInfo: {
    marginBottom: 12,
  },
  assignedVetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  assignedVetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginLeft: 8,
  },
  assignmentReasonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#edf2f7',
    padding: 8,
    borderRadius: 6,
  },
  existingReasonText: {
    fontSize: 14,
    color: '#4a5568',
    marginLeft: 6,
    flex: 1,
    lineHeight: 20,
  },
  reassignmentNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f6e05e',
  },
  reassignmentNoteText: {
    fontSize: 12,
    color: '#744210',
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
  },
  unassignedText: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 20,
  },
  dropdownSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  loadingDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdownButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownButtonOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomColor: '#315342',
  },
  dropdownButtonReadonly: {
    backgroundColor: '#edf2f7',
    borderColor: '#cbd5e0',
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#a0aec0',
  },
  dropdownButtonTextSelected: {
    color: '#1a202c',
    fontWeight: '500',
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#315342',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  dropdownSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#2d3748',
  },
  dropdownScrollView: {
    maxHeight: 150,
  },
  dropdownItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  dropdownVetInfo: {
    flex: 1,
    marginRight: 12,
  },
  dropdownVetName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 2,
  },
  dropdownVetTitle: {
    fontSize: 12,
    color: '#4a5568',
    marginBottom: 2,
  },
  dropdownVetEmail: {
    fontSize: 12,
    color: '#718096',
  },
  vetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fff4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#315342',
  },
  vetBadgeText: {
    fontSize: 10,
    color: '#315342',
    fontWeight: '700',
    marginLeft: 4,
  },
  emptyDropdown: {
    alignItems: 'center',
    padding: 30,
  },
  emptyDropdownText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginTop: 8,
  },
  selectedVetSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  selectedVetCard: {
    backgroundColor: '#f0fff4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#c6f6d5',
  },
  selectedVetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  selectedVetInfo: {
    flex: 1,
    marginRight: 12,
  },
  selectedVetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 4,
  },
  selectedVetTitle: {
    fontSize: 14,
    color: '#4a5568',
  },
  selectedVetDetails: {
    gap: 8,
  },
  selectedVetDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedVetDetailText: {
    fontSize: 14,
    color: '#4a5568',
    marginLeft: 8,
  },
  assignmentsSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  loadingAssignments: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyAssignments: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyAssignmentsText: {
    fontSize: 14,
    color: '#a0aec0',
    textAlign: 'center',
    marginTop: 8,
  },
  assignmentsList: {
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  assignmentItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#315342',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  assignmentAnimalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  assignmentAnimalName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginLeft: 6,
  },
  assignmentDate: {
    fontSize: 12,
    color: '#718096',
  },
  assignmentAnimalDetails: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 6,
    marginLeft: 22,
  },
  assignmentReason: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  assignmentReasonText: {
    fontSize: 13,
    color: '#4a5568',
    marginLeft: 6,
    flex: 1,
    lineHeight: 18,
  },
  assignmentStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  assignmentStatusCompleted: {
    backgroundColor: '#c6f6d5',
  },
  assignmentStatusPending: {
    backgroundColor: '#fed7d7',
  },
  assignmentStatusInProgress: {
    backgroundColor: '#feebc8',
  },
  assignmentStatusText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#4a5568',
  },
  reasonSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  reasonInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#2d3748',
    minHeight: 80,
  },
  reasonHint: {
    fontSize: 12,
    color: '#718096',
    marginTop: 6,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f7fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#4a5568',
    fontWeight: '600',
  },
  assignButton: {
    flex: 2,
    backgroundColor: '#315342',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#315342',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  assignButtonDisabled: {
    backgroundColor: '#a0aec0',
    shadowOpacity: 0,
    elevation: 0,
  },
  assignButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
  },
  noChangeButton: {
    backgroundColor: '#718096',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
  },
  noChangeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SeekVetModal;