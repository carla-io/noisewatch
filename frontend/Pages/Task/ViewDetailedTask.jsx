import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const ViewDetailedTask = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { task } = route.params;

  const assignedTo = task.assignedTo || {};
  const animal = task.animalId || {};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3d3d" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Task Details</Text>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="search" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Task Info */}
      <Text style={styles.heading}>📋 Task Details</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Task Type:</Text>
        <Text style={styles.value}>{task.type}</Text>

        <Text style={styles.label}>Status:</Text>
        <Text style={[styles.value, { color: task.status === 'Completed' ? '#28a745' : '#ff9900' }]}>
          {task.status}
        </Text>

        <Text style={styles.label}>Scheduled Date:</Text>
        <Text style={styles.value}>{new Date(task.scheduleDate).toLocaleDateString()}</Text>

        <Text style={styles.label}>Scheduled Times:</Text>
        <Text style={styles.value}>{task.scheduleTimes?.join(', ') || 'None'}</Text>

        <Text style={styles.label}>Recurring:</Text>
        <Text style={styles.value}>{task.isRecurring ? `Yes (${task.recurrencePattern})` : 'No'}</Text>

        {task.isRecurring && (
          <>
            <Text style={styles.label}>End Date:</Text>
            <Text style={styles.value}>{new Date(task.endDate).toLocaleDateString()}</Text>
          </>
        )}

        {task.completedAt && (
          <>
            <Text style={styles.label}>Completed At:</Text>
            <Text style={styles.value}>{new Date(task.completedAt).toLocaleString()}</Text>
          </>
        )}
      </View>

      {/* Animal Info */}
      <Text style={styles.heading}>🐄 Animal Info</Text>
      <View style={styles.card}>
        <Image source={{ uri: animal.photo }} style={styles.image} />
        <Text style={styles.label}>Name:</Text>
        <Text style={styles.value}>{animal.name}</Text>

        <Text style={styles.label}>Species:</Text>
        <Text style={styles.value}>{animal.species}</Text>

        <Text style={styles.label}>Breed:</Text>
        <Text style={styles.value}>{animal.breed || 'N/A'}</Text>

        <Text style={styles.label}>Age:</Text>
        <Text style={styles.value}>{animal.age ? `${animal.age} years` : 'N/A'}</Text>

        <Text style={styles.label}>Health Status:</Text>
        <Text
          style={[
            styles.value,
            { color: animal.status === 'needs_attention' ? '#e74c3c' : '#27ae60' },
          ]}
        >
          {animal.status}
        </Text>
      </View>


      
     
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#edf5f3',
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#1e3d3d',
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    backgroundColor: '#446A53',
    borderRadius: 50,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    marginVertical: 12,
    marginHorizontal: 20,
    color: '#1e3d3d',
  },
   modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginHorizontal: 20,
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderLeftWidth: 5,
    borderLeftColor: '#a4d9ab',
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    marginBottom: 10,
    backgroundColor: '#ccc',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 15,
    backgroundColor: '#ccc',
  },
});

export default ViewDetailedTask;