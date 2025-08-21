import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
  Easing,
  SafeAreaView,
  StatusBar,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import CustomDrawer from '../CustomDrawer'; // Import your CustomDrawer component
import TaskModal from './TaskModal'; // Import the TaskModal component
import API_BASE_URL from '../../utils/api';

const { width } = Dimensions.get('window');

const TaskManagement = ({ navigation }) => {
  const [tasks, setTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchTasks();
  }, []);

  // Refresh tasks when task modal closes
  useEffect(() => {
    if (!showTaskModal) {
      fetchTasks();
    }
  }, [showTaskModal]);

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

  const fetchTasks = async (showSuccessMessage = false) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/tasks/getAll`);
      setTasks(res.data);
      
      if (showSuccessMessage) {
        Toast.show({
          type: 'success',
          text1: 'Tasks refreshed successfully!',
        });
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      Toast.show({
        type: 'error',
        text1: 'Failed to load tasks',
        text2: err.response?.data?.message || 'Please refresh the page.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchTasks(true);
  };

  const handleCompleteTask = async (taskId) => {
    try {
      const task = tasks.find(t => t._id === taskId);
      if (!task) {
        Toast.show({
          type: 'error',
          text1: 'Task not found',
        });
        return;
      }

      const newStatus = task.status.toLowerCase() === 'completed' ? 'Pending' : 'Completed';

      const updateData = {
        ...task,
        status: newStatus
      };

      if (newStatus === 'Completed') {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }

      await axios.put(`${API_BASE_URL}/tasks/edit/${taskId}`, updateData);

      if (newStatus === 'Completed') {
        Toast.show({
          type: 'success',
          text1: 'Task completed!',
          text2: `"${task.type}" for ${task.animalId?.name || 'Unknown'}`,
        });
      } else {
        Toast.show({
          type: 'info',
          text1: 'Task marked as pending',
          text2: `"${task.type}" for ${task.animalId?.name || 'Unknown'}`,
        });
      }

      fetchTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to update task',
        text2: error.response?.data?.message || 'Please try again.',
      });
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskModal(true);
    Toast.show({
      type: 'info',
      text1: 'Editing task',
      text2: `${task.type} for ${task.animalId?.name || 'Unknown'}`,
    });
  };

  const handleDeleteTask = (taskId, taskType) => {
    const task = tasks.find(t => t._id === taskId);
    const animalName = task?.animalId?.name || 'Unknown';
    
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete this ${taskType} task for ${animalName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_BASE_URL}/tasks/delete/${taskId}`);
              fetchTasks();
              Toast.show({
                type: 'success',
                text1: 'Task deleted',
                text2: `"${taskType}" for ${animalName} deleted successfully!`,
              });
            } catch (error) {
              console.error('Failed to delete task:', error);
              Toast.show({
                type: 'error',
                text1: 'Failed to delete task',
                text2: error.response?.data?.message || 'Please try again.',
              });
            }
          },
        },
      ],
    );
  };

  const handleViewImage = (imageUri) => {
    setSelectedImage(imageUri);
    setImageModalVisible(true);
  };

  const formatDateTime = (date, times) => {
    if (!date && (!times || times.length === 0)) return 'Not set';
    
    let result = '';
    
    if (date) {
      const taskDate = new Date(date);
      result = taskDate.toLocaleDateString(undefined, {
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
    }

    if (times && times.length > 0) {
      const formattedTimes = times.map(time => {
        const timeDate = new Date(`1970-01-01T${time}`);
        return timeDate.toLocaleTimeString([], {
          hour: '2-digit', 
          minute: '2-digit'
        });
      }).join(', ');
      
      if (result) {
        result += ` at ${formattedTimes}`;
      } else {
        result = formattedTimes;
      }
    }

    return result || 'Not set';
  };

  const filteredTasks = tasks.filter(task => {
    const searchValue = searchTerm.toLowerCase();
    const matchesSearch =
      task.animalId?.name?.toLowerCase().includes(searchValue) ||
      task.assignedTo?.name?.toLowerCase().includes(searchValue) ||
      task.type?.toLowerCase().includes(searchValue);

    const matchesStatus =
      statusFilter === 'all' || task.status?.toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filterOptions = [
    { label: 'All Status', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Completed', value: 'completed' },
  ];

  const renderTaskItem = ({ item }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <View style={styles.taskInfo}>
          <Text style={styles.taskType}>{item.type}</Text>
          <Text style={styles.animalName}>{item.animalId?.name || 'Unknown Animal'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status?.toLowerCase() === 'completed' ? '#28a745' : '#ffc107' }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.taskDetails}>
        <Text style={styles.assignedTo}>
          <Ionicons name="person" size={14} color="#666" />
          {' '}Assigned to: {item.assignedTo?.name || 'Unknown User'}
        </Text>
        <Text style={styles.scheduleTime}>
          <Ionicons name="time" size={14} color="#666" />
          {' '}{formatDateTime(item.scheduleDate, item.scheduleTimes)}
        </Text>
        {item.isRecurring && (
          <Text style={styles.recurringInfo}>
            <Ionicons name="repeat" size={14} color="#315342" />
            {' '}Recurring: {item.recurrencePattern}
          </Text>
        )}
        {item.completionVerified && (
          <Text style={styles.verifiedInfo}>
            <Ionicons name="checkmark-circle" size={14} color="#28a745" />
            {' '}Completion Verified
          </Text>
        )}
      </View>

      {/* Image Proof Section */}
      {item.imageProof && (
        <View style={styles.imageProofSection}>
          <Text style={styles.imageProofLabel}>
            <Ionicons name="camera" size={14} color="#315342" />
            {' '}Completion Proof:
          </Text>
          <TouchableOpacity 
            style={styles.imageProofContainer}
            onPress={() => handleViewImage(item.imageProof)}
          >
            <Image 
              source={{ uri: item.imageProof }} 
              style={styles.imageProofThumbnail}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay}>
              <Ionicons name="expand" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.taskActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.completeButton]}
          onPress={() => handleCompleteTask(item._id)}
        >
          <Ionicons 
            name={item.status?.toLowerCase() === 'completed' ? 'refresh' : 'checkmark'} 
            size={18} 
            color="#fff" 
          />
          <Text style={styles.actionButtonText}>
            {item.status?.toLowerCase() === 'completed' ? 'Undo' : 'Complete'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditTask(item)}
        >
          <Ionicons name="create" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteTask(item._id, item.type)}
        >
          <Ionicons name="trash" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFilterModal = () => (
    <Modal
      visible={filterModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.filterModal}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filter Tasks</Text>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.filterContent}>
            <Text style={styles.filterSectionTitle}>Status</Text>
            {filterOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterOption,
                  statusFilter === option.value && styles.selectedFilterOption
                ]}
                onPress={() => {
                  setStatusFilter(option.value);
                  setFilterModalVisible(false);
                  Toast.show({
                    type: 'info',
                    text1: 'Filter applied',
                    text2: `Showing ${option.label.toLowerCase()} tasks`,
                  });
                }}
              >
                <Text style={[
                  styles.filterOptionText,
                  statusFilter === option.value && styles.selectedFilterOptionText
                ]}>
                  {option.label}
                </Text>
                {statusFilter === option.value && (
                  <Ionicons name="checkmark" size={20} color="#315342" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderImageModal = () => (
    <Modal
      visible={imageModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setImageModalVisible(false)}
    >
      <View style={styles.imageModalOverlay}>
        <View style={styles.imageModalContainer}>
          <View style={styles.imageModalHeader}>
            <Text style={styles.imageModalTitle}>Completion Proof</Text>
            <TouchableOpacity 
              onPress={() => setImageModalVisible(false)}
              style={styles.imageModalCloseButton}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.fullSizeImage}
              resizeMode="contain"
            />
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#315342" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Management</Text>
        <TouchableOpacity 
          onPress={() => setShowTaskModal(true)}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks, animals, or users..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#999"
          />
        </View>
        <TouchableOpacity 
          onPress={() => setFilterModalVisible(true)}
          style={styles.filterButton}
        >
          <Ionicons name="filter" size={20} color="#315342" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleRefresh}
          style={styles.refreshButton}
        >
          <Ionicons name="refresh" size={20} color="#315342" />
        </TouchableOpacity>
      </View>

      {/* Tasks List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#315342" />
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          renderItem={renderTaskItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.tasksList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="clipboard-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No tasks found</Text>
              <Text style={styles.emptySubtext}>
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter' 
                  : 'Add your first task to get started'
                }
              </Text>
            </View>
          }
        />
      )}

      {/* Custom Drawer */}
      {drawerVisible && (
        <>
          <Animated.View
            style={[
              styles.overlay,
              {
                opacity: overlayOpacity,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.overlayTouch}
              onPress={closeDrawer}
              activeOpacity={1}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.drawer,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <CustomDrawer navigation={navigation} closeDrawer={closeDrawer} />
          </Animated.View>
        </>
      )}

      {/* Task Modal */}
      <TaskModal
        showTaskModal={showTaskModal}
        setShowTaskModal={setShowTaskModal}
        editingTask={editingTask}
        setEditingTask={setEditingTask}
      />

      {/* Filter Modal */}
      {renderFilterModal()}

      {/* Image Modal */}
      {renderImageModal()}
      
      {/* Toast */}
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#315342',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: getStatusBarHeight() + 15,
  },
  menuButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    padding: 10,
    marginRight: 5,
  },
  refreshButton: {
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  tasksList: {
    padding: 20,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  taskInfo: {
    flex: 1,
  },
  taskType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  animalName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  taskDetails: {
    marginBottom: 15,
  },
  assignedTo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  scheduleTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  recurringInfo: {
    fontSize: 14,
    color: '#315342',
    fontWeight: '500',
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 2,
    justifyContent: 'center',
  },
  completeButton: {
    backgroundColor: '#28a745',
  },
  editButton: {
    backgroundColor: '#007bff',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  overlayTouch: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.8,
    backgroundColor: '#fff',
    zIndex: 1001,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filterContent: {
    padding: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  selectedFilterOption: {
    backgroundColor: '#e8f5e8',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedFilterOptionText: {
    color: '#315342',
    fontWeight: '600',
  },
});

export default TaskManagement;