import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Modal,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../../utils/api';
import CustomDrawer from '../CustomDrawer';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { launchImageLibrary } from 'react-native-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const screenWidth = Dimensions.get('window').width;

const ViewAnimals = () => {
  const [animals, setAnimals] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [eating, setEating] = useState('Normal');
  const [movement, setMovement] = useState('Active');
  const [mood, setMood] = useState('Calm');
  const [notes, setNotes] = useState('');
  const navigation = useNavigation();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-screenWidth * 0.8)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [video, setVideo] = useState(null);

  const openDrawer = () => {
    setDrawerVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const requestPermission = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert('Permission to access media library is required!');
  }
};

const pickVideo = async () => {
  if (video) return; // prevent re-picking if already selected

  try {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access media library is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.cancelled) {
      const localUri = result.assets[0].uri;
      const filename = localUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `video/${match[1]}` : `video/mp4`;

      setVideo({
        uri: localUri,
        name: filename,
        type,
      });

      console.log('✅ Video selected:', { uri: localUri, name: filename, type });
    } else {
      console.log('🚫 User cancelled picking video.');
    }
  } catch (error) {
    console.error('❌ Error picking video:', error);
  }
};

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -screenWidth * 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setDrawerVisible(false));
  };

  // Function to close modal and reset form
  const closeModal = () => {
    setModalVisible(false);
    setSelectedAnimal(null);
    setEating('Normal');
    setMovement('Active');
    setMood('Calm');
    setNotes('');
    setVideo(null);
  };

  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/animal/getAll`);
        if (res.data.success) {
          setAnimals(res.data.animals);
        }
      } catch (err) {
        console.error('Error fetching animals:', err);
      }
    };

    fetchAnimals();
  }, []);

  const openModal = (animal) => {
    setSelectedAnimal(animal);
    setModalVisible(true);
  };

  const submitBehavior = async () => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      alert('User ID not found. Please log in again.');
      return;
    }

    if (!video) {
      alert('Please attach a proof video before submitting.');
      return;
    }

    const formData = new FormData();
    formData.append('animalId', selectedAnimal._id);
    formData.append('eating', eating);
    formData.append('movement', movement);
    formData.append('mood', mood);
    formData.append('notes', notes);
    formData.append('recordedBy', userId);

    formData.append('proofVideo', {
  uri: video.uri,
  name: video.name,
  type: video.type,
});

    await axios.post(`${API_BASE_URL}/behavior/add`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    alert('Behavior logged!');
    closeModal(); // Use closeModal instead of just setModalVisible(false)
  } catch (err) {
    console.error('Submit error:', err.response?.data || err.message);
    alert('Error submitting behavior');
  }
};

  const renderItem = ({ item }) => (
    <View style={styles.cardWrapper}>
      <View style={styles.card}>
        <TouchableOpacity style={styles.plusIcon} onPress={() => openModal(item)}>
          <Icon name="add-circle-outline" size={18} color="#2a2a2a" />
        </TouchableOpacity>

        <Image
          source={{ uri: item.photo.replace('/upload/', '/upload/e_bgremoval/') }}
          style={styles.animalImage}
          resizeMode="contain"
        />

        <View style={styles.labelBox}>
          <Text style={styles.animalName}>{item.name}</Text>
          <Text style={styles.animalAge}>{item.age} yrs old</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#2d4b37" barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={openDrawer}>
            <Icon name="menu" size={26} color="#fff" />
          </TouchableOpacity>
          <Icon name="search" size={24} color="#fff" />
        </View>
        <Text style={styles.greeting}>Hello,</Text>
        <Text style={styles.subTitle}>Input Behavior</Text>
      </View>

      <FlatList
        data={animals}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header with Close Button */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Behavior</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Eating</Text>
            <Picker selectedValue={eating} onValueChange={setEating}>
              <Picker.Item label="Normal" value="Normal" />
              <Picker.Item label="Low" value="Low" />
              <Picker.Item label="None" value="None" />
            </Picker>

            <Text style={styles.label}>Movement</Text>
            <Picker selectedValue={movement} onValueChange={setMovement}>
              <Picker.Item label="Active" value="Active" />
              <Picker.Item label="Lazy" value="Lazy" />
              <Picker.Item label="Limping" value="Limping" />
            </Picker>

            <Text style={styles.label}>Mood</Text>
            <Picker selectedValue={mood} onValueChange={setMood}>
              <Picker.Item label="Calm" value="Calm" />
              <Picker.Item label="Aggressive" value="Aggressive" />
              <Picker.Item label="Anxious" value="Anxious" />
            </Picker>

            <TextInput
              placeholder="Notes (optional)"
              style={styles.inputBox}
              value={notes}
              onChangeText={setNotes}
            />
            
            <TouchableOpacity onPress={() => !video && pickVideo()}
              style={styles.attachButton}
            >
              <View>
                <Text>Attach Video</Text>
                {video && (
                  <Text style={{ fontSize: 12, marginBottom: 5, color: '#555' }}>
                    Attached: {video.fileName}
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={submitBehavior}>
                <Text style={styles.submitBtnText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={drawerVisible} transparent animationType="none">
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <Animated.View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', opacity: overlayOpacity }}>
            <TouchableOpacity style={{ flex: 1 }} onPress={closeDrawer} />
          </Animated.View>
          <Animated.View
            style={{
              width: screenWidth * 0.8,
              backgroundColor: '#fff',
              transform: [{ translateX: slideAnim }],
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              zIndex: 10,
              elevation: 5,
            }}
          >
            <CustomDrawer onClose={closeDrawer} navigation={navigation} />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

export default ViewAnimals;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#2d4b37',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  greeting: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  subTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
  },
  listContainer: {
    padding: 15,
  },
  cardWrapper: {
    width: (screenWidth - 50) / 2,
    alignItems: 'center',
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#b8e8b9',
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  plusIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
    zIndex: 10,
  },
  animalImage: {
    width: 80,
    height: 80,
    marginVertical: 5,
  },
  labelBox: {
    backgroundColor: '#e8f7ea',
    width: '100%',
    paddingVertical: 6,
    alignItems: 'center',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  animalName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#2a2a2a',
  },
  animalAge: {
    fontSize: 12,
    color: '#555',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '85%',
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  label: {
    marginTop: 10,
    fontWeight: '500',
  },
  inputBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
    marginBottom: 12,
  },
  attachButton: {
    padding: 10,
    backgroundColor: '#ddd',
    marginVertical: 10,
    borderRadius: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cancelBtnText: {
    color: '#666',
    fontWeight: 'bold',
  },
  submitBtn: {
    flex: 1,
    backgroundColor: '#2d4b37',
    padding: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});