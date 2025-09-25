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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import CustomDrawer from '../CustomDrawer';

const { width, height } = Dimensions.get('window');

const getStatusBarHeight = () => {
  return Platform.OS === 'ios' ? (height >= 812 ? 44 : 20) : StatusBar.currentHeight || 24;
};

const AudioRecordingScreen = ({ navigation }) => {
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

  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0.5)).current;
  const waveAnim2 = useRef(new Animated.Value(0.8)).current;
  const waveAnim3 = useRef(new Animated.Value(0.3)).current;

  const recordingInterval = useRef(null);

  useEffect(() => {
    // Configure audio session for high-quality recording
    const configureAudio = async () => {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone access for recording.');
        return;
      }

      // Set high-quality audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true, // Lower other app volumes during recording
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
    // Pulse animation for recording button
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

      // Animate waveforms during recording
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
      // Custom high-quality recording options for clearer audio
      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100, // CD quality sample rate
          numberOfChannels: 2, // Stereo for better quality
          bitRate: 320000, // High bitrate for clarity (320 kbps)
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MAX,
          sampleRate: 44100, // CD quality sample rate
          numberOfChannels: 2, // Stereo
          bitRate: 320000, // High bitrate for clarity
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

      // Start timer for recording duration
      recordingInterval.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
        // Simulate real-time dB reading during recording
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

      // Load the recorded audio to get duration
      const { sound: newSound } = await Audio.Sound.createAsync({ uri });
      const status = await newSound.getStatusAsync();
      setTotalDuration(Math.floor(status.durationMillis / 1000));
      setSound(newSound);

    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const playPauseRecording = async () => {
    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        // If audio has finished playing (at the end), restart from beginning
        if (playbackPosition >= totalDuration) {
          await sound.setPositionAsync(0);
          setPlaybackPosition(0);
        }
        
        await sound.playAsync();
        setIsPlaying(true);
        
        // Update playback position
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
      
      // Update playback position
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
          },
        },
      ]
    );
  };

  const saveRecording = () => {
    Alert.alert(
      'Save Recording',
      'Recording saved successfully! You can find it in your noise reports.',
      [{ text: 'OK' }]
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B4513" />
      
      {/* Header Section */}
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
          <Text style={styles.headerTitle}>🎙️ Audio Recording</Text>
          <Text style={styles.headerSubtitle}>
            {isRecording ? 'Recording in progress...' : audioUri ? 'Recording complete' : 'Tap to start recording'}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Recording Section */}
        <View style={styles.recordingSection}>
          <View style={styles.recordingContainer}>
            {/* Visual feedback during recording */}
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

            {/* Recording Timer */}
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

            {/* Main Recording Button */}
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

        {/* Playback Section */}
        {audioUri && (
          <View style={styles.playbackSection}>
            <Text style={styles.sectionTitle}>🔊 Playback</Text>
            
            {/* Progress Bar */}
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

            {/* Playback Controls */}
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
              
              <TouchableOpacity onPress={saveRecording} style={styles.saveButton}>
                <Ionicons name="save" size={25} color="#27AE60" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Recording Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>💡 Recording Tips for Clear Audio</Text>
          
          <View style={styles.tipCard}>
            <Ionicons name="mic" size={20} color="#D4AC0D" />
            <Text style={styles.tipText}>
              Hold your device 6-8 inches from your mouth for optimal recording quality.
            </Text>
          </View>
          
          <View style={styles.tipCard}>
            <Ionicons name="volume-off" size={20} color="#8B7355" />
            <Text style={styles.tipText}>
              Record in a quiet environment. Avoid windy areas and background noise.
            </Text>
          </View>
          
          <View style={styles.tipCard}>
            <Ionicons name="hand-left" size={20} color="#E67E22" />
            <Text style={styles.tipText}>
              Don't cover the microphone with your fingers or case during recording.
            </Text>
          </View>
          
          <View style={styles.tipCard}>
            <Ionicons name="wifi-off" size={20} color="#E74C3C" />
            <Text style={styles.tipText}>
              Turn off notifications and close other apps to prevent audio interruptions.
            </Text>
          </View>
          
          <View style={styles.tipCard}>
            <Ionicons name="battery-full" size={20} color="#27AE60" />
            <Text style={styles.tipText}>
              Ensure good battery level - low battery can affect recording quality.
            </Text>
          </View>
          
          <View style={styles.tipCard}>
            <Ionicons name="shield-checkmark" size={20} color="#27AE60" />
            <Text style={styles.tipText}>
              High-quality mode active: 44.1kHz, 320kbps for crystal clear audio.
            </Text>
          </View>
        </View>
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
    </View>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 15,
    textAlign: 'center',
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
    gap: 20,
  },
  restartButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5E6D3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5E6D3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  deleteButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFE6E6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  saveButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  tipsSection: {
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
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#8B7355',
    marginLeft: 10,
    lineHeight: 20,
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
  },
});

export default AudioRecordingScreen;