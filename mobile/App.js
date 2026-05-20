import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Font from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

import ChatInputScreen from './screens/ChatInputScreen';
import ProviderListScreen from './screens/ProviderListScreen';
import PricingScreen from './screens/PricingScreen';
import BookingConfirmationScreen from './screens/BookingConfirmationScreen';
import LiveTrackingScreen from './screens/LiveTrackingScreen';
import FeedbackScreen from './screens/FeedbackScreen';
import DisputeScreen from './screens/DisputeScreen';

const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        Inter_400Regular,
        Inter_600SemiBold,
        Inter_700Bold,
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const headerOptions = {
    headerTitleAlign: 'center',
    headerStyle: {
      backgroundColor: '#fff',
      elevation: 0,
      shadowOpacity: 0,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    headerTintColor: '#1f2937',
    headerTitleStyle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 18,
    },
    cardStyle: { backgroundColor: '#F8FAFC' }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="ChatInput" screenOptions={headerOptions}>
        <Stack.Screen name="ChatInput" component={ChatInputScreen} options={{ title: 'KhidmatApp' }} />
        <Stack.Screen name="ProviderList" component={ProviderListScreen} options={{ title: 'Matching Providers' }} />
        <Stack.Screen name="Pricing" component={PricingScreen} options={{ title: 'Price Estimate' }} />
        <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} options={{ title: 'Booking Confirmed', headerLeft: () => null }} />
        <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} options={{ title: 'Live Tracking', headerLeft: () => null }} />
        <Stack.Screen name="Feedback" component={FeedbackScreen} options={{ title: 'Leave Feedback', headerLeft: () => null }} />
        <Stack.Screen name="Dispute" component={DisputeScreen} options={{ title: 'File a Dispute' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
