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
  ScrollView,
  Alert,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Audio, Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import CustomDrawer from '../CustomDrawer';

const { width, height } = Dimensions.get('window');

const getStatusBarHeight = () => {
  return Platform.OS === 'ios' ? (height >= 812 ? 44 : 20) : StatusBar.currentHeight || 24;
};

export default function AudioRecordingScreen({ navigation }) {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [currentDb, setCurrentDb] = useState(35);
  const [recording, setRecording] = useState(null);
  const [sound, setSound] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [comment, setComment] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  
  // Video states
  const [videoUri, setVideoUri] = useState(null);
  const [attachmentType, setAttachmentType] = useState(null);

  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0.5)).current;
  const waveAnim2 = useRef(new Animated.Value(0.8)).current;
  const waveAnim3 = useRef(new Animated.Value(0.3)).current;

  const recordingInterval = useRef(null);
  const videoRef = useRef(null);

  // Predefined noise complaint reasons
  const noiseReasons = [
    '🔊 Loud Music',
    '🚗 Vehicle Noise',
    '🔨 Construction',
    '🎉 Party/Event',
    '🐕 Animal Noise',
    '🏭 Industrial',
    '🗣️ Shouting/Arguments',
    '📢 Other',
  ];

  useEffect(() => {
    const configureAudio = async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone access for recording.');
        return;
      }

      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus.status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera access for video recording.');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      });
    };
    configureAudio();

    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      const animateWaves = () => {
        Animated.loop(
          Animated.stagger(200, [
            Animated.timing(waveAnim1, {
              toValue: Math.random(),
              duration: 500,
              useNativeDriver: false,
            }),
            Animated.timing(waveAnim2, {
              toValue: Math.random(),
              duration: 500,
              useNativeDriver: false,
            }),
            Animated.timing(waveAnim3, {
              toValue: Math.random(),
              duration: 500,
              useNativeDriver: false,
            }),
          ])
        ).start();
      };
      animateWaves();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 320000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MAX,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 320000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm;codecs=opus',
          bitsPerSecond: 320000,
        },
      };

      const { recording: newRecording } = await Audio.Recording.createAsync(
        recordingOptions
      );
      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);
      setAttachmentType('audio');

      recordingInterval.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
        setCurrentDb(Math.floor(Math.random() * (85 - 40) + 40));
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setIsRecording(false);
      setRecording(null);
      
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }

      const { sound: newSound } = await Audio.Sound.createAsync({ uri });
      const status = await newSound.getStatusAsync();
      setTotalDuration(Math.floor(status.durationMillis / 1000));
      setSound(newSound);

    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const pickVideo = async () => {
    try {
      Alert.alert(
        'Add Video',
        'Choose an option',
        [
          {
            text: 'Record Video',
            onPress: recordVideo,
          },
          {
            text: 'Choose from Gallery',
            onPress: pickFromGallery,
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (err) {
      console.error('Error picking video:', err);
    }
  };

  const recordVideo = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 1,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets[0]) {
        setVideoUri(result.assets[0].uri);
        setAttachmentType('video');
        if (sound) {
          sound.unloadAsync();
        }
        setAudioUri(null);
        setSound(null);
      }
    } catch (err) {
      console.error('Error recording video:', err);
      Alert.alert('Error', 'Failed to record video. Please try again.');
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setVideoUri(result.assets[0].uri);
        setAttachmentType('video');
        if (sound) {
          sound.unloadAsync();
        }
        setAudioUri(null);
        setSound(null);
      }
    } catch (err) {
      console.error('Error picking video:', err);
      Alert.alert('Error', 'Failed to pick video. Please try again.');
    }
  };

  const deleteVideo = () => {
    Alert.alert(
      'Delete Video',
      'Are you sure you want to remove this video?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setVideoUri(null);
            setAttachmentType(null);
          },
        },
      ]
    );
  };

  const playPauseRecording = async () => {
    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        if (playbackPosition >= totalDuration) {
          await sound.setPositionAsync(0);
          setPlaybackPosition(0);
        }
        
        await sound.playAsync();
        setIsPlaying(true);
        
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            setPlaybackPosition(Math.floor(status.positionMillis / 1000));
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPlaybackPosition(0);
            }
          }
        });
      }
    } catch (err) {
      console.error('Failed to play/pause recording', err);
    }
  };

  const restartRecording = async () => {
    if (!sound) return;

    try {
      await sound.setPositionAsync(0);
      setPlaybackPosition(0);
      await sound.playAsync();
      setIsPlaying(true);
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPlaybackPosition(Math.floor(status.positionMillis / 1000));
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPlaybackPosition(0);
          }
        }
      });
    } catch (err) {
      console.error('Failed to restart recording', err);
    }
  };

  const deleteRecording = () => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (sound) {
              sound.unloadAsync();
            }
            setSound(null);
            setAudioUri(null);
            setTotalDuration(0);
            setPlaybackPosition(0);
            setIsPlaying(false);
            setAttachmentType(null);
          },
        },
      ]
    );
  };

  const saveRecording = () => {
    if (!audioUri && !videoUri) {
      Alert.alert('No Content', 'Please record audio or attach a video first.');
      return;
    }

    if (!selectedReason) {
      Alert.alert('Reason Required', 'Please select a reason for this noise report.');
      return;
    }

    const attachmentInfo = videoUri 
      ? `Video: ${videoUri.split('/').pop()}`
      : `Audio: ${formatTime(totalDuration)}`;

    const reportDetails = `
Noise Report Submitted Successfully!

Reason: ${selectedReason}
${comment ? `\nAdditional Details: ${comment}` : ''}
${attachmentInfo}
Timestamp: ${new Date().toLocaleString()}
    `.trim();

    Alert.alert(
      '✅ Report Submitted',
      reportDetails,
      [
        { 
          text: 'OK', 
          onPress: () => {
            // Reset form after successful submission
            setComment('');
            setSelectedReason('');
            if (sound) {
              sound.unloadAsync();
            }
            setSound(null);
            setAudioUri(null);
            setVideoUri(null);
            setAttachmentType(null);
            setTotalDuration(0);
            setPlaybackPosition(0);
          }
        }
      ]
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDbColor = (db) => {
    if (db < 50) return '#8B7355';
    if (db < 70) return '#D4AC0D';
    if (db < 85) return '#E67E22';
    return '#E74C3C';
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
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle="light-content" backgroundColor="#8B4513" />
      
      <LinearGradient colors={['#8B4513', '#654321']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={openDrawer} style={styles.headerButton}>
              <Ionicons name="menu" size={28} color="#D4AC0D" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
              <Ionicons name="arrow-back" size={28} color="#D4AC0D" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>🎙️ Noise Report</Text>
          <Text style={styles.headerSubtitle}>
            {isRecording ? 'Recording in progress...' : 
             videoUri ? 'Video attached' :
             audioUri ? 'Recording complete' : 
             'Record audio or attach video'}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Reason Selection Section */}
        <View style={styles.reasonSection}>
          <Text style={styles.sectionTitle}>📋 Select Noise Type</Text>
          <Text style={styles.sectionSubtitle}>Choose the type of noise disturbance</Text>
          <View style={styles.reasonGrid}>
            {noiseReasons.map((reason, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.reasonChip,
                  selectedReason === reason && styles.reasonChipSelected
                ]}
                onPress={() => setSelectedReason(reason)}
              >
                <Text style={[
                  styles.reasonChipText,
                  selectedReason === reason && styles.reasonChipTextSelected
                ]}>
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Comment Section */}
        <View style={styles.commentSection}>
          <Text style={styles.sectionTitle}>💬 Additional Details</Text>
          <Text style={styles.sectionSubtitle}>Describe the noise issue (optional)</Text>
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="e.g., Loud music from neighbor's apartment, ongoing for 2 hours..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>{comment.length}/500</Text>
          </View>
        </View>

        {/* Attachment Type Selector */}
        <View style={styles.attachmentSelector}>
          <TouchableOpacity 
            style={[
              styles.attachmentButton, 
              attachmentType === 'audio' && styles.attachmentButtonActive
            ]}
            onPress={() => {
              if (attachmentType === 'video') {
                Alert.alert('Switch to Audio', 'This will remove the attached video. Continue?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'OK', onPress: () => {
                    setVideoUri(null);
                    setAttachmentType('audio');
                  }}
                ]);
              }
            }}
          >
            <Ionicons 
              name="mic" 
              size={24} 
              color={attachmentType === 'audio' ? '#fff' : '#8B4513'} 
            />
            <Text style={[
              styles.attachmentButtonText,
              attachmentType === 'audio' && styles.attachmentButtonTextActive
            ]}>
              Audio Recording
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.attachmentButton, 
              attachmentType === 'video' && styles.attachmentButtonActive
            ]}
            onPress={pickVideo}
          >
            <Ionicons 
              name="videocam" 
              size={24} 
              color={attachmentType === 'video' ? '#fff' : '#8B4513'} 
            />
            <Text style={[
              styles.attachmentButtonText,
              attachmentType === 'video' && styles.attachmentButtonTextActive
            ]}>
              Video Attachment
            </Text>
          </TouchableOpacity>
        </View>

        {/* Video Preview Section */}
        {videoUri && (
          <View style={styles.videoSection}>
            <Text style={styles.sectionTitle}>📹 Video Preview</Text>
            <View style={styles.videoContainer}>
              <Video
                ref={videoRef}
                source={{ uri: videoUri }}
                style={styles.video}
                useNativeControls
                resizeMode="contain"
                isLooping
              />
              <TouchableOpacity 
                style={styles.deleteVideoButton}
                onPress={deleteVideo}
              >
                <Ionicons name="close-circle" size={32} color="#E74C3C" />
              </TouchableOpacity>
            </View>
            <Text style={styles.videoInfo}>
              Video file: {videoUri.split('/').pop()}
            </Text>
          </View>
        )}

        {/* Recording Section - Only show if no video */}
        {!videoUri && (
          <View style={styles.recordingSection}>
            <View style={styles.recordingContainer}>
              {isRecording && (
                <View style={styles.waveformContainer}>
                  <Text style={[styles.dbReading, { color: getDbColor(currentDb) }]}>
                    {currentDb} dB
                  </Text>
                  <View style={styles.waveform}>
                    <Animated.View 
                      style={[
                        styles.waveBar, 
                        { 
                          height: waveAnim1.interpolate({
                            inputRange: [0, 1],
                            outputRange: [10, 60]
                          }),
                          backgroundColor: getDbColor(currentDb)
                        }
                      ]} 
                    />
                    <Animated.View 
                      style={[
                        styles.waveBar, 
                        { 
                          height: waveAnim2.interpolate({
                            inputRange: [0, 1],
                            outputRange: [10, 80]
                          }),
                          backgroundColor: getDbColor(currentDb)
                        }
                      ]} 
                    />
                    <Animated.View 
                      style={[
                        styles.waveBar, 
                        { 
                          height: waveAnim3.interpolate({
                            inputRange: [0, 1],
                            outputRange: [10, 50]
                          }),
                          backgroundColor: getDbColor(currentDb)
                        }
                      ]} 
                    />
                    <Animated.View 
                      style={[
                        styles.waveBar, 
                        { 
                          height: waveAnim1.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 70]
                          }),
                          backgroundColor: getDbColor(currentDb)
                        }
                      ]} 
                    />
                    <Animated.View 
                      style={[
                        styles.waveBar, 
                        { 
                          height: waveAnim2.interpolate({
                            inputRange: [0, 1],
                            outputRange: [10, 40]
                          }),
                          backgroundColor: getDbColor(currentDb)
                        }
                      ]} 
                    />
                  </View>
                </View>
              )}

              <View style={styles.timerContainer}>
                <Text style={styles.timerText}>
                  {formatTime(isRecording ? recordingDuration : totalDuration)}
                </Text>
                {isRecording && (
                  <View style={styles.recordingDot}>
                    <View style={styles.pulsingDot} />
                  </View>
                )}
              </View>

              <TouchableOpacity 
                onPress={isRecording ? stopRecording : startRecording}
                style={styles.recordButtonContainer}
              >
                <Animated.View 
                  style={[
                    styles.recordButton, 
                    { 
                      backgroundColor: isRecording ? '#E74C3C' : '#D4AC0D',
                      transform: [{ scale: isRecording ? pulseAnim : 1 }]
                    }
                  ]}
                >
                  <Ionicons 
                    name={isRecording ? "stop" : "mic"} 
                    size={50} 
                    color="#fff" 
                  />
                </Animated.View>
              </TouchableOpacity>

              <Text style={styles.recordStatus}>
                {isRecording ? 'Recording... Tap to stop' : audioUri ? 'Recording complete' : 'Tap to start recording'}
              </Text>
            </View>
          </View>
        )}

        {/* Playback Section */}
        {audioUri && !videoUri && (
          <View style={styles.playbackSection}>
            <Text style={styles.sectionTitle}>🔊 Playback</Text>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${totalDuration > 0 ? (playbackPosition / totalDuration) * 100 : 0}%` }
                  ]} 
                />
              </View>
              <View style={styles.timeLabels}>
                <Text style={styles.timeText}>{formatTime(playbackPosition)}</Text>
                <Text style={styles.timeText}>{formatTime(totalDuration)}</Text>
              </View>
            </View>

            <View style={styles.playbackControls}>
              <TouchableOpacity onPress={restartRecording} style={styles.restartButton}>
                <Ionicons name="play-skip-back" size={25} color="#8B4513" />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={playPauseRecording} style={styles.playButton}>
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={30} 
                  color="#8B4513" 
                />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={deleteRecording} style={styles.deleteButton}>
                <Ionicons name="trash" size={25} color="#E74C3C" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Save Button */}
        {(audioUri || videoUri) && (
          <TouchableOpacity 
            onPress={saveRecording} 
            style={[
              styles.saveReportButton,
              !selectedReason && styles.saveReportButtonDisabled
            ]}
            disabled={!selectedReason}
          >
            <Ionicons name="checkmark-circle" size={28} color="#fff" />
            <Text style={styles.saveReportText}>Submit Noise Report</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5E6D3',
  },
  header: {
    paddingTop: getStatusBarHeight() + 10,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 172, 13, 0.2)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D4AC0D',
    textAlign: 'center',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#F5E6D3',
    textAlign: 'center',
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  reasonSection: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  commentSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 15,
  },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reasonChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5E6D3',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginBottom: 10,
    marginRight: 10,
  },
  reasonChipSelected: {
    backgroundColor: '#D4AC0D',
    borderColor: '#D4AC0D',
  },
  reasonChipText: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '600',
  },
  reasonChipTextSelected: {
    color: '#fff',
  },
  commentInputContainer: {
    position: 'relative',
  },
  commentInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    color: '#333',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  characterCount: {
    position: 'absolute',
    bottom: 10,
    right: 15,
    fontSize: 12,
    color: '#999',
  },
  attachmentSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 20,
  },
  attachmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    elevation: 2,
    marginHorizontal: 5,
  },
  attachmentButtonActive: {
    backgroundColor: '#D4AC0D',
    borderColor: '#D4AC0D',
  },
  attachmentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
    marginLeft: 8,
  },
  attachmentButtonTextActive: {
    color: '#fff',
  },
  videoSection: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    height: 220,
    backgroundColor: '#000',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 10,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  deleteVideoButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 4,
  },
  videoInfo: {
    fontSize: 12,
    color: '#8B7355',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  recordingSection: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recordingContainer: {
    alignItems: 'center',
  },
  waveformContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  dbReading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    justifyContent: 'space-around',
    width: '60%',
  },
  waveBar: {
    width: 8,
    backgroundColor: '#D4AC0D',
    borderRadius: 4,
    marginHorizontal: 2,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  timerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B4513',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  recordingDot: {
    marginLeft: 15,
  },
  pulsingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E74C3C',
  },
  recordButtonContainer: {
    marginBottom: 15,
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  recordStatus: {
    fontSize: 16,
    color: '#8B7355',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  playbackSection: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D4AC0D',
    borderRadius: 2,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 14,
    color: '#8B7355',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  playbackControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restartButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5E6D3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    marginHorizontal: 10,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5E6D3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    marginHorizontal: 10,
  },
  deleteButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFE6E6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    marginHorizontal: 10,
  },
  saveReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27AE60',
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 18,
    borderRadius: 15,
    elevation: 6,
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  saveReportButtonDisabled: {
    backgroundColor: '#CCC',
    shadowColor: '#CCC',
  },
  saveReportText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
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
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.8,
    backgroundColor: '#fff',
  },
  drawerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerText: {
    fontSize: 18,
    color: '#8B4513',
    fontWeight: '600',
  },
});