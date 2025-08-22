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
import CustomDrawer from './Pages/CustomDrawer';
import AdminDashboard from './Pages/Admin/AdminDashboard';
import UserManagement from './Pages/Admin/UserManagement';
import UserProfile from './Pages/UserProfile';


const Stack = createStackNavigator();

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
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator initialRouteName="Login">
          {/* Auth Screens */}
          <Stack.Screen 
            name="Login" 
            component={Login} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="Register" 
            component={Register} 
            options={{ headerShown: false }} 
          />
          
          {/* User Screens */}
           <Stack.Screen 
            name="Home" 
            component={Home} 
            options={{ headerShown: false }} 
          />
        
          {/* User Profile Screen */}
<Stack.Screen
  name="UserProfile"
  component={UserProfile}
  options={{ headerShown: false }}
/>
          
          {/* Admin Screens */}
          <Stack.Screen
            name="AdminDashboard"
            component={AdminDashboard}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="UserManagement"
            component={UserManagement}
            options={{ headerShown: false }}
          />
         
          
          {/* Common Components */}
          <Stack.Screen
            name="CustomDrawer"
            component={CustomDrawer}
            options={{ headerShown: false }}
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