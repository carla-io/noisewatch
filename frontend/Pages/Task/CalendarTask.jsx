// Pages/Task/CalendarTask.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CalendarTask = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📅 Calendar Task View</Text>
    </View>
  );
};

export default CalendarTask;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
});