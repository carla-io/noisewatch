import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { toastConfig } from './utils/toast';
import Login from './Pages/Auth/Login';
import Register from './Pages/Auth/Register';
import Home from './Pages/Home'
import AdminDashboard from './Pages/Admin/AdminDashboard';
import UserManagement from './Pages/Admin/UserManagement';
import UserProfile from './Pages/UserProfile';
import MapScreen from './Pages/User/Map'; // Changed from 'Map' to 'MapScreen' for consistency
import AudioRecordingScreen from './Pages/User/Report'; // New import for AudioRecording screen

const Stack = createStackNavigator();

// Add debug logging
console.log('App.js loaded, MapScreen component:', MapScreen ? 'imported successfully' : 'import failed');

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#315342', // Updated to match your green theme
    secondary: '#a4d9ab', // Updated to match your light green
    background: '#f6f6f6',
  },
};

export default function App() {
  const navigationStateChange = (state) => {
    console.log('Navigation state changed:', state?.routeNames || 'No route names');
  };

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer onStateChange={navigationStateChange}>
        <StatusBar style="auto" />
        <Stack.Navigator 
          initialRouteName="Login"
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
          }}
        >
          {/* Auth Screens */}
          <Stack.Screen 
            name="Login" 
            component={Login}
          />
          <Stack.Screen 
            name="Register" 
            component={Register}
          />
          
          {/* User Screens */}
          <Stack.Screen 
            name="Home" 
            component={Home}
          />
        
          {/* User Profile Screen */}
          <Stack.Screen
            name="UserProfile"
            component={UserProfile}
          />

          {/* Map Screen - This is the important one */}
          <Stack.Screen
            name="MapScreen"
            component={MapScreen}
            options={{
              headerShown: false,
              gestureEnabled: true,
            }}
          />

          <Stack.Screen
            name="Record"
            component={AudioRecordingScreen}
            options={{
              headerShown: false,
              gestureEnabled: true,
            }}
          />
          
          {/* Admin Screens */}
          <Stack.Screen
            name="AdminDashboard"
            component={AdminDashboard}
          />
          <Stack.Screen
            name="UserManagement"
            component={UserManagement}
          />

          {/* Placeholder screens for missing routes */}
          <Stack.Screen
            name="Settings"
            component={() => (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Settings Screen - Coming Soon</Text>
              </View>
            )}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast 
        config={toastConfig}
        position="top"
        topOffset={50}
        visibilityTime={3000}
        autoHide={true}
      />
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});