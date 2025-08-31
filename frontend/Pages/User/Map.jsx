import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Animated,
  StatusBar,
  Dimensions,
  Platform,
  Easing,
  Text,
  Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import CustomDrawer from '../CustomDrawer';

const { width, height } = Dimensions.get('window');

const getStatusBarHeight = () => {
  return Platform.OS === 'ios' ? (height >= 812 ? 44 : 20) : StatusBar.currentHeight || 24;
};

// Responsive sizing
const isSmallScreen = height < 700;
const isMediumScreen = height >= 700 && height < 900;
const isLargeScreen = height >= 900;

const getResponsiveHeight = () => {
  if (isSmallScreen) {
    return {
      statusBar: 24,
      selector: 70,
      padding: 8,
      optionButton: 60,
      fontSize: {
        small: 9,
        medium: 12,
        large: 16,
      },
    };
  } else if (isMediumScreen) {
    return {
      statusBar: 28,
      selector: 80,
      padding: 12,
      optionButton: 70,
      fontSize: {
        small: 10,
        medium: 14,
        large: 18,
      },
    };
  } else {
    return {
      statusBar: 32,
      selector: 90,
      padding: 16,
      optionButton: 80,
      fontSize: {
        small: 11,
        medium: 16,
        large: 20,
      },
    };
  }
};

const responsive = getResponsiveHeight();

const MapScreen = ({ navigation }) => {
  const [region, setRegion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  // Animation refs for drawer
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setPermissionDenied(true);
          // Use default location (Manila, Philippines)
          setRegion({
            lat: 14.5995,
            lon: 120.9842,
          });
          setIsLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        setRegion({
          lat: location.coords.latitude,
          lon: location.coords.longitude,
        });
      } catch (error) {
        console.error("Error getting location:", error);
        // Use default location on error
        setRegion({
          lat: 14.5995,
          lon: 120.9842,
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

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
        toValue: 0.5,
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

  const handleRecenterMap = async () => {
    if (permissionDenied) {
      Alert.alert("Location Access", "Please enable location permissions to use this feature");
      return;
    }

    try {
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setRegion({
        lat: current.coords.latitude,
        lon: current.coords.longitude,
      });
    } catch (error) {
      console.log('Could not get current location');
      Alert.alert("Location Error", "Unable to get current location");
    }
  };

  const handleNoiseReport = () => {
    console.log('Noise report button pressed');
    Alert.alert(
      "Noise Report",
      "This feature will allow you to report noise levels in your area.",
      [
        { text: "OK", onPress: () => {} }
      ]
    );
  };

  const handleSettingsPress = () => {
    console.log('Settings button pressed - navigating to Settings');
    try {
      if (navigation && navigation.navigate) {
        navigation.navigate('Settings');
      } else {
        console.warn('Navigation not available');
        Alert.alert("Navigation Error", "Settings screen not available");
      }
    } catch (error) {
      console.error('Settings navigation error:', error);
      Alert.alert("Navigation Error", "Could not open settings");
    }
  };

  if (isLoading || !region) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#8B4513" translucent={false} />
        <LinearGradient colors={["#8B4513", "#654321", "#D4AC0D"]} style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <View style={styles.loadingSpinner}>
              <ActivityIndicator size="large" color="#D4AC0D" />
            </View>
            <Text style={styles.loadingText}>Getting your location...</Text>
            <Text style={styles.loadingSubtext}>Preparing noise map data</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // Build noise map URLs based on region
  const noiseMapURL = "https://noise-map.com"; 
  const noisePlanetURL = `https://noise-planet.org/map.html#lat=${region.lat}&lon=${region.lon}&zoom=14`;
  const mapSources = {
    standard: `https://embed.windy.com/embed2.html?lat=${region.lat}&lon=${region.lon}&zoom=12&overlay=wind`,
    noise: noiseMapURL,
    crowdsourced: noisePlanetURL,
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B4513" translucent={false} />
      
      {/* Header */}
      <LinearGradient colors={['#8B4513', '#654321']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
            <Ionicons name="menu" size={28} color="#D4AC0D" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Noise Map</Text>
          <TouchableOpacity onPress={handleSettingsPress} style={styles.settingsButton}>
            <Ionicons name="settings" size={28} color="#D4AC0D" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Map Container using WebView */}
      <View style={styles.mapContainer}>
        <View style={styles.mapWrapper}>
          <WebView
            source={{ uri: noiseMapURL }}
            style={styles.webview}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.webviewLoader}>
                <ActivityIndicator size="large" color="#D4AC0D" />
                <Text style={styles.webviewLoadingText}>Loading map...</Text>
              </View>
            )}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView HTTP error: ', nativeEvent);
            }}
          />
        </View>
      </View>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={[styles.fab, { marginBottom: 10 }]} 
          onPress={handleRecenterMap}
          disabled={permissionDenied}
        >
          <Ionicons name="locate" size={24} color={permissionDenied ? "#8B4513" : "#8B4513"} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.fab} onPress={handleNoiseReport}>
          <Ionicons name="volume-high" size={24} color="#8B4513" />
        </TouchableOpacity>
      </View>

      {/* Drawer Modal */}
      <Modal 
        visible={drawerVisible} 
        transparent 
        animationType="none" 
        onRequestClose={closeDrawer}
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
            <TouchableOpacity 
              style={{ flex: 1 }} 
              activeOpacity={1} 
              onPress={closeDrawer} 
            />
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: getStatusBarHeight(),
    paddingBottom: 15,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AC0D',
    flex: 1,
    textAlign: 'center',
  },
  menuButton: {
    padding: 5,
    marginRight: 15,
  },
  settingsButton: {
    padding: 5,
    marginLeft: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingSpinner: {
    marginBottom: 20,
    padding: responsive.padding + 4,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    shadowColor: "#D4AC0D",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  loadingText: {
    fontSize: responsive.fontSize.large,
    fontWeight: "600",
    color: "#D4AC0D",
    marginBottom: 8,
    textAlign: "center",
  },
  loadingSubtext: {
    fontSize: responsive.fontSize.medium,
    color: "#8B4513",
    textAlign: "center",
  },
  mapContainer: {
    flex: 1,
    padding: responsive.padding,
  },
  mapWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#8B4513",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    minHeight: 200,
  },
  webview: {
    flex: 1,
  },
  webviewLoader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(139, 69, 19, 0.95)",
  },
  webviewLoadingText: {
    marginTop: 12,
    fontSize: responsive.fontSize.medium,
    color: "#D4AC0D",
    fontWeight: "500",
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D4AC0D',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
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
    backgroundColor: '#000',
  },
  drawerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.8,
  },
});

export default MapScreen;