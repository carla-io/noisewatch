import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Feather } from '@expo/vector-icons';
import SeekVetModal from './SeekVetModal'; // adjust path if needed
// import { useState } from 'react';


const AnimalDetailView = ({ route, navigation }) => {
  const { animal } = route.params;
  const [behaviors, setBehaviors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSeekVetModalVisible, setSeekVetModalVisible] = useState(false);


  const fetchBehaviors = async () => {
    try {
      const res = await axios.get(`http://192.168.254.107:5000/behavior/singlebehavior/${animal._id}`);
      setBehaviors(res.data.behaviors || []);
    } catch (err) {
      console.error('Error fetching behaviors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBehaviors();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2f4f4f" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconLeft} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#a4d9ab" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconRight}>
          <Ionicons name="search" size={28} color="#a4d9ab" />
        </TouchableOpacity>
        <View style={styles.profileContainer}>
          <Image source={{ uri: animal.photo }} style={styles.profileImage} />
        </View>
      </View>

      {/* Animal Info */}
      <View style={styles.infoSection}>
        <Text style={styles.animalName}>{animal.name}</Text>
        <Text style={styles.animalSpecies}>{animal.species}</Text>

        <View style={styles.tagContainer}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{animal.age || 'Unknown'} yrs old</Text>
            <Text style={styles.tagLabel}>Age</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{animal.breed || 'Unknown'}</Text>
            <Text style={styles.tagLabel}>Breed</Text>
          </View>
          <View style={[styles.tag, animal.status === 'needs_attention' && { backgroundColor: '#ffcccc' }]}>
            <Text style={styles.tagText}>{animal.status}</Text>
            <Text style={styles.tagLabel}>Status</Text>
          </View>

        </View>
      </View>
      {animal.status === 'needs_attention' && (
        <View style={styles.seekVetContainer}>
          <TouchableOpacity
            style={styles.seekVetButton}
            onPress={() => setSeekVetModalVisible(true)}
          >
            <Feather name="alert-triangle" size={18} color="#e53e3e" />
            <Text style={styles.seekVetText}>Seek Vet</Text>
          </TouchableOpacity>
        </View>
      )}


      {/* Behavior Logs */}
      <View style={styles.behaviorSection}>
  <Text style={styles.behaviorTitle}>🐾 Animal Behavior Logs</Text>

  {loading ? (
    <ActivityIndicator size="large" color="#2f4f4f" />
  ) : behaviors.length === 0 ? (
    <Text style={styles.noBehavior}>No behavior records found.</Text>
  ) : (
    behaviors.map((log) => (
      <View key={log._id} style={styles.behaviorCard}>
        <Text style={styles.behaviorDate}>
          {new Date(log.date).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </Text>

        <View style={styles.behaviorRow}>
          <Text style={styles.iconLabel}>🍽️</Text>
          <Text style={styles.behaviorText}>Eating: {log.eating}</Text>
        </View>

        <View style={styles.behaviorRow}>
          <Text style={styles.iconLabel}>🚶</Text>
          <Text style={styles.behaviorText}>Movement: {log.movement}</Text>
        </View>

        <View style={styles.behaviorRow}>
          <Text style={styles.iconLabel}>😐</Text>
          <Text style={styles.behaviorText}>Mood: {log.mood}</Text>
        </View>

        {log.notes ? (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>📝 Notes:</Text>
            <Text style={styles.notesText}>{log.notes}</Text>
          </View>
        ) : null}
      </View>
    ))
  )}
</View>

<SeekVetModal
  visible={isSeekVetModalVisible}
  onClose={() => setSeekVetModalVisible(false)}
  selectedAnimal={animal}
/>
</ScrollView>


  );
};

export default AnimalDetailView;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f5f1',
  },
  header: {
    backgroundColor: '#2f4f4f',
    paddingTop: 40,
    paddingBottom: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    position: 'relative',
  },
  iconLeft: {
    position: 'absolute',
    left: 20,
    top: 45,
  },
  iconRight: {
    position: 'absolute',
    right: 20,
    top: 45,
  },
  profileContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: '#f2f5f1',
    marginTop: 10,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  seekVetContainer: {
  marginTop: 15,
  alignItems: 'center',
},

seekVetButton: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#ffe5e5',
  paddingVertical: 10,
  paddingHorizontal: 18,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#e53e3e',
},

seekVetText: {
  color: '#e53e3e',
  fontWeight: '600',
  fontSize: 14,
  marginLeft: 8,
},

  animalName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2f4f4f',
  },
  animalSpecies: {
    fontSize: 16,
    color: '#444',
    marginBottom: 20,
  },
  tagContainer: {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 10,                    
  marginTop: 10,
  },
  tag: {
  backgroundColor: '#c2e7c8',
  paddingVertical: 10,
  paddingHorizontal: 12,
  borderRadius: 14,
  alignItems: 'center',
  marginHorizontal: 6,
  flexShrink: 1,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2f4f4f',
  },
  tagLabel: {
    fontSize: 12,
    color: '#2f4f4f',
    opacity: 0.7,
  },
     behaviorSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    marginTop: 25,
  },
  behaviorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2f4f4f',
  },
  behaviorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderLeftWidth: 5,
    borderLeftColor: '#8ac6a4',
  },
  behaviorDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a7c59',
    marginBottom: 10,
  },
  behaviorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconLabel: {
    fontSize: 18,
    marginRight: 6,
  },
  behaviorText: {
    fontSize: 15,
    color: '#333',
  },
  notesContainer: {
    marginTop: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    padding: 10,
  },
  notesLabel: {
    fontWeight: '600',
    marginBottom: 4,
    color: '#444',
  },
  notesText: {
    fontSize: 14,
    color: '#555',
  },
  noBehavior: {
    textAlign: 'center',
    marginTop: 20,
    color: '#999',
    fontStyle: 'italic',
  },


});