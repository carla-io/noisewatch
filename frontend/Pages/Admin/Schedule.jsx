import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal,
  Animated,
  Easing,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import axios from 'axios';
import API_BASE_URL from '../../utils/api';
import CustomDrawer from '../CustomDrawer';

const { width } = Dimensions.get('window');

const AnimalCalendar = ({ navigation }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [showEventsModal, setShowEventsModal] = useState(false);
  
  // Drawer state
  const [drawerVisible, setDrawerVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tasks/getTask`);
      setEvents(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching calendar tasks:', error);
      Alert.alert('Error', 'Failed to fetch calendar tasks');
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => navigation.navigate('Login') }
      ]
    );
  };

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

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getEventsForDate = (day) => {
    if (!day) return [];
    
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    return events.filter(event => {
      const eventDate = new Date(event.start || event.date);
      const eventDateStr = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
      return eventDateStr === dateStr;
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'in-progress':
        return '#3b82f6';
      default:
        return '#315342';
    }
  };

  const getTypeIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'feeding':
        return '🍽️';
      case 'medical':
        return '🏥';
      case 'grooming':
        return '✂️';
      case 'exercise':
        return '🏃';
      default:
        return '📋';
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    );
  };

  const handleDatePress = (day) => {
    if (!day) return;
    const dayEvents = getEventsForDate(day);
    setSelectedDate(day);
    setSelectedDateEvents(dayEvents);
    if (dayEvents.length > 0) {
      setShowEventsModal(true);
    }
  };

  const renderModalEvent = (event, index) => {
    const { extendedProps } = event;
    const animal = extendedProps?.animal || {};
    const assignedTo = extendedProps?.assignedTo || event.assignedTo || 'Unassigned';
    const status = extendedProps?.status || event.status || 'pending';
    const type = event.title?.split(' - ')[0] || event.type || 'Task';

    return (
      <View key={`modal-event-${event.id || index}`} style={[styles.modalEventCard, { borderLeftColor: getStatusColor(status) }]}>
        <View style={styles.modalEventHeader}>
          <Text style={styles.modalEventIcon}>{getTypeIcon(type)}</Text>
          <Text style={styles.modalEventType}>{type}</Text>
          <View style={[styles.modalStatusBadge, { backgroundColor: getStatusColor(status) }]}>
            <Text style={styles.modalStatusText}>{status}</Text>
          </View>
        </View>
        
        {/* Show animal info if available */}
        {(animal.name || animal.species || animal.photo) && (
          <View style={styles.modalEventBody}>
            {animal.photo && (
              <Image
                source={{ uri: animal.photo }}
                style={styles.modalAnimalPhoto}
              />
            )}
            <View style={styles.modalAnimalInfo}>
              <Text style={styles.modalAnimalName}>{animal.name || 'Unknown Animal'}</Text>
              <Text style={styles.modalAnimalSpecies}>{animal.species || 'Unknown Species'}</Text>
            </View>
          </View>
        )}
        
        {/* Show description if available */}
        {event.description && (
          <Text style={styles.modalEventDescription}>{event.description}</Text>
        )}
        
        <Text style={styles.modalAssignedTo}>👤 Assigned to: {assignedTo}</Text>
        
        {/* Show time if available */}
        {event.time && (
          <Text style={styles.modalEventTime}>⏰ Time: {event.time}</Text>
        )}
      </View>
    );
  };

  const renderEventDot = (event, index) => {
    const { extendedProps } = event;
    const status = extendedProps?.status || '';
    
    return (
      <View 
        key={`dot-${event.id || index}`} 
        style={[styles.eventDot, { backgroundColor: getStatusColor(status) }]} 
      />
    );
  };

  const renderDay = (day, index) => {
    const dayEvents = getEventsForDate(day);
    const isCurrentDay = isToday(day);
    
    // Create unique key using year, month, and either day or index for empty cells
    const uniqueKey = `day-${currentDate.getFullYear()}-${currentDate.getMonth()}-${day || `empty-${index}`}`;

    return (
      <TouchableOpacity
        key={uniqueKey}
        style={[
          styles.dayCell,
          isCurrentDay && styles.todayCell,
          !day && styles.emptyCell,
          dayEvents.length > 0 && styles.dayCellWithEvents
        ]}
        onPress={() => handleDatePress(day)}
        disabled={!day}
      >
        {day && (
          <>
            <Text style={[styles.dayNumber, isCurrentDay && styles.todayNumber]}>
              {day}
            </Text>
            
            {dayEvents.length > 0 && (
              <View style={styles.eventDotsContainer}>
                {dayEvents.slice(0, 3).map(renderEventDot)}
                {dayEvents.length > 3 && (
                  <Text style={styles.moreEventsText}>+{dayEvents.length - 3}</Text>
                )}
              </View>
            )}
          </>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#315342" />
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    );
  }

  const days = getDaysInMonth(currentDate);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#315342', '#4a7c59']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={openDrawer} style={styles.headerButton}>
              <Ionicons name="menu" size={28} color="#a4d9ab" />
            </TouchableOpacity>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.headerButton}>
                <Ionicons name="notifications-outline" size={28} color="#a4d9ab" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
                <Ionicons name="log-out-outline" size={28} color="#a4d9ab" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.headerTitle}>Animal Task Calendar</Text>
          <Text style={styles.headerSubtitle}>Manage and track all animal care tasks</Text>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#315342']}
          />
        }
      >
        {/* Calendar Container */}
        <View style={styles.calendarContainer}>
          {/* Calendar Header */}
          <View style={styles.calendarHeader}>
            <View style={styles.navigationContainer}>
              <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth(-1)}>
                <Text style={styles.navButtonText}>←</Text>
              </TouchableOpacity>
              
              <Text style={styles.monthTitle}>
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </Text>
              
              <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth(1)}>
                <Text style={styles.navButtonText}>→</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Today Button - Moved below header */}
          <View style={styles.todayButtonContainer}>
            <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
              <Text style={styles.todayButtonText}>Go to Today</Text>
            </TouchableOpacity>
          </View>

          {/* Days of Week Header */}
          <View style={styles.daysOfWeekContainer}>
            {daysOfWeek.map((day) => (
              <View key={day} style={styles.dayOfWeekCell}>
                <Text style={styles.dayOfWeekText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {days.map(renderDay)}
          </View>
        </View>
      </ScrollView>

      {/* Events Modal */}
      <Modal
        visible={showEventsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEventsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Tasks for {months[currentDate.getMonth()]} {selectedDate}, {currentDate.getFullYear()}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowEventsModal(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              {selectedDateEvents.length > 0 ? (
                selectedDateEvents.map(renderModalEvent)
              ) : (
                <Text style={styles.noEventsText}>No tasks scheduled for this day</Text>
              )}
            </ScrollView>
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
    backgroundColor: '#f8fffe',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fffe',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#315342',
  },
  header: {
    paddingBottom: 30,
    paddingTop: getStatusBarHeight(),
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    backgroundColor: '#315342',
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerButton: {
    padding: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#a4d9ab',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8fffe',
    paddingTop: 20,
  },
  calendarContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButton: {
    backgroundColor: '#315342',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 8,
  },
  navButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  monthTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#315342',
    marginHorizontal: 20,
    minWidth: 200,
    textAlign: 'center',
  },
  todayButtonContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  todayButton: {
    backgroundColor: '#A4D9AB',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: '#315342',
  },
  todayButtonText: {
    color: '#315342',
    fontSize: 16,
    fontWeight: '600',
  },
  daysOfWeekContainer: {
    flexDirection: 'row',
    backgroundColor: '#A4D9AB',
  },
  dayOfWeekCell: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  dayOfWeekText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#315342',
    letterSpacing: 0.5,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: (width - 32) / 7,
    height: 80,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  todayCell: {
    backgroundColor: '#f0f9f7',
    borderColor: '#315342',
    borderWidth: 2,
  },
  emptyCell: {
    backgroundColor: '#f9fafb',
  },
  dayCellWithEvents: {
    backgroundColor: '#fdfffe',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  todayNumber: {
    color: '#315342',
    fontWeight: '700',
  },
  eventDotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    margin: 1,
  },
  moreEventsText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#315342',
    flex: 1,
  },
  closeButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalScrollView: {
    maxHeight: 500,
    paddingBottom: 20,
  },
  modalEventCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    minHeight: 120,
  },
  modalEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalEventIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  modalEventType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#315342',
    flex: 1,
  },
  modalStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  modalStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
  },
  modalEventBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalAnimalPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#A4D9AB',
  },
  modalAnimalInfo: {
    flex: 1,
  },
  modalAnimalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#315342',
    marginBottom: 4,
  },
  modalAnimalSpecies: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalAssignedTo: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  modalEventDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 20,
  },
  modalEventTime: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  noEventsText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    padding: 40,
  },
  
  // Drawer Styles
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
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default AnimalCalendar;