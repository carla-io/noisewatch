import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  StatusBar,
  Dimensions,
  Platform,
  Easing,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import CustomDrawer from './CustomDrawer';
import API_BASE_URL from '../utils/api'; 
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const getStatusBarHeight = () => {
  return Platform.OS === 'ios' ? (height >= 812 ? 44 : 20) : StatusBar.currentHeight || 24;
};

const Home = ({ navigation }) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [taskStats, setTaskStats] = useState({ completed: 0, pending: 0 });
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  // const [recentLogs, setRecentLogs] = useState([]);
  const [behaviorSummary, setBehaviorSummary] = useState([]);
   const [chartLabels, setChartLabels] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
  const loadUserAndStats = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) {
      console.log("📦 Raw userData from AsyncStorage:", userData);
      console.log("🆔 userId from AsyncStorage:", userData._id);

        console.warn('❌ No userData found in AsyncStorage.');
        return;
      }

      const userData = JSON.parse(userDataString);
      setUserName(userData.name);
      setUserId(userData._id);

      // Fetch stats here after getting userId
      const [completedRes, pendingRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/tasks/count/completed/${userData._id}`),
        axios.get(`${API_BASE_URL}/tasks/count/pending/${userData._id}`)
      ]);

      console.log("✅ Completed count:", completedRes.data.count);
      console.log("🕒 Pending count:", pendingRes.data.count);

      setTaskStats({
        completed: completedRes.data.count,
        pending: pendingRes.data.count
      });
    } catch (error) {
      console.error('❌ Failed to load user or stats:', error.response?.data || error.message);
    }
  };

  loadUserAndStats();
}, []);




  useEffect(() => {
  if (behaviorSummary.length === 0) {
    setChartLabels([]);
    setChartData([]);
    return;
  }

  const dailyCounts = {}; // key: date string, value: counts

  behaviorSummary.forEach(entry => {
    const day = entry.date.slice(5); // MM-DD format

    if (!dailyCounts[day]) {
      dailyCounts[day] = {
        eatingNormal: 0,
        moodAggressive: 0,
        movementLimping: 0,
      };
    }

    // Add counts if exist, else 0
    dailyCounts[day].eatingNormal += entry.eating?.Normal || 0;
    dailyCounts[day].moodAggressive += entry.mood?.Aggressive || 0;
    dailyCounts[day].movementLimping += entry.movement?.Limping || 0;
  });

  const labels = Object.keys(dailyCounts).sort();
  const data = labels.map(day => dailyCounts[day]);

  setChartLabels(labels);
  setChartData(data);

}, [behaviorSummary]);

useEffect(() => {
  const fetchBehaviorSummary = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/behavior/summary?range=7`);
      console.log("📊 Behavior Summary Fetched:", res.data);
      setBehaviorSummary(res.data.data);
    } catch (error) {
      console.error("❌ Failed to fetch behavior summary:", error.response?.data || error.message);
    }
  };

  fetchBehaviorSummary();
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
      }),
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
      }),
    ]).start(() => setDrawerVisible(false));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#315342" />
      
      {/* Header Section */}
      <LinearGradient colors={['#315342', '#1e3a2a']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={openDrawer} style={styles.headerButton}>
              <Ionicons name="menu" size={28} color="#a4d9ab" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Search')} style={styles.headerButton}>
              <Ionicons name="search" size={28} color="#a4d9ab" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>
            Welcome back{userName ? `, ${userName}` : ''}!
          </Text>
          <Text style={styles.headerSubtitle}>Let's keep your animals happy and healthy today.</Text>
        </View>
      </LinearGradient>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.taskSummaryContainer}>
          <Text style={styles.taskTitle}>📋 Task Overview</Text>
          <View style={styles.taskBoxes}>
            <View style={[styles.taskBox, { backgroundColor: '#a7f3d0' }]}>
              <Ionicons name="checkmark-circle" size={28} color="#065f46" />
              <Text style={styles.taskCount}>{taskStats.completed}</Text>
              <Text style={styles.taskLabel}>Completed</Text>
            </View>
            <View style={[styles.taskBox, { backgroundColor: '#fde68a' }]}>
              <Ionicons name="time" size={28} color="#92400e" />
              <Text style={styles.taskCount}>{taskStats.pending ?? 0}</Text>
              <Text style={styles.taskLabel}>Pending</Text>
            </View>
          </View>
        </View>

        <View style={styles.behaviorSection}>
          <Text style={styles.sectionTitle}>📊 Animal Behavior Trends (7 days)</Text>
          {chartData.length > 0 ? (
        <View>
  <LineChart
    data={{
      labels: chartLabels,
      datasets: [
        {
          data: chartData.map(item => item.eatingNormal),
          color: () => '#22c55e',
          strokeWidth: 2,
        },
        {
          data: chartData.map(item => item.moodAggressive),
          color: () => '#ef4444',
          strokeWidth: 2,
        },
        {
          data: chartData.map(item => item.movementLimping),
          color: () => '#eab308',
          strokeWidth: 2,
        },
      ],
      // legend removed
    }}
    width={Dimensions.get('window').width - 30}
    height={220}
    chartConfig={{
      backgroundColor: '#f0fdf4',
      backgroundGradientFrom: '#dcfce7',
      backgroundGradientTo: '#bbf7d0',
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(0, 100, 0, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(34, 34, 34, ${opacity})`,
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: '4',
        strokeWidth: '1',
        stroke: '#22c55e',
      },
    }}
    bezier
    style={{
      marginVertical: 10,
      borderRadius: 16,
      paddingBottom: 20,
    }}
  />


  {/* Wrap siblings */}
  <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 }}>
    <Text style={{ fontSize: 10, color: '#22c55e' }}>Eating: Normal</Text>
    <Text style={{ fontSize: 10, color: '#ef4444' }}>Mood: Aggressive</Text>
    <Text style={{ fontSize: 10, color: '#eab308' }}>Movement: Limping</Text>
  </View>
</View>



        ) : (
          <Text style={{ color: '#555', paddingTop: 10 }}>No behavior data yet.</Text>
        )}

        </View>

      </Animated.ScrollView>

      {/* Drawer Modal */}
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingBottom: 30,
    paddingTop: getStatusBarHeight(),
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(164, 217, 171, 0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  behaviorSection: {
  marginTop: 20,
  paddingHorizontal: 20,
},
sectionTitle: {
  fontSize: 20,
  fontWeight: '600',
  color: '#333',
  marginBottom: 10,
},
behaviorCard: {
  backgroundColor: '#f0fdf4',
  borderRadius: 12,
  padding: 12,
  marginBottom: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 3,
  elevation: 2,
},
animalName: {
  fontWeight: '700',
  fontSize: 16,
  color: '#1e3a2a',
},
behaviorTime: {
  fontSize: 12,
  color: '#666',
},
behaviorDetails: {
  fontSize: 14,
  marginTop: 4,
  color: '#374151',
},
alertText: {
  marginTop: 6,
  color: 'red',
  fontWeight: 'bold',
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
  taskSummaryContainer: {
  padding: 16,
  marginTop: -19,
  backgroundColor: '#fff',
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.2,
  shadowRadius: 6,
  elevation: 6
},
taskTitle: {
  fontSize: 18,
  fontWeight: '600',
  marginBottom: 12,
  color: '#1f2937'
},
scrollView: {
  flex: 1,
  paddingTop: 18, // Adjust based on your header height
  backgroundColor: '#f8f9fa',
},
taskBoxes: {
  flexDirection: 'row',
  justifyContent: 'space-between',
},
taskBox: {
  flex: 1,
  alignItems: 'center',
  padding: 16,
  marginHorizontal: 6,
  borderRadius: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 2
},
taskCount: {
  fontSize: 24,
  fontWeight: 'bold',
  color: '#1e293b',
  marginTop: 8
},
taskLabel: {
  fontSize: 14,
  color: '#374151'
},
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export default Home;
