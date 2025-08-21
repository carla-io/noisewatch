import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Alert,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showToast } from '../utils/toast';
import API_BASE_URL from '../utils/api';

const { height } = Dimensions.get('window');

const CustomDrawer = ({ navigation, onClose }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState('user'); // Default to regular user

  // Regular user menu items
  const userMenuItems = [
     { id: '1', title: 'View Assigned Tasks', icon: 'clipboard-outline', route: 'AssignedTasks' },
     { id: '2', title: 'Input Daily Animal Behavior', icon: 'create-outline', route: 'AddBehavior' },
     { id: '3', title: 'View Animal', icon: 'paw-outline', route: 'AnimalView' },
      // { id: '4', title: 'Checkups', icon: 'medkit-outline', route: 'AnimalCheckups' },
  ];

  // Admin menu items
  const adminMenuItems = [
    { id: '1', title: 'Dashboard', icon: 'bar-chart-outline', route: 'AdminDashboard' },
    { id: '2', title: 'Manage Users', icon: 'people-outline', route: 'UserManagement' },
    { id: '3', title: 'Animal Profiles', icon: 'paw-outline', route: 'AnimalProfiles' },
    { id: '4', title: 'Task Management', icon: 'checkmark-circle-outline', route: 'TaskManagement' },
    { id: '5', title: 'Schedules', icon: 'calendar-outline', route: 'Schedule' },
    { id: '6', title: 'Behavior Logs', icon: 'document-text-outline', route: 'Behavior' },
    // { id: '7', title: 'Reports', icon: 'download-outline', route: 'Reports' },
    // { id: '8', title: 'System Settings', icon: 'settings-outline', route: 'SystemSettings' },
  ];

  // Veterinarian menu items
   const vetMenuItems = [
    { id: '1', title: 'Animal Health Dashboard', icon: 'heart-outline', route: 'VetDashboard' },
    { id: '2', title: 'Animal Profiles', icon: 'paw-outline', route: 'AnimalProfiles' },
    { id: '3', title: 'Medical Checkups', icon: 'medkit-outline', route: 'MedicalCheckups' },
    // { id: '4', title: 'Treatments & Medications', icon: 'medical-outline', route: 'Treatments' },
    // { id: '5', title: 'Vaccination Records', icon: 'shield-checkmark-outline', route: 'VaccinationRecords' },
    // { id: '6', title: 'Medical History', icon: 'time-outline', route: 'MedicalHistory' },
    // { id: '7', title: 'Health Reports', icon: 'document-text-outline', route: 'HealthReports' },
    // { id: '8', title: 'Emergency Cases', icon: 'warning-outline', route: 'EmergencyCases' },
    // { id: '9', title: 'Search Medical Records', icon: 'search-outline', route: 'SearchMedicalRecords' },
    // { id: '10', title: 'Assigned Health Tasks', icon: 'clipboard-outline', route: 'AssignedHealthTasks' },
  ];

  const bottomItems = [
    // { id: '9', title: 'Settings', icon: 'settings-outline', route: 'Settings' },
    // { id: '10', title: 'Help & Support', icon: 'help-circle-outline', route: 'Support' },
    // { id: '11', title: 'About', icon: 'information-circle-outline', route: 'About' },
  ];

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No authentication token found');

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
      if (!data.success) throw new Error(data.message || 'Profile fetch failed');

      setProfileData(data.user);
      
      // Set user type based on profile data
      setUserType(data.user.userType || data.user.role || 'user');
      
    } catch (error) {
      console.error('Profile fetch error:', error);
      showToast('error', 'Profile Error', error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleNavigation = (route) => {
    onClose?.();
    navigation.navigate(route);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: performLogout,
        },
      ],
      { cancelable: true }
    );
  };

  const performLogout = async () => {
  try {
    // Clear all login-related data locally
    await AsyncStorage.multiRemove(['userToken', 'userData', 'isAuthenticated']);

    showToast('success', 'Logged Out', 'You have been successfully logged out');

    
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  } catch (error) {
    console.error('Logout error:', error);
    showToast('error', 'Logout Failed', 'Something went wrong. Please try again.');
  }
};

  const renderMenuItem = (item, isBottom = false) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.menuItem, isBottom && styles.bottomMenuItem]}
      onPress={() => handleNavigation(item.route)}
      activeOpacity={0.7}
    >
      <Ionicons name={item.icon} size={24} color="#315342" />
      <Text style={styles.menuText}>{item.title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#4a7c59" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#315342" />
      </SafeAreaView>
    );
  }

  const user = profileData || {
    name: 'User',
    email: 'user@example.com',
    profilePhoto: null,
    address: null
  };

  // Determine which menu items to show based on user type
  const getMenuItems = () => {
    switch(userType.toLowerCase()) {
      case 'admin':
      case 'administrator':
        return adminMenuItems;
      case 'vet':
      case 'veterinarian':
      case 'doctor':
        return vetMenuItems;
      default:
        return userMenuItems;
    }
  };

  const getSectionTitle = () => {
    switch(userType.toLowerCase()) {
      case 'admin':
      case 'administrator':
        return 'Admin Panel';
      case 'vet':
      case 'veterinarian':
      case 'doctor':
        return 'Veterinarian Dashboard';
      default:
        return 'Main Menu';
    }
  };

  const getGradientColors = () => {
    switch(userType.toLowerCase()) {
      case 'admin':
      case 'administrator':
        return ['#315342', '#1e3a2a', '#0f1d15']; // Darker green gradient for admin
      case 'vet':
      case 'veterinarian':
      case 'doctor':
        return ['#4a7c59', '#315342', '#1e3a2a']; // Medium green gradient for vets
      default:
        return ['#5d8f6a', '#4a7c59', '#315342']; // Lighter green gradient for users
    }
  };

  // const getStats = () => {
  //   switch(userType.toLowerCase()) {
  //     case 'admin':
  //     case 'administrator':
  //       return [
  //         { number: '25', label: 'Users' },
  //         { number: '12', label: 'Animals' },
  //         { number: '8', label: 'Vets' }
  //       ];
  //     case 'vet':
  //     case 'veterinarian':
  //     case 'doctor':
  //       return [
  //         { number: '42', label: 'Patients' },
  //         { number: '15', label: 'Active Cases' },
  //         { number: '128', label: 'Records' }
  //       ];
  //     default:
  //       return [
  //         { number: '12', label: 'Animals' },
  //         { number: '8', label: 'Tasks' },
  //         { number: '10', label: 'Vets' }
  //       ];
  //   }
  // };

  const currentMenuItems = getMenuItems();
  const sectionTitle = getSectionTitle();
  const gradientColors = getGradientColors();
  // const stats = getStats();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <LinearGradient
          colors={gradientColors}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color="#a4d9ab" />
          </TouchableOpacity>

          <View style={styles.profileSection}>
            <Image
              source={user.profilePhoto 
                ? { uri: user.profilePhoto } 
                : require('../assets/default-profile.png')}
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
              {(userType.toLowerCase() === 'admin' || userType.toLowerCase() === 'administrator') && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>Administrator</Text>
                </View>
              )}
              {(userType.toLowerCase() === 'vet' || userType.toLowerCase() === 'veterinarian' || userType.toLowerCase() === 'doctor') && (
                <View style={styles.vetBadge}>
                  <Text style={styles.vetBadgeText}>Veterinarian</Text>
                </View>
              )}
            </View>
          </View>

          {/* <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <React.Fragment key={index}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stat.number}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
                {index < stats.length - 1 && <View style={styles.statDivider} />}
              </React.Fragment>
            ))}
          </View> */}
        </LinearGradient>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{sectionTitle}</Text>
            {currentMenuItems.map(item => renderMenuItem(item))}
          </View>

          {/* Special Offer Banner - Hide for admin and vet */}
          {userType.toLowerCase() === 'user' && (
            <TouchableOpacity
              style={styles.offerBanner}
              onPress={() => handleNavigation('SpecialOffer')}
              activeOpacity={0.8}
            >
              {/* <LinearGradient
                colors={['rgba(93, 143, 106, 0.15)', 'rgba(49, 83, 66, 0.15)']}
                style={styles.offerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.offerContent}>
                  <Ionicons name="gift" size={32} color="#315342" />
                  <View style={styles.offerText}>
                    <Text style={styles.offerTitle}>Premium Access</Text>
                    <Text style={styles.offerSubtitle}>Upgrade to unlock all features</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={20} color="#315342" />
                </View>
              </LinearGradient> */}
            </TouchableOpacity>
          )}

          {/* Veterinarian Quick Actions */}
          {/* {(userType.toLowerCase() === 'vet' || userType.toLowerCase() === 'veterinarian' || userType.toLowerCase() === 'doctor') && (
            <View style={styles.quickActionsContainer}>
              <Text style={styles.quickActionsTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity 
                  style={styles.quickActionButton}
                  onPress={() => handleNavigation('NewCheckup')}
                >
                  <Ionicons name="add-circle" size={24} color="#315342" />
                  <Text style={styles.quickActionText}>New Checkup</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.quickActionButton, styles.emergencyButton]}
                  onPress={() => handleNavigation('EmergencyAlert')}
                >
                  <Ionicons name="alarm" size={24} color="#d32f2f" />
                  <Text style={styles.quickActionText}>Emergency</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickActionButton}
                  onPress={() => handleNavigation('PrescribeMedicine')}
                >
                  <Ionicons name="medical" size={24} color="#4a7c59" />
                  <Text style={styles.quickActionText}>Prescribe</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickActionButton}
                  onPress={() => handleNavigation('ScheduleVaccination')}
                >
                  <Ionicons name="calendar" size={24} color="#5d8f6a" />
                  <Text style={styles.quickActionText}>Schedule</Text>
                </TouchableOpacity>
              </View>
            </View>
          )} */}

          {/* Bottom Menu Items */}
          <View style={styles.bottomSection}>
            <View style={styles.divider} />
            {bottomItems.map(item => renderMenuItem(item, true))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={24} color="#d32f2f" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f7f2', // Light green background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f7f2',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 5,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 15,
    borderWidth: 3,
    borderColor: '#a4d9ab',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: '#a4d9ab',
    marginBottom: 8,
  },
  adminBadge: {
    backgroundColor: 'rgba(164, 217, 171, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#a4d9ab',
  },
  adminBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  vetBadge: {
    backgroundColor: 'rgba(164, 217, 171, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#a4d9ab',
  },
  vetBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(164, 217, 171, 0.2)',
    borderRadius: 15,
    paddingVertical: 15,
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 12,
    color: '#a4d9ab',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(164, 217, 171, 0.4)',
  },
  menuContainer: {
    paddingHorizontal: 20,
    paddingTop: 25,
  },
  menuSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#315342',
    marginBottom: 15,
    paddingLeft: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#315342',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#a4d9ab',
  },
  bottomMenuItem: {
    backgroundColor: '#f8fcf9', // Very light green
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#315342',
    marginLeft: 15,
    fontWeight: '500',
  },
  quickActionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#315342',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e8f5e8',
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#315342',
    marginBottom: 15,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#f8fcf9',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e8f5e8',
  },
  emergencyButton: {
    backgroundColor: '#fff5f5',
    borderColor: '#ffebee',
  },
  quickActionText: {
    fontSize: 12,
    color: '#315342',
    marginTop: 5,
    textAlign: 'center',
    fontWeight: '500',
  },
  offerBanner: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#315342',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  offerGradient: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  offerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offerText: {
    flex: 1,
    marginLeft: 15,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#315342',
    marginBottom: 2,
  },
  offerSubtitle: {
    fontSize: 14,
    color: '#4a7c59',
  },
  bottomSection: {
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#d4edb0',
    marginVertical: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff5f5',
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#ffcccb',
  },
  logoutText: {
    fontSize: 16,
    color: '#d32f2f',
    marginLeft: 10,
    fontWeight: '600',
  },
});

export default CustomDrawer;