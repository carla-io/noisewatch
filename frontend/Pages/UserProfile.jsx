import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showToast } from '../utils/toast';
import API_BASE_URL from '../utils/api';

const { width, height } = Dimensions.get('window');

const getStatusBarHeight = () => {
  return Platform.OS === 'ios' ? (height >= 812 ? 44 : 20) : StatusBar.currentHeight || 24;
};

const UserProfile = ({ navigation }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        navigation.replace('Login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Profile fetch failed');
      }

      setProfileData(data.user);
      setEditFormData({
        name: data.user.username,
        email: data.user.email,
      });
      
    } catch (error) {
      console.error('Profile fetch error:', error);
      showToast('error', 'Profile Error', error.message || 'Failed to load profile');
      
      if (error.message.includes('authentication') || error.message.includes('token')) {
        navigation.replace('Login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateProfile = async () => {
    try {
      setIsUpdating(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        navigation.replace('Login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editFormData.name.trim(),
          email: editFormData.email.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Profile update failed');
      }

      setProfileData(data.user);
      setIsEditModalVisible(false);
      showToast('success', 'Profile Updated', 'Your profile has been updated successfully');
      
    } catch (error) {
      console.error('Profile update error:', error);
      showToast('error', 'Update Failed', error.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleEditProfile = () => {
    setEditFormData({
      name: profileData.name,
      email: profileData.email,
    });
    setIsEditModalVisible(true);
  };

  const validateForm = () => {
    if (!editFormData.name.trim()) {
      showToast('error', 'Validation Error', 'Name is required');
      return false;
    }
    if (!editFormData.email.trim()) {
      showToast('error', 'Validation Error', 'Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editFormData.email.trim())) {
      showToast('error', 'Validation Error', 'Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleUpdateProfile = () => {
    if (validateForm()) {
      updateProfile();
    }
  };

  const getUserTypeDisplay = (userType) => {
    switch (userType?.toLowerCase()) {
      case 'admin':
      case 'administrator':
        return 'System Administrator';
      case 'vet':
      case 'veterinarian':
      case 'doctor':
        return 'Veterinarian';
      default:
        return 'Community Member';
    }
  };

  const getUserTypeColor = (userType) => {
    switch (userType?.toLowerCase()) {
      case 'admin':
      case 'administrator':
        return '#8B4513';
      case 'vet':
      case 'veterinarian':
      case 'doctor':
        return '#D4AC0D';
      default:
        return '#8B7355';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#8B4513" />
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </SafeAreaView>
    );
  }

  const user = profileData || {
    name: 'User',
    email: 'user@example.com',
    userType: 'user',
    profilePhoto: null
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B4513" />
      
      {/* Header */}
      <LinearGradient colors={['#8B4513', '#654321']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF8DC" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8B4513']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Image
              source={user.profilePhoto 
                ? { uri: user.profilePhoto } 
                : require('../assets/default-profile.png')}
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user.username}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
              <View style={[styles.userTypeBadge, { backgroundColor: getUserTypeColor(user.userType) }]}>
                <Text style={styles.userTypeText}>{getUserTypeDisplay(user.userType)}</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={20} color="#8B4513" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#8B4513" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editFormData.name}
                  onChangeText={(text) => setEditFormData(prev => ({ ...prev, name: text }))}
                  placeholder="Enter your full name"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.textInput}
                  value={editFormData.email}
                  onChangeText={(text) => setEditFormData(prev => ({ ...prev, email: text }))}
                  placeholder="Enter your email address"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.saveButton, isUpdating && styles.saveButtonDisabled]}
                onPress={handleUpdateProfile}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8DC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8DC',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#8B4513',
  },
  header: {
    paddingTop: getStatusBarHeight() + 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 248, 220, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF8DC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -10,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    borderTopWidth: 4,
    borderTopColor: '#D4AC0D',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
    borderWidth: 3,
    borderColor: '#D4AC0D',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  userTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  userTypeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFACD',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#D4AC0D',
  },
  editButtonText: {
    color: '#8B4513',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '80%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#D4AC0D',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#8B4513',
    backgroundColor: '#FFFACD',
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D4AC0D',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: '#8B4513',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#999',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default UserProfile;