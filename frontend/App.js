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
import ViewAssignedTasks from './Pages/Task/ViewAssignedTasks';
import ViewAnimalProfile from './Pages/AnimalProf/viewAnimalProfile';
import AnimalDetailView from './Pages/AnimalProf/AnimalDetailView';
import ViewDetailedTask from './Pages/Task/ViewDetailedTask';
import CalendarTask from './Pages/Task/CalendarTask';
import AddBehavior from './Pages/Behavior/AddBehavior';
import AdminDashboard from './Pages/Admin/AdminDashboard';
import UserManagement from './Pages/Admin/UserManagement';
import AnimalProfiles from './Pages/Admin/AnimalProfiles';
import TaskManagement from './Pages/Admin/TaskManagement';
import VetDashboard from './Pages/Veterinarian/VetDashboard'; // New import
import Schedule from './Pages/Admin/Schedule';
import MedicalCheckups from './Pages/Veterinarian/MedicalCheckups'
import Treatments from './Pages/Veterinarian/Treatments'
import VaccinationRecords from './Pages/Veterinarian/VaccinationRecords'
import MedicalHistory from './Pages/Veterinarian/MedicalHistory'
import Behavior from './Pages/Admin/Behaviors';
import AnimalCheckups from './Pages/AnimalProf/AnimalCheckup'; // New import
import ReportGenerator from './Pages/Veterinarian/ReportGenerator'; // New import
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
         <Stack.Screen
            name="AssignedTasks"
            component={ViewAssignedTasks}
            options={{ headerShown: false }} 
          />
          <Stack.Screen
            name="AnimalView" 
            component={ViewAnimalProfile}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ViewDetailedTask" 
            component={ViewDetailedTask}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CalendarTask" 
            component={CalendarTask}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddBehavior" 
            component={AddBehavior}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AnimalDetailView" 
            component={AnimalDetailView}
            options={{ headerShown: false }}
          />
           <Stack.Screen
            name="AnimalCheckups"
            component={AnimalCheckups}
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
          <Stack.Screen
            name="AnimalProfiles"
            component={AnimalProfiles}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TaskManagement"
            component={TaskManagement}
            options={{ headerShown: false }}
          />
            <Stack.Screen
            name="Schedule" // 🔗 route must match the drawer item
            component={Schedule}
            options={{ headerShown: false }}
          />
           <Stack.Screen
            name="Behavior" // 🔗 route must match the drawer item
            component={Behavior}
            options={{ headerShown: false }}
          />
          
         {/* ===== VETERINARIAN STACK ===== */}
          <Stack.Group>
            <Stack.Screen
              name="VetDashboard"
              component={VetDashboard}
              options={{ headerShown: false }}
            />
            {/* <Stack.Screen
              name="MedicalRecordsStack"
              component={MedicalRecordRoutes}
              options={{ headerShown: false }}
            /> */}
            <Stack.Screen
              name="MedicalCheckups"
              component={MedicalCheckups}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Treatments"
              component={Treatments}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="VaccinationRecords"
              component={VaccinationRecords}
              options={{ headerShown: false }}
            />

<Stack.Screen 
  name="GenerateReport" 
  component={ReportGenerator}
  options={{
    headerShown: false,
    title: 'Generate Report'
  }}
/>

            {/* <Stack.Screen
              name="MedicalHistory"
              component={MedicalHistory}
              options={{ headerShown: false }}
            /> */}
            {/* <Stack.Screen
              name="HealthReports"
              component={HealthReports}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="EmergencyCases"
              component={EmergencyCases}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SearchMedicalRecords"
              component={SearchMedicalRecords}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AssignedHealthTasks"
              component={AssignedHealthTasks}
              options={{ headerShown: false }}
            /> */}
            <Stack.Screen
              name="AnimalProfile"
              component={ViewAnimalProfile}
              options={{ headerShown: false }}
            />
          </Stack.Group>
          
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