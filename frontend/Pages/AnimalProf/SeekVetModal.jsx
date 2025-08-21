import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import axios from 'axios';
import { X } from 'lucide-react-native';
import API_BASE_URL from '../../utils/api';
import RNPickerSelect from 'react-native-picker-select';


const SeekVetModal = ({ visible, onClose, selectedAnimal }) => {
  const [vets, setVets] = useState([]);
  const [selectedVetId, setSelectedVetId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [assignedVet, setAssignedVet] = useState(null);

  useEffect(() => {
    if (visible && selectedAnimal) {
      fetchVets();
      fetchAssignment();
    }
  }, [visible]);

const fetchVets = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/user/getAllVetsOnly`);
    console.log('Vets API response:', res.data);

    setVets(Array.isArray(res.data.users) ? res.data.users : []);
  } catch (err) {
    console.error('Error fetching vets:', err);
    setVets([]);
  }
};



  const fetchAssignment = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/behaviors/assigned-vet/${animalId}`);
      setAssignedVet(res.data.vet);
    } catch (err) {
      console.log('No assignment found.');
    }
  };

  const handleAssign = async () => {
    if (!selectedVetId || !reason) {
      alert('Please select a vet and provide a reason.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('http://YOUR_IP:5000/behavior/assign-vet', {
        animalId: selectedAnimal._id,
        vetId: selectedVetId,
        reason
      });

      alert('Vet assigned successfully');
      onClose();
    } catch (err) {
      alert('Error assigning vet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Seek Veterinarian</Text>
            <TouchableOpacity onPress={onClose}><X color="black" /></TouchableOpacity>
          </View>

          <Text style={styles.label}>Animal Name: {selectedAnimal.name}</Text>
          <Text style={styles.label}>Status: {selectedAnimal.status}</Text>
          <Text style={styles.label}>
            Assignment: {assignedVet ? assignedVet.name : 'None'}
          </Text>

          <Text style={styles.label}>Select Vet:</Text>
        <View style={styles.dropdownContainer}>
        <RNPickerSelect
            onValueChange={(value) => setSelectedVetId(value)}
            value={selectedVetId}
            placeholder={{ label: 'Choose a veterinarian...', value: null }}
            items={vets.map(vet => ({
            label: vet.name,
            value: vet._id
            }))}
            style={{
            inputIOS: styles.dropdown,
            inputAndroid: styles.dropdown,
            }}
        />
        </View>

          <TextInput
            placeholder="Reason for seeking vet"
            value={reason}
            onChangeText={setReason}
            style={styles.input}
          />

          <TouchableOpacity
            style={styles.assignButton}
            onPress={handleAssign}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.assignButtonText}>Assign Vet</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, justifyContent: 'center', backgroundColor: '#00000088' },
  modalContainer: { margin: 20, padding: 20, borderRadius: 10, backgroundColor: 'white' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold' },
  label: { marginTop: 10 },
  vetList: { maxHeight: 120, marginVertical: 10 },
  input: { borderWidth: 1, padding: 8, borderRadius: 5, marginVertical: 10 },
  assignButton: { backgroundColor: '#007bff', padding: 12, borderRadius: 5, alignItems: 'center' },
  assignButtonText: { color: 'white' }
});

export default SeekVetModal;