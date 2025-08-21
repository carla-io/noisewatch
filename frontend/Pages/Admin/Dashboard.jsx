import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import API_BASE_URL from '../../utils/api';

const StatCard = ({ title, value, iconName, iconColor, trend, loading }) => (
  <View style={styles.statCard}>
    <View style={styles.statCardContent}>
      <View style={styles.statInfo}>
        <Text style={styles.statTitle}>{title}</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#3b82f6" />
        ) : (
          <View>
            <Text style={styles.statValue}>{value}</Text>
            {trend && <Text style={styles.statTrend}>↗ {trend}</Text>}
          </View>
        )}
      </View>
      <View style={[styles.statIcon, { backgroundColor: iconColor.bg }]}>
        <Icon name={iconName} size={24} color={iconColor.icon} />
      </View>
    </View>
  </View>
);

const Dashboard = () => {
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

  const handleRefresh = () => {
    fetchData(true);
  };

  // const handleExportReport = () => {
  //   Alert.alert(
  //     'Export Report',
  //     'Export functionality will be implemented soon.',
  //     [{ text: 'OK' }]
  //   );
  // };

  const dashboardStats = {
    totalUsers: data.users,
    totalAnimals: data.animals,
    pendingTasks: data.pendingTasks,
    completedTasks: data.completedTasks,
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorCard}>
          <Icon name="alert-circle" size={48} color="#e74c3c" />
          <Text style={styles.errorTitle}>Unable to load dashboard</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchData()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#3b82f6']}
        />
      }
    >
      {/* Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Dashboard Overview</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary]}
            onPress={handleRefresh}
            disabled={loading || refreshing}
          >
            <Text style={styles.btnSecondaryText}>
              {loading || refreshing ? 'Refreshing...' : 'Refresh'}
            </Text>
          </TouchableOpacity>
         
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Total Users"
          value={dashboardStats.totalUsers}
          iconName="users"
          iconColor={{ bg: '#dbeafe', icon: '#3b82f6' }}
          trend="+12%"
          loading={loading}
        />
        <StatCard
          title="Animals"
          value={dashboardStats.totalAnimals}
          iconName="activity"
          iconColor={{ bg: '#d1fae5', icon: '#10b981' }}
          trend="+8%"
          loading={loading}
        />
        <StatCard
          title="Pending Tasks"
          value={dashboardStats.pendingTasks}
          iconName="clock"
          iconColor={{ bg: '#fed7aa', icon: '#f97316' }}
          loading={loading}
        />
        <StatCard
          title="Completed Tasks"
          value={dashboardStats.completedTasks}
          iconName="check-circle"
          iconColor={{ bg: '#e9d5ff', icon: '#8b5cf6' }}
          trend="+24%"
          loading={loading}
        />
      </View>

      {/* Cards Section */}
      <View style={styles.cardsSection}>
        {/* Recent Tasks Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Tasks</Text>
          </View>
          <View style={styles.cardContent}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
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

        {/* System Activity Card */}
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnPrimary: {
    backgroundColor: '#3b82f6',
  },
  btnSecondary: {
    backgroundColor: '#f3f4f6',
  },
  btnPrimaryText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  btnSecondaryText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    flex: 1,
    minWidth: 150,
  },
  statCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statTitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  statTrend: {
    fontSize: 14,
    color: '#10b981',
    marginTop: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardsSection: {
    paddingHorizontal: 20,
    gap: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    padding: 20,
    paddingBottom: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cardContent: {
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 16,
  },
  noData: {
    textAlign: 'center',
    color: '#6b7280',
    padding: 32,
    fontSize: 16,
  },
  taskList: {
    gap: 16,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  taskDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  badgeGreen: {
    backgroundColor: '#d1fae5',
  },
  badgeOrange: {
    backgroundColor: '#fed7aa',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  badgeTextGreen: {
    color: '#065f46',
  },
  badgeTextOrange: {
    color: '#9a3412',
  },
  activityList: {
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: 400,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Dashboard;