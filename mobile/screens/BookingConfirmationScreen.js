import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function BookingConfirmationScreen({ route, navigation }) {
  const { receipt } = route.params;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.successBanner, { transform: [{ scale: scaleAnim }], opacity: fadeAnim }]}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark-circle" size={60} color="#10B981" />
        </View>
        <Text style={styles.successText}>Booking Confirmed!</Text>
        <Text style={styles.successSubtext}>Your service provider has been notified.</Text>
      </Animated.View>

      <Animated.View style={[styles.receiptCard, { opacity: fadeAnim }]}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{receipt.provider_details.name.charAt(0)}</Text>
        </View>

        <Text style={styles.label}>Booking ID</Text>
        <Text style={styles.value}>{receipt.booking_id}</Text>
        
        <Text style={styles.label}>Provider</Text>
        <Text style={styles.value}>{receipt.provider_details.name}</Text>
        
        <Text style={styles.label}>Time Slot</Text>
        <Text style={styles.value}>{receipt.slot}</Text>

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={styles.label}>Total Paid</Text>
          <Text style={styles.valueHighlight}>{receipt.price_total} PKR</Text>
        </View>
      </Animated.View>

      <TouchableOpacity 
        style={styles.trackButtonContainer} 
        onPress={() => navigation.navigate('LiveTracking', { booking_id: receipt.booking_id, provider_id: receipt.qr_stub.split('-')[2] })}
        activeOpacity={0.8}
      >
        <LinearGradient colors={['#4F46E5', '#0D9488']} style={styles.trackButtonGradient} start={{x: 0, y: 0}} end={{x: 1, y: 0}}>
          <Ionicons name="location" size={20} color="#fff" />
          <Text style={styles.trackText}>Track Provider Live</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F8FAFC', justifyContent: 'center' },
  successBanner: { alignItems: 'center', marginBottom: 30 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  successText: { color: '#064E3B', fontSize: 28, fontFamily: 'Inter_700Bold' },
  successSubtext: { color: '#059669', fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 5 },
  
  receiptCard: { backgroundColor: '#fff', padding: 25, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, position: 'relative' },
  label: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#94A3B8', marginTop: 15, textTransform: 'uppercase', letterSpacing: 1 },
  value: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#1E293B', marginTop: 4 },
  valueHighlight: { fontSize: 24, fontFamily: 'Inter_700Bold', color: '#0D9488' },
  
  avatarPlaceholder: { position: 'absolute', top: -20, right: 25, width: 60, height: 60, borderRadius: 30, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5 },
  avatarText: { fontSize: 28, fontFamily: 'Inter_700Bold', color: '#fff' },
  
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 20 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 0 },
  
  trackButtonContainer: { marginTop: 40, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  trackButtonGradient: { padding: 18, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  trackText: { color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 16, marginLeft: 10 }
});
