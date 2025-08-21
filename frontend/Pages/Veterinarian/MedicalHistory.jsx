// import React, { useState, useEffect } from 'react';
// import { 
//   View, 
//   Text, 
//   FlatList, 
//   TouchableOpacity, 
//   StyleSheet, 
//   ActivityIndicator,
//   RefreshControl,
//   TextInput,
//   SafeAreaView
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';
// import API_BASE_URL from '../../utils/api';
// import { formatDate } from '../utils/date';
// import { showToast } from '../utils/toast';

// const MedicalRecordsScreen = () => {
//   const [records, setRecords] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const navigation = useNavigation();

//   const fetchRecords = async () => {
//     try {
//       setLoading(true);
//       const response = await API.get('/medical-records');
//       setRecords(response.data);
//     } catch (error) {
//       console.error('Error fetching records:', error);
//       showToast('error', 'Error', 'Failed to load medical records');
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   useEffect(() => {
//     fetchRecords();
//   }, []);

//   const onRefresh = () => {
//     setRefreshing(true);
//     fetchRecords();
//   };

//   const navigateToDetail = (recordId) => {
//     navigation.navigate('MedicalRecordDetail', { recordId });
//   };

//   const navigateToAddRecord = () => {
//     navigation.navigate('AddMedicalRecord');
//   };

//   const renderRecordItem = ({ item }) => (
//     <TouchableOpacity 
//       style={styles.recordCard}
//       onPress={() => navigateToDetail(item._id)}
//     >
//       <View style={styles.recordHeader}>
//         <Text style={styles.recordType}>{item.recordType.toUpperCase()}</Text>
//         <Text style={styles.recordDate}>{formatDate(item.date)}</Text>
//       </View>
//       <Text style={styles.animalName}>{item.animal?.name || 'Unknown Animal'}</Text>
//       <Text style={styles.recordDescription} numberOfLines={2}>
//         {item.description}
//       </Text>
//       <View style={styles.recordFooter}>
//         <Text style={[
//           styles.recordStatus,
//           item.status === 'resolved' && styles.statusResolved,
//           item.status === 'follow_up' && styles.statusFollowUp
//         ]}>
//           {item.status.replace('_', ' ')}
//         </Text>
//         {item.isCritical && (
//           <View style={styles.criticalBadge}>
//             <Text style={styles.criticalText}>CRITICAL</Text>
//           </View>
//         )}
//       </View>
//     </TouchableOpacity>
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.title}>Medical Records</Text>
//         <TouchableOpacity onPress={navigateToAddRecord}>
//           <Ionicons name="add-circle" size={32} color="#315342" />
//         </TouchableOpacity>
//       </View>

//       <View style={styles.searchContainer}>
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search records..."
//           value={searchTerm}
//           onChangeText={setSearchTerm}
//         />
//         <TouchableOpacity style={styles.searchButton}>
//           <Ionicons name="search" size={24} color="#315342" />
//         </TouchableOpacity>
//       </View>

//       {loading ? (
//         <ActivityIndicator size="large" color="#315342" style={styles.loader} />
//       ) : records.length === 0 ? (
//         <View style={styles.emptyContainer}>
//           <Ionicons name="document-text-outline" size={64} color="#ccc" />
//           <Text style={styles.emptyText}>No medical records found</Text>
//           <TouchableOpacity 
//             style={styles.addButton}
//             onPress={navigateToAddRecord}
//           >
//             <Text style={styles.addButtonText}>Add New Record</Text>
//           </TouchableOpacity>
//         </View>
//       ) : (
//         <FlatList
//           data={records}
//           renderItem={renderRecordItem}
//           keyExtractor={(item) => item._id}
//           contentContainerStyle={styles.listContent}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={onRefresh}
//               colors={['#315342']}
//             />
//           }
//         />
//       )}
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 16,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#315342',
//   },
//   searchContainer: {
//     flexDirection: 'row',
//     padding: 16,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0',
//   },
//   searchInput: {
//     flex: 1,
//     height: 40,
//     borderColor: '#e0e0e0',
//     borderWidth: 1,
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     marginRight: 8,
//   },
//   searchButton: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 8,
//   },
//   listContent: {
//     padding: 16,
//   },
//   recordCard: {
//     backgroundColor: '#fff',
//     borderRadius: 8,
//     padding: 16,
//     marginBottom: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   recordHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 8,
//   },
//   recordType: {
//     fontWeight: 'bold',
//     color: '#315342',
//   },
//   recordDate: {
//     color: '#666',
//     fontSize: 12,
//   },
//   animalName: {
//     fontWeight: 'bold',
//     fontSize: 16,
//     marginBottom: 4,
//   },
//   recordDescription: {
//     color: '#666',
//     marginBottom: 8,
//   },
//   recordFooter: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   recordStatus: {
//     textTransform: 'capitalize',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 4,
//     backgroundColor: '#e0e0e0',
//     color: '#333',
//     fontSize: 12,
//   },
//   statusResolved: {
//     backgroundColor: '#a4d9ab',
//     color: '#1e3a2a',
//   },
//   statusFollowUp: {
//     backgroundColor: '#ffd700',
//     color: '#5e4200',
//   },
//   criticalBadge: {
//     backgroundColor: '#ff4757',
//     borderRadius: 4,
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//   },
//   criticalText: {
//     color: '#fff',
//     fontSize: 10,
//     fontWeight: 'bold',
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 32,
//   },
//   emptyText: {
//     fontSize: 18,
//     color: '#666',
//     marginVertical: 16,
//   },
//   addButton: {
//     backgroundColor: '#315342',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   addButtonText: {
//     color: '#fff',
//     fontWeight: 'bold',
//   },
//   loader: {
//     marginTop: 32,
//   },
// });

// export default MedicalRecordsScreen;