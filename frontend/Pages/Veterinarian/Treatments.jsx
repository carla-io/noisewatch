import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Treatments = () => {
  return (
    <View style={styles.container}>
      <Ionicons name="medical-outline" size={48} color="#315342" />
      <Text style={styles.title}>Treatments & Medications</Text>
      <Text style={styles.subtitle}>Manage animal treatments and medication records</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#315342',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default Treatments;