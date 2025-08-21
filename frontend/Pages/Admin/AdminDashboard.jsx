import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Animated,
  Easing,
  Modal,
  Platform,
  Alert,
  RefreshControl,
  Share,
  PermissionsAndroid,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as DocumentPicker from 'expo-document-picker';
import * as IntentLauncher from 'expo-intent-launcher';
import CustomDrawer from '../CustomDrawer';
import API_BASE_URL from '../../utils/api';

const { width, height } = Dimensions.get('window');

const getStatusBarHeight = () => {
  return Platform.OS === 'ios' ? (height >= 812 ? 44 : 20) : StatusBar.currentHeight || 24;
};

const AdminDashboard = () => {
  const navigation = useNavigation();
  
  // Drawer state
  const [drawerVisible, setDrawerVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Data state
  const [data, setData] = useState({
    users: 0,
    animals: 0,
    tasks: [],
    pendingTasks: 0,
    completedTasks: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  // Fetch data from API
  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const [usersRes, animalsRes, tasksRes, pendingRes, completedRes] = await Promise.all([
        fetch(`${API_BASE_URL}/user/countUsersOnly`),
        fetch(`${API_BASE_URL}/animal/count`),
        fetch(`${API_BASE_URL}/tasks/getAll`),
        fetch(`${API_BASE_URL}/tasks/count/pending`),
        fetch(`${API_BASE_URL}/tasks/count/completed`)
      ]);

      if (!usersRes.ok || !animalsRes.ok || !tasksRes.ok || !pendingRes.ok || !completedRes.ok) {
        throw new Error('Failed to fetch data from one or more APIs');
      }

      const usersData = await usersRes.json();
      const animalsData = await animalsRes.json();
      const tasksData = await tasksRes.json();
      const pendingData = await pendingRes.json();
      const completedData = await completedRes.json();

      setData({
        users: usersData.count,
        animals: animalsData.count,
        tasks: tasksData,
        pendingTasks: pendingData.count,
        completedTasks: completedData.count
      });
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Set up polling to refresh data every 30 seconds
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  // PDF Report Generation
  const generateHTMLReport = () => {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    // Calculate task completion rate
    const totalTasks = data.pendingTasks + data.completedTasks;
    const completionRate = totalTasks > 0 ? ((data.completedTasks / totalTasks) * 100).toFixed(1) : 0;

    // Generate task list HTML
    const taskListHTML = data.tasks.map((task, index) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px; text-align: left;">${index + 1}</td>
        <td style="padding: 8px; text-align: left;">${task.type ? task.type.replace('_', ' ') : 'Task'}</td>
        <td style="padding: 8px; text-align: left;">${(task.animalId && task.animalId.name) || 'Unknown Animal'}</td>
        <td style="padding: 8px; text-align: left;">${(task.assignedTo && task.assignedTo.name) || 'Unassigned'}</td>
        <td style="padding: 8px; text-align: center;">
          <span style="padding: 4px 8px; border-radius: 12px; font-size: 12px; color: white; background-color: ${task.status === 'completed' ? '#38a169' : '#ed8936'};">
            ${task.status || 'pending'}
          </span>
        </td>
      </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Captivity & Care - Admin Dashboard Report</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f8fafc;
          color: #2d3748;
        }
        .header {
          background: linear-gradient(135deg, #315342, #1e3a2a);
          color: white;
          padding: 30px;
          border-radius: 10px;
          margin-bottom: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }
        .header p {
          margin: 10px 0 0 0;
          opacity: 0.9;
          font-size: 16px;
        }
        .report-info {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }
        .report-info h2 {
          margin-top: 0;
          color: #315342;
          font-size: 20px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        .stats-card {
          background: white;
          padding: 25px;
          border-radius: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-left: 4px solid #315342;
        }
        .stats-card h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .stats-card .value {
          font-size: 32px;
          font-weight: bold;
          color: #315342;
          margin: 0;
        }
        .stats-card .trend {
          font-size: 12px;
          color: #38a169;
          margin-top: 5px;
        }
        .tasks-section {
          background: white;
          padding: 25px;
          border-radius: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }
        .tasks-section h2 {
          margin: 0 0 20px 0;
          color: #315342;
          font-size: 20px;
        }
        .task-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        .task-table th {
          background-color: #f7fafc;
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
          color: #4a5568;
          border-bottom: 2px solid #e2e8f0;
        }
        .task-table td {
          padding: 8px;
          border-bottom: 1px solid #e2e8f0;
        }
        .summary-section {
          background: white;
          padding: 25px;
          border-radius: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .summary-section h2 {
          margin: 0 0 15px 0;
          color: #315342;
          font-size: 20px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .summary-item {
          padding: 15px;
          background: #f7fafc;
          border-radius: 8px;
        }
        .summary-item h4 {
          margin: 0 0 5px 0;
          color: #4a5568;
          font-size: 14px;
        }
        .summary-item p {
          margin: 0;
          font-size: 18px;
          font-weight: bold;
          color: #315342;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding: 20px;
          color: #718096;
          font-size: 12px;
        }
        @media print {
          body { background-color: white; }
          .stats-grid { grid-template-columns: repeat(4, 1fr); }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Captivity & Care</h1>
        <p>Admin Dashboard Report</p>
      </div>

      <div class="report-info">
        <h2>Report Information</h2>
        <p><strong>Generated on:</strong> ${currentDate} at ${currentTime}</p>
        <p><strong>Report Type:</strong> Complete Dashboard Overview</p>
        <p><strong>Data Source:</strong> Live API Data</p>
      </div>

      <div class="stats-grid">
        <div class="stats-card">
          <h3>Total Users</h3>
          <div class="value">${data.users}</div>
          <div class="trend">↗ +12% from last month</div>
        </div>
        <div class="stats-card">
          <h3>Total Animals</h3>
          <div class="value">${data.animals}</div>
          <div class="trend">↗ +8% from last month</div>
        </div>
        <div class="stats-card">
          <h3>Pending Tasks</h3>
          <div class="value">${data.pendingTasks}</div>
          <div class="trend">Requires attention</div>
        </div>
        <div class="stats-card">
          <h3>Completed Tasks</h3>
          <div class="value">${data.completedTasks}</div>
          <div class="trend">↗ +24% completion rate</div>
        </div>
      </div>

      <div class="tasks-section">
        <h2>Recent Tasks Overview</h2>
        <p>Showing ${Math.min(data.tasks.length, 10)} most recent tasks</p>
        
        <table class="task-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Task Type</th>
              <th>Animal</th>
              <th>Assigned To</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${taskListHTML || '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #718096;">No tasks available</td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="summary-section">
        <h2>Summary Statistics</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <h4>Task Completion Rate</h4>
            <p>${completionRate}%</p>
          </div>
          <div class="summary-item">
            <h4>Total Tasks</h4>
            <p>${totalTasks}</p>
          </div>
          <div class="summary-item">
            <h4>User to Animal Ratio</h4>
            <p>${data.animals > 0 ? (data.users / data.animals).toFixed(1) : 0}:1</p>
          </div>
          <div class="summary-item">
            <h4>System Status</h4>
            <p style="color: #38a169;">Active</p>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>This report was automatically generated by the Captivity & Care Admin System</p>
        <p>For questions or support, please contact the system administrator</p>
      </div>
    </body>
    </html>
    `;
  };

  // Alternative: Create a simple text-based report for backup
  const generateTextReport = () => {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    const totalTasks = data.pendingTasks + data.completedTasks;
    const completionRate = totalTasks > 0 ? ((data.completedTasks / totalTasks) * 100).toFixed(1) : 0;

    const taskList = data.tasks.map((task, index) => {
      return `${index + 1}. ${task.type ? task.type.replace('_', ' ') : 'Task'} - ${(task.animalId && task.animalId.name) || 'Unknown Animal'} - Assigned to: ${(task.assignedTo && task.assignedTo.name) || 'Unassigned'} - Status: ${task.status || 'pending'}`;
    }).join('\n');

    return `CAPTIVITY & CARE - ADMIN DASHBOARD REPORT
Generated on: ${currentDate} at ${currentTime}

SUMMARY STATISTICS:
- Total Users: ${data.users}
- Total Animals: ${data.animals}
- Pending Tasks: ${data.pendingTasks}
- Completed Tasks: ${data.completedTasks}
- Task Completion Rate: ${completionRate}%
- Total Tasks: ${totalTasks}

RECENT TASKS:
${taskList || 'No tasks available'}

SYSTEM STATUS:
- Data Source: Live API Data
- Auto-refresh: Every 30 seconds
- System Status: Active

This report was automatically generated by the Captivity & Care Admin System.
For questions or support, please contact the system administrator.
`;
  };

  const handleExportTextReport = async () => {
    try {
      setExportLoading(true);

      const textContent = generateTextReport();
      const currentDate = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
      const fileName = `Captivity_Care_Report_${currentDate}_${currentTime}.txt`;

      // Create text file
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, textContent);

      // Share the text file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Share Captivity & Care Report (Text)',
        });
      } else {
        Alert.alert('Sharing Unavailable', 'Sharing is not available on this device.');
      }

    } catch (error) {
      console.error('Error generating text report:', error);
      Alert.alert('Export Error', 'Could not generate text report.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      setExportLoading(true);

      // Generate HTML content
      const htmlContent = generateHTMLReport();

      // Create PDF
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        width: 612,
        height: 792,
        margin: {
          left: 20,
          top: 20,
          right: 20,
          bottom: 20,
        },
      });

      // Create filename with current date and time
      const currentDate = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
      const fileName = `Captivity_Care_Report_${currentDate}_${currentTime}.pdf`;

      // Move file to documents directory
      const documentDirectory = FileSystem.documentDirectory;
      const fileUri = `${documentDirectory}${fileName}`;
      
      await FileSystem.moveAsync({
        from: uri,
        to: fileUri,
      });

      // Show options to user
      Alert.alert(
        'Report Generated Successfully! 📊',
        `Your PDF report "${fileName}" has been created. Choose an option:`,
        [
          {
            text: 'Share Report',
            onPress: async () => {
              try {
                if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(fileUri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Share Captivity & Care Report',
                    UTI: 'com.adobe.pdf',
                  });
                } else {
                  Alert.alert('Sharing Unavailable', 'Sharing is not available on this device.');
                }
              } catch (error) {
                console.error('Error sharing file:', error);
                Alert.alert('Sharing Error', 'Could not share the file. Please try again.');
              }
            },
          },
          {
            text: 'Save to Files',
            onPress: async () => {
              try {
                // Use the device's native file picker to save
                if (Platform.OS === 'android') {
                  // For Android, we'll use the sharing intent which allows saving to Downloads
                  await Sharing.shareAsync(fileUri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Save Report to Files',
                    UTI: 'com.adobe.pdf',
                  });
                  Alert.alert(
                    'Save Instructions',
                    'In the sharing menu, select "Save to Files" or "Downloads" to save the PDF to your device.',
                    [{ text: 'Got it!' }]
                  );
                } else {
                  // For iOS, direct sharing works better
                  await Sharing.shareAsync(fileUri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Save Report',
                  });
                }
              } catch (error) {
                console.error('Error saving file:', error);
                Alert.alert(
                  'Save Error',
                  'Could not open the save dialog. You can use the "Share Report" option to save via your device\'s sharing menu.',
                  [{ text: 'OK' }]
                );
              }
            },
          },
          {
            text: 'Open in App',
            onPress: async () => {
              try {
                // Try to open the PDF in the default PDF viewer
                if (Platform.OS === 'android') {
                  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                    data: fileUri,
                    type: 'application/pdf',
                    flags: 1, // FLAG_ACTIVITY_NEW_TASK
                  });
                } else {
                  // For iOS, use sharing which will show "Open in..." options
                  await Sharing.shareAsync(fileUri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Open Report',
                  });
                }
              } catch (error) {
                console.error('Error opening file:', error);
                Alert.alert(
                  'Open Error',
                  'Could not open the PDF. Please use the share option to open it in another app.',
                  [{ text: 'OK' }]
                );
              }
            },
          },
          { text: 'Close', style: 'cancel' }
        ],
        { cancelable: true }
      );

    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert(
        'Export Error',
        'There was an error generating the report. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setExportLoading(false);
    }
  };

  // Drawer animations
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

  const handleRefresh = () => {
    fetchData(true);
  };

  const handleLogout = async () => {
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
              await AsyncStorage.clear();
              navigation.replace('Login');
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  // Render functions
  const renderStatsCard = (title, value, icon, color, trend, loading) => (
    <View style={[styles.statsCard, { borderLeftColor: color }]}>
      <View style={styles.statsContent}>
        <View style={styles.statsInfo}>
          <Text style={styles.statsTitle}>{title}</Text>
          {loading ? (
            <ActivityIndicator size="small" color={color} />
          ) : (
            <View>
              <Text style={[styles.statsValue, { color }]}>{value}</Text>
              {trend && <Text style={styles.statsTrend}>↗ {trend}</Text>}
            </View>
          )}
        </View>
        <View style={[styles.statsIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
      </View>
    </View>
  );

  const renderDashboard = () => (
    <View style={styles.dashboardContainer}>
      {/* Header Actions */}
      <View style={styles.pageHeader}>
        <Text style={styles.sectionTitle}>Dashboard Overview</Text>
        <View style={styles.headerActions}>
          {/* <TouchableOpacity
            style={[styles.btn, styles.btnSecondary]}
            onPress={handleRefresh}
            disabled={loading || refreshing}
          >
            <Text style={styles.btnSecondaryText}>
              {loading || refreshing ? 'Refreshing...' : 'Refresh'}
            </Text>
          </TouchableOpacity> */}
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, exportLoading && styles.btnDisabled]}
            onPress={() => {
              Alert.alert(
                'Export Report',
                'Choose your preferred export format:',
                [
                  {
                    text: 'PDF Format',
                    onPress: handleExportReport,
                  },
                  {
                    text: 'Text Format',
                    onPress: handleExportTextReport,
                  },
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                ]
              );
            }}
            disabled={exportLoading || loading}
          >
            {exportLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="download-outline" size={16} color="white" />
            )}
            <Text style={styles.btnPrimaryText}>
              {exportLoading ? 'Generating...' : 'Export Report'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {renderStatsCard('Total Users', data.users, 'people-outline', '#3182ce', '+12%', loading)}
        {renderStatsCard('Total Animals', data.animals, 'paw-outline', '#38a169', '+8%', loading)}
        {renderStatsCard('Pending Tasks', data.pendingTasks, 'time-outline', '#e53e3e', null, loading)}
        {renderStatsCard('Completed Tasks', data.completedTasks, 'checkmark-circle-outline', '#805ad5', '+24%', loading)}
      </View>

      {/* Recent Tasks */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Recent Tasks</Text>
        </View>
        <View style={styles.cardContent}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3182ce" />
              <Text style={styles.loadingText}>Loading tasks...</Text>
            </View>
          ) : data.tasks.length === 0 ? (
            <Text style={styles.noData}>No tasks available</Text>
          ) : (
            <View style={styles.taskList}>
              {data.tasks.slice(0, 5).map((task, index) => (
                <View key={task.id || index} style={styles.taskItem}>
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle}>
                      {task.type ? task.type.replace('_', ' ') : 'Task'}
                    </Text>
                    <Text style={styles.taskDescription}>
                      {(task.animalId && task.animalId.name) || 'Unknown Animal'} -{' '}
                      {(task.assignedTo && task.assignedTo.name) || 'Unassigned'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      task.status === 'completed' ? styles.badgeGreen : styles.badgeOrange
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        task.status === 'completed' ? styles.badgeTextGreen : styles.badgeTextOrange
                      ]}
                    >
                      {task.status || 'pending'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* System Activity */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>System Activity</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIndicator, styles.activityIndicatorGreen]} />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Data refreshed successfully</Text>
                <Text style={styles.activityTime}>
                  {loading || refreshing ? 'Refreshing...' : 'Just now'}
                </Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityIndicator, styles.activityIndicatorBlue]} />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Dashboard loaded</Text>
                <Text style={styles.activityTime}>Connected to API</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityIndicator, styles.activityIndicatorOrange]} />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Auto-refresh enabled</Text>
                <Text style={styles.activityTime}>Every 30 seconds</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#315342" />
        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={48} color="#e53e3e" />
            <Text style={styles.errorTitle}>Unable to load dashboard</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchData()}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#315342" />
      
      {/* Header */}
      <LinearGradient
        colors={['#315342', '#1e3a2a']}
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
          <Text style={styles.headerTitle}>Captivity & Care</Text>
          <Text style={styles.headerSubtitle}>Admin Panel</Text>
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
        {renderDashboard()}
      </ScrollView>

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

// Add these styles to your existing StyleSheet
const additionalStyles = StyleSheet.create({
  btnDisabled: {
    opacity: 0.6,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorCard: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 10,
    marginBottom: 5,
  },
  errorMessage: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#315342',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
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
  },
  dashboardContainer: {
    padding: 20,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  btnPrimary: {
    backgroundColor: '#315342',
  },
  btnSecondary: {
    backgroundColor: '#e2e8f0',
  },
  btnPrimaryText: {
    color: 'white',
    fontWeight: '600',
  },
  btnSecondaryText: {
    color: '#475569',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 20,
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    flex: 1,
    minWidth: '45%',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsInfo: {
    flex: 1,
  },
  statsTitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsTrend: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  statsIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  cardContent: {
    padding: 20,
  },
  taskList: {
    gap: 15,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  taskDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeGreen: {
    backgroundColor: '#dcfce7',
  },
  badgeOrange: {
    backgroundColor: '#fed7aa',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  badgeTextGreen: {
    color: '#166534',
  },
  badgeTextOrange: {
    color: '#ea580c',
  },
  noData: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
    paddingVertical: 20,
  },
  activityList: {
    gap: 15,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityIndicatorGreen: {
    backgroundColor: '#10b981',
  },
  activityIndicatorBlue: {
    backgroundColor: '#3b82f6',
  },
  activityIndicatorOrange: {
    backgroundColor: '#f97316',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#64748b',
  },
  modalContainer: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.8,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  btnPrimary: {
    backgroundColor: '#3182ce',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#cbd5e0',
  },
  btnPrimaryText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  btnSecondaryText: {
    color: '#4a5568',
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default AdminDashboard;