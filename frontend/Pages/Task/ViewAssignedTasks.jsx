import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
  Modal,
  Image,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_BASE_URL from '../../utils/api';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import CustomDrawer from '../CustomDrawer'; // <- make sure this is your drawer
import AnimalDetailView from '../AnimalProf/AnimalDetailView';

const { width } = Dimensions.get('window');

const getTaskStatusText = (task) => {
  if (task.completionVerified) return 'Completed';
  const hasValidImageProof =
    task.imageProof &&
    typeof task.imageProof === 'string' &&
    (task.imageProof.startsWith('http') || task.imageProof.startsWith('https') || task.imageProof.startsWith('data:image'));
  if (hasValidImageProof) return 'Waiting for admin confirmation';
  return 'Pending';
};

const ViewAssignedTasks = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [userName, setUserName] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [filter, setFilter] = useState('All');
  const navigation = useNavigation();

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
  
    // if (loading) {
    //   return (
    //     <View style={styles.centered}>
    //       <ActivityIndicator size="large" color="#2f4f4f" />
    //       <Text>Loading animals...</Text>
    //     </View>
    //   );
    // }


  const filteredTasks = tasks.filter((task) => {
    const hasProof =
      task.imageProof &&
      typeof task.imageProof === 'string' &&
      (task.imageProof.startsWith('http') || task.imageProof.startsWith('data:image'));

    if (filter === 'Pending') {
      return !hasProof && task.status === 'Pending' && task.completionVerified === false;
    }
    if (filter === 'In-Progress') {
      return hasProof && task.status === 'Pending' && task.completionVerified === false;
    }
    if (filter === 'Completed') {
      return hasProof && task.status === 'Completed' && task.completionVerified === true;
    }
    return true;
  });

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert('Permission to access media library is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setSelectedImage(result.assets[0]);
    }
  };

  const updateTaskStatus = async () => {
    if (!selectedImage) {
      alert('Please upload an image proof first.');
      return;
    }

    const formData = new FormData();
    formData.append('status', 'Completed');
    formData.append('imageProof', {
      uri: selectedImage.uri,
      name: 'proof.jpg',
      type: 'image/jpeg',
    });

    try {
      await axios.put(`${API_BASE_URL}/tasks/status/${selectedTaskId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setTasks((prev) =>
        prev.map((task) =>
          task._id === selectedTaskId
            ? { ...task, status: 'Pending', completionVerified: false, imageProof: selectedImage.uri }
            : task
        )
      );

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setShowStatusModal(false);
      setSelectedTaskId(null);
      setSelectedImage(null);
    }
  };

  useEffect(() => {
  const loadUserData = async () => {
    const userData = await AsyncStorage.getItem('userData');
    console.log('🧑 User Data:', userData);
    if (userData) {
      const user = JSON.parse(userData);
      setUserName(user.name || 'Farmer');
    }
  };

 
    const fetchTasks = async () => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      console.warn('❌ No userId found in AsyncStorage.');
      return;
    }

    const res = await axios.get(`${API_BASE_URL}/tasks/user/${userId}`);
    console.log('✅ Tasks fetched:', res.data);
    setTasks(res.data);
  } catch (err) {
    console.error('❌ Failed to fetch tasks:', err);
  } finally {
    setLoading(false);
  }
};


    loadUserData();
    fetchTasks();
  }, []);

   return (
     <View style={styles.container}>
       <StatusBar barStyle="light-content" backgroundColor="#2f4f4f" />
 
      {/* Header with Drawer Button */}
      <View style={styles.header}>
              <View style={styles.headerTop}>
                <TouchableOpacity onPress={openDrawer}>
                  <Ionicons name="menu" size={28} color="#a4d9ab" />
                </TouchableOpacity>
                <TouchableOpacity>
                  <Ionicons name="search" size={28} color="#a4d9ab" />
                </TouchableOpacity>
              </View>
              <Text style={styles.headerGreeting}>Hello, {userName}!</Text>
              <Text style={styles.headerSub}>Are you going to finish all your task today?</Text>
            </View>
      

      {/* Filter UI */}
      <View style={styles.filterRow}>
        <TouchableOpacity onPress={() => setFilter('All')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterButtons}>
        {['Pending', 'In-Progress', 'Completed'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterPill, filter === status && { backgroundColor: '#264835' }]}
            onPress={() => setFilter(status)}
          >
            <Text style={[styles.filterText, filter === status && { color: '#fff' }]}>{status}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Task List */}
      {loading ? (
        <ActivityIndicator size="large" color="#3e6652" style={{ marginTop: 20 }} />
      ) : tasks.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>No tasks assigned.</Text>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('ViewDetailedTask', { task: item })}>
              <View
                style={[
                  styles.taskCard,
                  {
                    backgroundColor: item.completionVerified
                      ? '#A4D9AB'
                      : item.imageProof &&
                        (item.imageProof.startsWith('http') || item.imageProof.startsWith('data:image'))
                      ? '#ccd9a4ff'
                      : '#e0e0e0',
                  },
                ]}
              >
                <Image
                  source={{ uri: item.animalId?.photo || 'https://via.placeholder.com/50' }}
                  style={styles.animalImage}
                />
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>{item.type}</Text>
                  <Text>{new Date(item.scheduleDate).toLocaleDateString()} – {item.scheduleTimes?.join(', ') || 'No time set'}</Text>
                  <Text>Animal: {item.animalId?.name || 'N/A'}</Text>
                  <Text>{getTaskStatusText(item)}</Text>
                </View>
                <TouchableOpacity onPress={() => {
                  setSelectedTaskId(item._id);
                  setShowStatusModal(true);
                }}>
                  <Ionicons name="ellipsis-vertical" size={20} color="#2f4f4f" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <Modal transparent animationType="fade" visible={showStatusModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.card}>
              <Text style={styles.modalTitle}>Upload Proof of task </Text>
              <TouchableOpacity
                style={{ backgroundColor: '#d8f5dc', padding: 10, borderRadius: 10, marginBottom: 10 }}
                onPress={pickImage}
              >
                <Text style={{ color: '#2f4f4f', fontWeight: 'bold' }}>Upload Image</Text>
              </TouchableOpacity>

              {selectedImage && (
                <Image
                  source={{ uri: selectedImage.uri }}
                  style={{ width: 100, height: 100, borderRadius: 10, marginBottom: 10 }}
                />
              )}

              <TouchableOpacity
                style={[styles.statusButton, { backgroundColor: '#112e20ff' }]}
                onPress={updateTaskStatus}
                disabled={!selectedImage}
              >
                <Text style={[styles.statusButtonText, { color: 'white' }]}>Submit Task</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Text style={{ color: '#2f4f4f', marginTop: 10 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Success Toast */}
      {showSuccess && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>✅ Task status updated!</Text>
        </View>
      )}

            {/* Drawer */}
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
    backgroundColor: '#f6f9f7',
  },
    header: {
    backgroundColor: '#2f4f4f',
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerGreeting: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSub: {
    color: '#fff',
    fontSize: 14,
    marginTop: 5,
  },
   headerWrapper: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingVertical: 25,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  headerIcon: {
    backgroundColor: '#446A53',
    padding: 8,
    borderRadius: 12,
  },
  headerTextWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  greenHeader: {
    backgroundColor: '#264835',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerGreeting: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerSubtext: {
    color: '#d0e8dc',
    fontSize: 14,
  },
  filterRow: {
  flexDirection: 'row',
  justifyContent: 'flex-end',
  marginTop: 10,
  marginRight: 20,
},
seeAllText: {
  fontWeight: '600',
  color: '#264835',
  fontSize: 14,
},
filterButtons: {
  flexDirection: 'row',
  justifyContent: 'center',
  marginVertical: 10,
  gap: 10,
},
filterPill: {
  backgroundColor: '#A7D6B0',
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 20,
},
filterText: {
  color: '#264835',
  fontWeight: '600',
  fontSize: 13,
},

  monthYear: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3e6652',
    marginBottom: 6,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 5,
  },
  dayItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  dayLabel: {
    color: '#3e6652',
    fontSize: 13,
    marginBottom: 4,
  },
  dayCircle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  activeDayCircle: {
    backgroundColor: '#3e6652',
  },
  dayNumber: {
    color: '#3e6652',
    fontSize: 14,
  },
  activeDayNumber: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    marginHorizontal: 20,
    color: '#2f4f4f',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  taskInfo: {
    flex: 1,
    marginLeft: 10,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2f4f4f',
  },
  taskTime: {
    fontSize: 13,
    color: '#555',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
     width: '85%',
  backgroundColor: 'white',
  borderRadius: 20,
  padding: 20,
  alignItems: 'center',
  elevation: 10,
  },
  modalContainer: {
    flex: 1,
    flexDirection: 'row',

  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f4f4f',
    marginBottom: 15,
  },
  statusButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 10,
  },
  statusButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  successContainer: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  successText: {
    backgroundColor: '#a4d9ab',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    color: '#2f4f4f',
    fontWeight: 'bold',
  },
  calendarButton: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    backgroundColor: '#2f4f4f',
    borderRadius: 30,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  drawerContainer: {
   width: width * 0.8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animalImage: {
  width: 50,
  height: 50,
  borderRadius: 25,
  marginRight: 10,
  backgroundColor: '#ccc',
},

});


export default ViewAssignedTasks;