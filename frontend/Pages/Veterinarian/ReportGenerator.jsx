import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_BASE_URL from '../../utils/api';
import { showToast } from '../../utils/toast';

const ReportGenerator = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [animals, setAnimals] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [reportType, setReportType] = useState('comprehensive');
  const [dateRange, setDateRange] = useState('all');
  const [showAnimalModal, setShowAnimalModal] = useState(false);
  const [veterinarianInfo, setVeterinarianInfo] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      // Fetch veterinarian info
      const userRes = await axios.get(`${API_BASE_URL}/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setVeterinarianInfo(userRes.data.user);

      // Fetch animals
      const animalsRes = await axios.get(`${API_BASE_URL}/animal/getAll`);
      setAnimals(animalsRes.data.animals || []);

      // Fetch medical records
      const recordsRes = await axios.get(`${API_BASE_URL}/medical-records`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMedicalRecords(recordsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('error', 'Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Required',
            message: 'This app needs access to storage to save PDF reports',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const getFilteredRecords = () => {
    let filtered = [...medicalRecords];

    // Filter by selected animal
    if (selectedAnimal) {
      filtered = filtered.filter(record => record.animal._id === selectedAnimal._id);
    }

    // Filter by date range
    const now = new Date();
    switch (dateRange) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(record => new Date(record.date) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(record => new Date(record.date) >= monthAgo);
        break;
      case 'quarter':
        const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(record => new Date(record.date) >= quarterAgo);
        break;
      case 'year':
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(record => new Date(record.date) >= yearAgo);
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  };


  const generateReportHTML = (records) => {
    const reportTitle = selectedAnimal 
      ? `Medical Report - ${selectedAnimal.name}`
      : 'Comprehensive Medical Records Report';

    const dateRangeText = {
      'week': 'Last 7 Days',
      'month': 'Last 30 Days',
      'quarter': 'Last 3 Months',
      'year': 'Last Year',
      'all': 'All Time'
    }[dateRange];

    const totalRecords = records.length;
    const recordTypes = [...new Set(records.map(r => r.recordType))];
    const criticalRecords = records.filter(r => r.isCritical);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${reportTitle}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            line-height: 1.6;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #315342;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #315342;
            margin: 0;
            font-size: 24px;
          }
          .header p {
            margin: 5px 0;
            color: #666;
          }
          .summary {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .summary h2 {
            color: #315342;
            margin-top: 0;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
          }
          .summary-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #315342;
          }
          .summary-item h3 {
            margin: 0 0 5px 0;
            color: #315342;
            font-size: 18px;
          }
          .summary-item p {
            margin: 0;
            color: #666;
            font-size: 14px;
          }
          .records-section {
            margin-bottom: 30px;
          }
          .records-section h2 {
            color: #315342;
            border-bottom: 2px solid #315342;
            padding-bottom: 10px;
          }
          .record {
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .record.critical {
            border-left: 5px solid #FF6347;
          }
          .record-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
          }
          .record-title {
            font-size: 18px;
            font-weight: bold;
            color: #315342;
            text-transform: capitalize;
          }
          .record-date {
            color: #666;
            font-size: 14px;
          }
          .record-details {
            margin-bottom: 15px;
          }
          .record-details h4 {
            margin: 10px 0 5px 0;
            color: #315342;
          }
          .record-details p {
            margin: 5px 0;
            color: #666;
          }
          .medication-list, .vaccine-list {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
          }
          .medication-item, .vaccine-item {
            padding: 8px;
            border-bottom: 1px solid #ddd;
          }
          .medication-item:last-child, .vaccine-item:last-child {
            border-bottom: none;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status-active { background: #d4edda; color: #155724; }
          .status-in_recovery { background: #fff3cd; color: #856404; }
          .status-fully_healed { background: #d1ecf1; color: #0c5460; }
          .status-deceased { background: #f8d7da; color: #721c24; }
          .critical-badge {
            background: #FF6347;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          @media print {
            body { margin: 0; }
            .record { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${reportTitle}</h1>
          <p>Generated on: ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
          <p>Date Range: ${dateRangeText}</p>
          ${veterinarianInfo ? `<p>Veterinarian: Dr. ${veterinarianInfo.name}</p>` : ''}
          ${selectedAnimal ? `
            <div style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
              <h3 style="margin: 0; color: #315342;">Animal Information</h3>
              <p><strong>Name:</strong> ${selectedAnimal.name}</p>
              <p><strong>Species:</strong> ${selectedAnimal.species}</p>
              <p><strong>Breed:</strong> ${selectedAnimal.breed || 'Unknown'}</p>
              <p><strong>Age:</strong> ${selectedAnimal.age || 'Unknown'} years</p>
              <p><strong>Status:</strong> <span class="status-badge status-${selectedAnimal.status}">${selectedAnimal.status?.replace('_', ' ') || 'Unknown'}</span></p>
            </div>
          ` : ''}
        </div>

        <div class="summary">
          <h2>Report Summary</h2>
          <div class="summary-grid">
            <div class="summary-item">
              <h3>${totalRecords}</h3>
              <p>Total Records</p>
            </div>
            <div class="summary-item">
              <h3>${criticalRecords.length}</h3>
              <p>Critical Records</p>
            </div>
            <div class="summary-item">
              <h3>${recordTypes.length}</h3>
              <p>Record Types</p>
            </div>
            <div class="summary-item">
              <h3>${recordTypes.join(', ')}</h3>
              <p>Types Found</p>
            </div>
          </div>
        </div>

        <div class="records-section">
          <h2>Medical Records (${totalRecords} records)</h2>
          ${records.length === 0 ? '<p>No medical records found for the selected criteria.</p>' : ''}
          ${records.map(record => `
            <div class="record ${record.isCritical ? 'critical' : ''}">
              <div class="record-header">
                <div class="record-title">
                  ${record.recordType} - ${record.animal?.name || 'Unknown Animal'}
                  ${record.isCritical ? '<span class="critical-badge">CRITICAL</span>' : ''}
                </div>
                <div class="record-date">
                  ${new Date(record.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
              
              <div class="record-details">
                <h4>Description</h4>
                <p>${record.description}</p>
                
                ${record.diagnosis ? `
                  <h4>Diagnosis</h4>
                  <p>${record.diagnosis}</p>
                ` : ''}
                
                ${record.treatment ? `
                  <h4>Treatment</h4>
                  <p>${record.treatment}</p>
                ` : ''}
                
                ${record.medications && record.medications.length > 0 ? `
                  <h4>Medications</h4>
                  <div class="medication-list">
                    ${record.medications.map(med => `
                      <div class="medication-item">
                        <strong>${med.name}</strong><br>
                        Dosage: ${med.dosage || 'Not specified'}<br>
                        Frequency: ${med.frequency || 'Not specified'}<br>
                        Duration: ${med.duration || 'Not specified'}
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
                
                ${record.vaccines && record.vaccines.length > 0 ? `
                  <h4>Vaccines</h4>
                  <div class="vaccine-list">
                    ${record.vaccines.map(vaccine => `
                      <div class="vaccine-item">
                        <strong>${vaccine.name}</strong> (${vaccine.type || 'Unknown type'})<br>
                        Administered: ${vaccine.dateAdministered ? new Date(vaccine.dateAdministered).toLocaleDateString() : 'Not specified'}<br>
                        Next Due: ${vaccine.nextDueDate ? new Date(vaccine.nextDueDate).toLocaleDateString() : 'Not scheduled'}
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
                
                ${record.weight || record.temperature ? `
                  <h4>Vital Signs</h4>
                  ${record.weight ? `<p><strong>Weight:</strong> ${record.weight} kg</p>` : ''}
                  ${record.temperature ? `<p><strong>Temperature:</strong> ${record.temperature}°C</p>` : ''}
                ` : ''}
                
                ${record.notes ? `
                  <h4>Additional Notes</h4>
                  <p>${record.notes}</p>
                ` : ''}
                
                ${record.followUpDate ? `
                  <h4>Follow-up Date</h4>
                  <p>${new Date(record.followUpDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                ` : ''}
                
                <p><strong>Status:</strong> <span class="status-badge status-${record.status}">${record.status?.replace('_', ' ') || 'Active'}</span></p>
                <p><strong>Veterinarian:</strong> Dr. ${record.veterinarian?.name || 'Unknown'}</p>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="footer">
          <p>This report was generated electronically and contains confidential medical information.</p>
          <p>© ${new Date().getFullYear()} Captivity and Care. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    return html;
  };

   const generatePDF = async () => {
    try {
      setLoading(true);
      const filteredRecords = getFilteredRecords();
      
      if (filteredRecords.length === 0) {
        Alert.alert('No Data', 'No medical records found for the selected criteria.');
        setLoading(false);
        return;
      }

      const html = generateReportHTML(filteredRecords);
      
      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html,
        width: 612,   // US Letter width
        height: 792,  // US Letter height
      });

      // Create a permanent copy
      const fileName = selectedAnimal 
        ? `medical_report_${selectedAnimal.name}_${Date.now()}.pdf`
        : `comprehensive_report_${Date.now()}.pdf`;
      
      const newUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.copyAsync({
        from: uri,
        to: newUri,
      });

      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newUri, {
          dialogTitle: 'Share Medical Report',
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf'
        });
      } else {
        Alert.alert(
          'Report Saved',
          `PDF saved to: ${newUri}`,
          [{ text: 'OK' }]
        );
      }

      showToast('success', 'Success', 'Medical report generated successfully');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF report. Please try again.');
      showToast('error', 'Error', 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };
  
  const AnimalSelectionModal = () => (
    <Modal
      visible={showAnimalModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowAnimalModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Animal</Text>
            <TouchableOpacity onPress={() => setShowAnimalModal(false)}>
              <Ionicons name="close" size={24} color="#315342" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.animalList}>
            <TouchableOpacity
              style={[styles.animalOption, !selectedAnimal && styles.selectedAnimal]}
              onPress={() => {
                setSelectedAnimal(null);
                setShowAnimalModal(false);
              }}
            >
              <Text style={styles.animalOptionText}>All Animals</Text>
              {!selectedAnimal && <Ionicons name="checkmark" size={20} color="#315342" />}
            </TouchableOpacity>
            
            {animals.map(animal => (
              <TouchableOpacity
                key={animal._id}
                style={[
                  styles.animalOption,
                  selectedAnimal?._id === animal._id && styles.selectedAnimal
                ]}
                onPress={() => {
                  setSelectedAnimal(animal);
                  setShowAnimalModal(false);
                }}
              >
                <View>
                  <Text style={styles.animalOptionText}>{animal.name}</Text>
                  <Text style={styles.animalOptionSubtext}>
                    {animal.species} • {animal.breed || 'Unknown breed'}
                  </Text>
                </View>
                {selectedAnimal?._id === animal._id && (
                  <Ionicons name="checkmark" size={20} color="#315342" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#315342" />
      
      {/* Header */}
      <LinearGradient colors={['#315342', '#1e3a2a']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#a4d9ab" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Generate Report</Text>
          <Text style={styles.headerSubtitle}>Create PDF medical reports</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Report Configuration */}
        <View style={styles.configSection}>
          <Text style={styles.sectionTitle}>Report Configuration</Text>
          
          {/* Animal Selection */}
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Select Animal</Text>
            <TouchableOpacity 
              style={styles.selector}
              onPress={() => setShowAnimalModal(true)}
            >
              <Text style={styles.selectorText}>
                {selectedAnimal ? selectedAnimal.name : 'All Animals'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Date Range Selection */}
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Date Range</Text>
            <View style={styles.radioGroup}>
              {[
                { value: 'week', label: 'Last 7 Days' },
                { value: 'month', label: 'Last 30 Days' },
                { value: 'quarter', label: 'Last 3 Months' },
                { value: 'year', label: 'Last Year' },
                { value: 'all', label: 'All Time' }
              ].map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.radioOption}
                  onPress={() => setDateRange(option.value)}
                >
                  <View style={[
                    styles.radioCircle,
                    dateRange === option.value && styles.radioCircleSelected
                  ]}>
                    {dateRange === option.value && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Report Type Selection */}
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Report Type</Text>
            <View style={styles.radioGroup}>
              {[
                { value: 'comprehensive', label: 'Comprehensive Report' },
                { value: 'summary', label: 'Summary Report' }
              ].map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.radioOption}
                  onPress={() => setReportType(option.value)}
                >
                  <View style={[
                    styles.radioCircle,
                    reportType === option.value && styles.radioCircleSelected
                  ]}>
                    {reportType === option.value && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Preview Information */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Report Preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewItem}>
              <Ionicons name="document-text" size={20} color="#315342" />
              <Text style={styles.previewText}>
                Records: {getFilteredRecords().length}
              </Text>
            </View>
            <View style={styles.previewItem}>
              <Ionicons name="paw" size={20} color="#315342" />
              <Text style={styles.previewText}>
                Animal: {selectedAnimal ? selectedAnimal.name : 'All Animals'}
              </Text>
            </View>
            <View style={styles.previewItem}>
              <Ionicons name="calendar" size={20} color="#315342" />
              <Text style={styles.previewText}>
                Range: {{
                  'week': 'Last 7 Days',
                  'month': 'Last 30 Days',
                  'quarter': 'Last 3 Months',
                  'year': 'Last Year',
                  'all': 'All Time'
                }[dateRange]}
              </Text>
            </View>
          </View>
        </View>

        {/* Generate Button */}
        <TouchableOpacity 
          style={[styles.generateButton, loading && styles.generateButtonDisabled]}
          onPress={generatePDF}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="download" size={24} color="#fff" />
          )}
          <Text style={styles.generateButtonText}>
            {loading ? 'Generating...' : 'Generate PDF Report'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <AnimalSelectionModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#a4d9ab',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  configSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#315342',
    marginBottom: 20,
  },
  configItem: {
    marginBottom: 25,
  },
  configLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#315342',
    marginBottom: 12,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectorText: {
    fontSize: 16,
    color: '#333',
  },
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#315342',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#315342',
  },
  radioLabel: {
    fontSize: 16,
    color: '#333',
  },
  previewSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  previewCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#315342',
    padding: 18,
    borderRadius: 12,
    marginBottom: 30,
  },
  generateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#315342',
  },
    animalList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  animalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedAnimal: {
    backgroundColor: '#f0f7f2',
  },
  animalOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#315342',
  },
  animalOptionSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  // Additional styles for loading states
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  // Styles for PDF generation status
  statusContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#315342',
    textAlign: 'center',
  },
  // Error message styles
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#c62828',
    textAlign: 'center',
  },
  // Success message styles
  successContainer: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
  },
  successText: {
    fontSize: 16,
    color: '#2e7d32',
    textAlign: 'center',
  },
  // Empty state styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  // Responsive adjustments
  responsiveRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-between',
  },
  responsiveColumn: {
    width: Platform.OS === 'web' ? '48%' : '100%',
  },
});

export default ReportGenerator;