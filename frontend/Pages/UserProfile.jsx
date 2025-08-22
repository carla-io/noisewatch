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
  const [stats, setStats] = useState({
    totalReports: 45,
    hoursMonitored: 234,
    avgNoiseLevel: 68,
    contributions: 12
  });

  // Mock achievements data
  const achievements = [
    { id: 1, title: 'First Report', description: 'Submitted your first noise report', icon: 'trophy', earned: true },
    { id: 2, title: 'Community Helper', description: 'Made 10+ contributions', icon: 'people', earned: true },
    { id: 3, title: 'Long Listener', description: '100+ hours of monitoring', icon: 'time', earned: true },
    { id: 4, title: 'Expert Reporter', description: '50+ detailed reports', icon: 'document-text', earned: false },
  ];

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
      
    } catch (error) {
      console.error('Profile fetch error:', error);
      showToast('error', 'Profile Error', error.message || 'Failed to load profile');
      
      // If authentication failed, redirect to login
      if (error.message.includes('authentication') || error.message.includes('token')) {
        navigation.replace('Login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
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
    // Navigate to edit profile when implemented
    showToast('info', 'Coming Soon', 'Edit profile feature will be available soon');
  };

  const handleSettings = () => {
    // Navigate to settings when implemented
    showToast('info', 'Coming Soon', 'Settings feature will be available soon');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
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
          },
        },
      ]
    );
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
          <TouchableOpacity
            onPress={handleSettings}
            style={styles.settingsButton}
          >
            <Ionicons name="settings-outline" size={24} color="#FFF8DC" />
          </TouchableOpacity>
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
              <Text style={styles.profileName}>{user.name}</Text>
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

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>📊 My Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="document-text" size={24} color="#8B4513" />
              </View>
              <Text style={styles.statNumber}>{stats.totalReports}</Text>
              <Text style={styles.statLabel}>Reports Made</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="time" size={24} color="#D4AC0D" />
              </View>
              <Text style={styles.statNumber}>{stats.hoursMonitored}</Text>
              <Text style={styles.statLabel}>Hours Monitored</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="analytics" size={24} color="#8B7355" />
              </View>
              <Text style={styles.statNumber}>{stats.avgNoiseLevel}dB</Text>
              <Text style={styles.statLabel}>Avg Exposure</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="people" size={24} color="#B7950B" />
              </View>
              <Text style={styles.statNumber}>{stats.contributions}</Text>
              <Text style={styles.statLabel}>Contributions</Text>
            </View>
          </View>
        </View>

        {/* Achievements Section */}
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>🏆 Achievements</Text>
          <View style={styles.achievementsList}>
            {achievements.map((achievement) => (
              <View key={achievement.id} style={[
                styles.achievementCard,
                { opacity: achievement.earned ? 1 : 0.5 }
              ]}>
                <View style={[
                  styles.achievementIcon,
                  { backgroundColor: achievement.earned ? '#D4AC0D' : '#DDD' }
                ]}>
                  <Ionicons 
                    name={achievement.icon} 
                    size={24} 
                    color={achievement.earned ? '#8B4513' : '#999'} 
                  />
                </View>
                <View style={styles.achievementInfo}>
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  <Text style={styles.achievementDescription}>{achievement.description}</Text>
                </View>
                {achievement.earned && (
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>⚙️ Account</Text>
          
          <TouchableOpacity style={styles.actionItem} onPress={() => showToast('info', 'Coming Soon', 'My History feature will be available soon')}>
            <View style={styles.actionIcon}>
              <Ionicons name="time-outline" size={24} color="#8B4513" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>My History</Text>
              <Text style={styles.actionDescription}>View all your reports and recordings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D4AC0D" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => showToast('info', 'Coming Soon', 'Notifications feature will be available soon')}>
            <View style={styles.actionIcon}>
              <Ionicons name="notifications-outline" size={24} color="#8B4513" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Notifications</Text>
              <Text style={styles.actionDescription}>Manage your alert preferences</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D4AC0D" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => showToast('info', 'Coming Soon', 'Personal Analytics feature will be available soon')}>
            <View style={styles.actionIcon}>
              <Ionicons name="analytics-outline" size={24} color="#8B4513" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Personal Analytics</Text>
              <Text style={styles.actionDescription}>Detailed noise exposure analysis</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D4AC0D" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={handleSettings}>
            <View style={styles.actionIcon}>
              <Ionicons name="settings-outline" size={24} color="#8B4513" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Settings</Text>
              <Text style={styles.actionDescription}>Privacy, thresholds, and preferences</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D4AC0D" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionItem, styles.logoutItem]} onPress={handleLogout}>
            <View style={[styles.actionIcon, { backgroundColor: '#FFF5F5' }]}>
              <Ionicons name="log-out-outline" size={24} color="#E74C3C" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={[styles.actionTitle, { color: '#E74C3C' }]}>Logout</Text>
              <Text style={styles.actionDescription}>Sign out of your account</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#E74C3C" />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  settingsButton: {
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
  statsSection: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFACD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  achievementsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  achievementsList: {
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666',
  },
  actionsSection: {
    marginHorizontal: 20,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#E74C3C',
  },
  actionIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#FFFACD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default UserProfile;