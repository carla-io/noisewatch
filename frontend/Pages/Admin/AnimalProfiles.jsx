import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import API_BASE_URL from '../../utils/api';
import CustomDrawer from '../CustomDrawer';

const { width, height } = Dimensions.get('window');
const getStatusBarHeight = () => {
  return Platform.OS === 'ios' ? (height >= 812 ? 44 : 20) : StatusBar.currentHeight || 24;
};

const AnimalProfiles = ({ setShowAnimalModal }) => {
  const navigation = useNavigation();
  
  const [animals, setAnimals] = useState([]);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [modals, setModals] = useState({
    detail: false,
    edit: false,
    add: false,
    deceased: false
  });
  const [editAnimal, setEditAnimal] = useState({});
  const [newAnimal, setNewAnimal] = useState({
    name: '', species: '', breed: '', age: '', status: 'healthy'
  });
  const [photos, setPhotos] = useState({
    editFile: null, newFile: null, editPreview: '', newPreview: ''
  });

  useEffect(() => {
    fetchAnimals();
  }, []);

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

  const fetchAnimals = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/animal/getAll`);
      if (response.data.success) {
        setAnimals(response.data.animals);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load animals');
      console.error('Error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = async (isEdit = false) => {
    Alert.alert(
      'Select Photo',
      'Choose an option',
      [
        { text: '📷 Take a Picture', onPress: () => captureImage(isEdit) },
        { text: '🖼️ Choose from Gallery', onPress: () => pickImage(isEdit) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

 const pickImage = async (isEdit = false) => {
  try {
    setImageLoading(true);
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'You need to allow access to your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      
      // Get file extension from URI
      const uriParts = asset.uri.split('.');
      const fileExtension = uriParts[uriParts.length - 1];
      
      // Determine MIME type
      let mimeType = 'image/jpeg';
      if (fileExtension.toLowerCase() === 'png') {
        mimeType = 'image/png';
      } else if (fileExtension.toLowerCase() === 'jpg' || fileExtension.toLowerCase() === 'jpeg') {
        mimeType = 'image/jpeg';
      }
      
      setPhotos(prev => ({
        ...prev,
        [isEdit ? 'editFile' : 'newFile']: {
          uri: asset.uri,
          type: mimeType,
          name: `photo_${Date.now()}.${fileExtension}`,
          size: asset.fileSize
        },
        [isEdit ? 'editPreview' : 'newPreview']: asset.uri
      }));
      
      console.log('Image selected successfully:', asset.uri);
    }
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Error', 'Failed to select image');
  } finally {
    setImageLoading(false);
  }
};

const captureImage = async (isEdit = false) => {
  try {
    setImageLoading(true);
    
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'You need to allow camera access.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      
      setPhotos(prev => ({
        ...prev,
        [isEdit ? 'editFile' : 'newFile']: {
          uri: asset.uri,
          type: 'image/jpeg', // Camera captures are typically JPEG
          name: `photo_${Date.now()}.jpg`,
          size: asset.fileSize
        },
        [isEdit ? 'editPreview' : 'newPreview']: asset.uri
      }));
      
      console.log('Image captured successfully:', asset.uri);
    }
  } catch (error) {
    console.error('Error capturing image:', error);
    Alert.alert('Error', 'Failed to capture image');
  } finally {
    setImageLoading(false);
  }
};

  const removePhoto = (isEdit = false) => {
    setPhotos(prev => ({
      ...prev,
      [isEdit ? 'editFile' : 'newFile']: null,
      [isEdit ? 'editPreview' : 'newPreview']: ''
    }));
  };

  const openModal = (type, animal = null) => {
    setModals({ detail: false, edit: false, add: false, deceased: false, [type]: true });
    if (animal) {
      setSelectedAnimal(animal);
      if (type === 'edit') {
        setEditAnimal({ ...animal });
        setPhotos(prev => ({ ...prev, editPreview: animal.photo || '' }));
      }
    }
  };

  const closeModal = () => {
    setModals({ detail: false, edit: false, add: false, deceased: false });
    setSelectedAnimal(null);
    setEditAnimal({});
    setNewAnimal({ name: '', species: '', breed: '', age: '', status: 'healthy' });
    setPhotos({ editFile: null, newFile: null, editPreview: '', newPreview: '' });
  };

  const handleMarkAsDeceased = async () => {
    try {
      const response = await axios.put(`${API_BASE_URL}/animal/update/${selectedAnimal._id}`, {
        status: 'deceased'
      });
      if (response.data.success) {
        setAnimals(prev => prev.map(animal => 
          animal._id === selectedAnimal._id 
            ? { ...animal, status: 'deceased' }
            : animal
        ));
        Alert.alert('Updated', `${selectedAnimal.name} has been marked as deceased.`);
        closeModal();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update animal status');
      console.error('Error:', error);
    }
  };

 const submitForm = async (isEdit = false) => {
  try {
    setLoading(true);
    const formData = new FormData();
    const data = isEdit ? editAnimal : newAnimal;
    
    // Validate required fields
    if (!data.name || !data.species) {
      Alert.alert('Error', 'Name and species are required fields');
      setLoading(false);
      return;
    }
    
    // Add text fields to FormData
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'photo' && key !== '_id') {
        formData.append(key, value || '');
      }
    });

    // Add photo if exists - This is the key part for Cloudinary
    const photoFile = isEdit ? photos.editFile : photos.newFile;
    if (photoFile && photoFile.uri) {
      console.log('Adding photo to FormData:', photoFile);
      
      // For React Native with Cloudinary, we need to format the file object correctly
      formData.append('photo', {
        uri: photoFile.uri,
        type: photoFile.type,
        name: photoFile.name,
      });
    }

    const url = isEdit 
      ? `${API_BASE_URL}/animal/update/${editAnimal._id}`
      : `${API_BASE_URL}/animal/add`;
    
    console.log('Submitting to:', url);
    console.log('Request data:', {
      method: isEdit ? 'PUT' : 'POST',
      hasPhoto: !!photoFile,
      photoInfo: photoFile ? {
        name: photoFile.name,
        type: photoFile.type,
        size: photoFile.size
      } : null
    });
    
    // Use fetch instead of axios for better FormData support in React Native
    const response = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    const responseText = await response.text();
    console.log('Raw response:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response text:', responseText);
      throw new Error('Invalid response format from server');
    }

    if (response.ok && result.success) {
      if (isEdit) {
        setAnimals(prev => prev.map(animal => 
          animal._id === editAnimal._id ? result.animal : animal
        ));
        Alert.alert('Success', `${editAnimal.name} updated successfully!`);
      } else {
        setAnimals(prev => [...prev, result.animal]);
        Alert.alert('Success', `${newAnimal.name} added successfully!`);
      }
      closeModal();
    } else {
      const errorMsg = result.message || `Server returned ${response.status}: ${response.statusText}`;
      Alert.alert('Error', errorMsg);
    }
  } catch (error) {
    console.error('Submit error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    let errorMessage = 'An error occurred';
    
    if (error.message.includes('Network request failed')) {
      errorMessage = 'Network error: Unable to connect to server. Please check your internet connection and server status.';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Request timeout: The server took too long to respond.';
    } else {
      errorMessage = error.message || 'An unexpected error occurred';
    }
    
    Alert.alert('Error', `Failed to ${isEdit ? 'update' : 'add'} animal:\n${errorMessage}`);
  } finally {
    setLoading(false);
  }
};

  const renderPhotoSection = (isEdit = false) => {
    const preview = isEdit ? photos.editPreview : photos.newPreview;
    
    return (
      <View style={styles.photoSection}>
        <Text style={styles.photoLabel}>Animal Photo</Text>
        {preview ? (
          <View style={styles.photoPreviewContainer}>
            <Image source={{ uri: preview }} style={styles.photoPreview} />
            <TouchableOpacity 
              style={styles.removePhotoBtn}
              onPress={() => removePhoto(isEdit)}
            >
              <Icon name="x" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.photoUploadArea}
            onPress={() => handlePhotoChange(isEdit)}
            disabled={imageLoading}
          >
            {imageLoading ? (
              <ActivityIndicator size="small" color="#718096" />
            ) : (
              <Icon name="upload" size={24} color="#718096" />
            )}
            <Text style={styles.photoUploadText}>
              {imageLoading ? 'Loading...' : 'Upload Photo'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return '#48bb78';
      case 'needs_attention':
        return '#ed8936';
      case 'deceased':
        return '#718096';
      default:
        return '#a0aec0';
    }
  };

  const renderFormFields = (data, setData) => (
    <>
      {renderPhotoSection(data === editAnimal)}
      {['name', 'species', 'breed', 'age'].map(field => (
        <View key={field} style={styles.formField}>
          <Text style={styles.formLabel}>
            {field.charAt(0).toUpperCase() + field.slice(1)}
            {(field === 'name' || field === 'species') && <Text style={styles.required}> *</Text>}
          </Text>
          <TextInput
            style={styles.formInput}
            placeholder={`Enter ${field}${field === 'age' ? ' in years' : ''}`}
            value={data[field] || ''}
            onChangeText={(text) => setData(prev => ({ ...prev, [field]: text }))}
            keyboardType={field === 'age' ? 'numeric' : 'default'}
          />
        </View>
      ))}
      <View style={styles.formField}>
        <Text style={styles.formLabel}>Status</Text>
        <View style={styles.statusContainer}>
          <TouchableOpacity
            style={[
              styles.statusOption,
              data.status === 'healthy' && styles.statusOptionActive
            ]}
            onPress={() => setData(prev => ({ ...prev, status: 'healthy' }))}
          >
            <Text style={[
              styles.statusOptionText,
              data.status === 'healthy' && styles.statusOptionTextActive
            ]}>
              Healthy
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.statusOption,
              data.status === 'needs_attention' && styles.statusOptionActive
            ]}
            onPress={() => setData(prev => ({ ...prev, status: 'needs_attention' }))}
          >
            <Text style={[
              styles.statusOptionText,
              data.status === 'needs_attention' && styles.statusOptionTextActive
            ]}>
              Needs Attention
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.statusOption,
              data.status === 'deceased' && styles.statusOptionActive
            ]}
            onPress={() => setData(prev => ({ ...prev, status: 'deceased' }))}
          >
            <Text style={[
              styles.statusOptionText,
              data.status === 'deceased' && styles.statusOptionTextActive
            ]}>
              Deceased
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#315342" />
        <Text style={styles.loadingText}>Loading animals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#315342" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
              <Icon name="menu" size={24} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Animal Profiles</Text>
              <Text style={styles.headerSubtitle}>
                Manage your animal records
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => openModal('add')}
            >
              <Icon name="plus" size={16} color="#fff" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Animals List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {animals.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="camera" size={64} color="#a0aec0" />
            <Text style={styles.emptyStateText}>No animals yet</Text>
            <Text style={styles.emptyStateSubtext}>Add your first animal to get started</Text>
          </View>
        ) : (
          animals.map(animal => (
            <View key={animal._id} style={[
              styles.animalCard,
              animal.status === 'deceased' && styles.deceasedCard
            ]}>
              <View style={styles.animalPhotoContainer}>
                {animal.photo ? (
                  <View style={styles.photoWrapper}>
                    <Image source={{ uri: animal.photo }} style={[
                      styles.animalPhoto,
                      animal.status === 'deceased' && styles.deceasedPhoto
                    ]} />
                    {animal.status === 'deceased' && (
                      <View style={styles.deceasedOverlay}>
                        <Icon name="heart" size={20} color="#fff" />
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={[
                    styles.animalPhotoPlaceholder,
                    animal.status === 'deceased' && styles.deceasedPhotoPlaceholder
                  ]}>
                    <Icon name="camera" size={32} color="#a0aec0" />
                    <Text style={styles.photoPlaceholderText}>No Photo</Text>
                  </View>
                )}
              </View>

              <View style={styles.animalInfo}>
                <View style={styles.animalHeader}>
                  <Text style={[
                    styles.animalName,
                    animal.status === 'deceased' && styles.deceasedText
                  ]}>
                    {animal.name}
                    {animal.status === 'deceased' && ' ♥'}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(animal.status) }
                  ]}>
                    <Text style={styles.statusText}>
                      {animal.status?.replace('_', ' ') || 'N/A'}
                    </Text>
                  </View>
                </View>

                <View style={styles.animalDetails}>
                  {['species', 'breed', 'age'].map(field => (
                    <View key={field} style={styles.animalDetail}>
                      <Text style={styles.animalDetailLabel}>
                        {field.charAt(0).toUpperCase() + field.slice(1)}:
                      </Text>
                      <Text style={styles.animalDetailValue}>
                        {animal[field] || 'N/A'}{field === 'age' ? ' years' : ''}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.animalActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openModal('detail', animal)}
                  >
                    <Icon name="eye" size={16} color="#315342" />
                    <Text style={styles.actionButtonText}>View</Text>
                  </TouchableOpacity>
                  {animal.status !== 'deceased' && (
                    <>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => openModal('edit', animal)}
                      >
                        <Icon name="edit-3" size={16} color="#315342" />
                        <Text style={styles.actionButtonText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deceasedButton]}
                        onPress={() => openModal('deceased', animal)}
                      >
                        <Icon name="heart" size={16} color="#718096" />
                        <Text style={[styles.actionButtonText, styles.deceasedButtonText]}>Deceased</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={modals.detail} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedAnimal?.name}'s Details
                {selectedAnimal?.status === 'deceased' && ' ♥'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Icon name="x" size={24} color="#4a5568" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {selectedAnimal?.photo && (
                <View style={styles.detailPhotoContainer}>
                  <Image 
                    source={{ uri: selectedAnimal.photo }} 
                    style={[
                      styles.detailPhoto,
                      selectedAnimal.status === 'deceased' && styles.deceasedPhoto
                    ]} 
                  />
                  {selectedAnimal.status === 'deceased' && (
                    <View style={styles.deceasedOverlay}>
                      <Icon name="heart" size={24} color="#fff" />
                    </View>
                  )}
                </View>
              )}
              
              {['species', 'breed', 'age'].map(field => (
                <View key={field} style={styles.detailItem}>
                  <Text style={styles.detailLabel}>
                    {field.charAt(0).toUpperCase() + field.slice(1)}:
                  </Text>
                  <Text style={styles.detailValue}>
                    {selectedAnimal?.[field] || 'N/A'}{field === 'age' ? ' years' : ''}
                  </Text>
                </View>
              ))}
              
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(selectedAnimal?.status) }
                ]}>
                  <Text style={styles.statusText}>
                    {selectedAnimal?.status?.replace('_', ' ') || 'N/A'}
                  </Text>
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnSecondary} onPress={closeModal}>
                <Text style={styles.btnSecondaryText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={modals.edit} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit {selectedAnimal?.name}</Text>
              <TouchableOpacity onPress={closeModal}>
                <Icon name="x" size={24} color="#4a5568" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {renderFormFields(editAnimal, setEditAnimal)}
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnSecondary} onPress={closeModal}>
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.btnPrimary} 
                onPress={() => submitForm(true)}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Icon name="save" size={16} color="#fff" />
                )}
                <Text style={styles.btnPrimaryText}>
                  {loading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Modal */}
      <Modal visible={modals.add} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Animal</Text>
              <TouchableOpacity onPress={closeModal}>
                <Icon name="x" size={24} color="#4a5568" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {renderFormFields(newAnimal, setNewAnimal)}
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnSecondary} onPress={closeModal}>
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.btnPrimary} 
                onPress={() => submitForm(false)}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Icon name="save" size={16} color="#fff" />
                )}
                <Text style={styles.btnPrimaryText}>
                  {loading ? 'Adding...' : 'Add Animal'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Deceased Modal */}
      <Modal visible={modals.deceased} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mark as Deceased</Text>
              <TouchableOpacity onPress={closeModal}>
                <Icon name="x" size={24} color="#4a5568" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.deceasedWarning}>
                <Icon name="heart" size={48} color="#718096" />
                <Text style={styles.deceasedWarningText}>
                  Are you sure you want to mark{' '}
                  <Text style={styles.deceasedWarningName}>
                    {selectedAnimal?.name}
                  </Text>
                  {' '}as deceased? This will update their status to deceased for record-keeping purposes.
                </Text>
                <Text style={styles.deceasedNote}>
                  The animal's profile will remain in your records but will be marked as deceased.
                </Text>
              </View>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnSecondary} onPress={closeModal}>
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnDeceased} onPress={handleMarkAsDeceased}>
                <Icon name="heart" size={16} color="#fff" />
                <Text style={styles.btnDeceasedText}>Mark as Deceased</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    backgroundColor: '#f7fafc',
    marginBottom: 40
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4a5568',
  },
  header: {
    backgroundColor: '#315342',
    paddingTop: getStatusBarHeight(),
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a5568',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#a0aec0',
    marginTop: 8,
    textAlign: 'center',
  },
  animalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  deceasedCard: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e2e8f0',
    borderWidth: 1,
  },
  animalPhotoContainer: {
    height: 200,
    backgroundColor: '#edf2f7',
  },
  photoWrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  animalPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  deceasedPhoto: {
    opacity: 0.7,
  },
  deceasedOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  animalPhotoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#edf2f7',
  },
  deceasedPhotoPlaceholder: {
    backgroundColor: '#f1f3f4',
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: '#a0aec0',
    marginTop: 8,
  },
  animalInfo: {
    padding: 16,
  },
  animalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  animalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    flex: 1,
  },
  deceasedText: {
    color: '#718096',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  animalDetails: {
    marginBottom: 16,
  },
  animalDetail: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  animalDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    width: 80,
  },
  animalDetailValue: {
    fontSize: 14,
    color: '#2d3748',
    flex: 1,
  },
  animalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f7fafc',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#315342',
    marginLeft: 4,
  },
  deleteButton: {
    backgroundColor: '#fed7d7',
  },
  deleteButtonText: {
    color: '#e53e3e',
  },
  deceasedButton: {
    backgroundColor: '#f1f3f4',
  },
  deceasedButtonText: {
    color: '#718096',
  },
  modalContainer: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: width * 0.9,
    maxHeight: height * 0.8,
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    flex: 1,
  },
  modalBody: {
    padding: 20,
    maxHeight: height * 0.5,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  btnSecondary: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f7fafc',
    marginRight: 12,
  },
  btnSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#315342',
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
  },
  btnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#e53e3e',
  },
  btnDangerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
  },
  btnDeceased: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#718096',
  },
  btnDeceasedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
  },
  detailPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  detailPhotoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#2d3748',
    flex: 1,
  },
  deleteWarning: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  deleteWarningText: {
    fontSize: 16,
    color: '#4a5568',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  deleteWarningName: {
    fontWeight: 'bold',
    color: '#e53e3e',
  },
  deceasedWarning: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  deceasedWarningText: {
    fontSize: 16,
    color: '#4a5568',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  deceasedWarningName: {
    fontWeight: 'bold',
    color: '#718096',
  },
  deceasedNote: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  formField: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 8,
  },
  required: {
    color: '#e53e3e',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  statusOptionActive: {
    backgroundColor: '#315342',
    borderColor: '#315342',
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
  },
  statusOptionTextActive: {
    color: '#fff',
  },
  photoSection: {
    marginBottom: 16,
  },
  photoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 8,
  },
  photoUploadArea: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 32,
    alignItems: 'center',
    backgroundColor: '#f7fafc',
  },
  photoUploadText: {
    fontSize: 14,
    color: '#718096',
    marginTop: 8,
  },
  photoPreviewContainer: {
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
});

export default AnimalProfiles;