import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';

export default function PricingScreen({ route, navigation }) {
  const { intent, provider } = route.params;
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const payload = {
        user_id: "user_client_45",
        provider: provider,
        estimated_duration_hours: 2,
        distance_km: parseFloat(provider.distance_km) || 3.0,
        urgency: intent.urgency || "medium",
        complexity: "intermediate",
        time_slot: intent.preferred_time || "09:00-12:00",
        budget_sensitivity: intent.budget_sensitivity || "medium"
      };

      const response = await fetch(`${API_BASE_URL}/calculate-price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await response.json();
      if (json.success) {
        setPricing(json);
      } else {
        Alert.alert('Error', json.error || 'Failed to calculate price.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setBookingLoading(true);
    try {
      const payload = {
        user_id: "user_client_45",
        provider_id: provider.id,
        date: new Date().toISOString().split('T')[0],
        time_slot: intent.preferred_time || "09:00-12:00",
        price_total: pricing.total_pkr
      };

      const response = await fetch(`${API_BASE_URL}/book-service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await response.json();
      
      if (json.success) {
        navigation.navigate('BookingConfirmation', { receipt: json.receipt });
      } else if (json.conflict) {
        Alert.alert('Slot Taken!', json.message);
      } else {
        Alert.alert('Error', json.error || 'Failed to book.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Calculating dynamic pricing...</Text>
      </View>
    );
  }
  if (!pricing) return null;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Price Estimate</Text>
        <Text style={styles.headerSubtitle}>{provider.name}</Text>
      </View>
      
      <View style={styles.receiptCard}>
        <View style={styles.receiptTicketTop}>
          <Text style={styles.receiptSectionTitle}>Breakdown</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Base Price (2 hrs)</Text>
            <Text style={styles.value}>{pricing.breakdown.base_price} PKR</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Distance Travel Cost</Text>
            <Text style={styles.value}>+{pricing.breakdown.distance_cost} PKR</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Urgency Multiplier</Text>
            <Text style={styles.value}>x{pricing.breakdown.urgency_multiplier}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Complexity Multiplier</Text>
            <Text style={styles.value}>x{pricing.breakdown.complexity_multiplier}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Surge Factor</Text>
            <Text style={styles.value}>x{pricing.breakdown.surge_factor}</Text>
          </View>
          {pricing.breakdown.loyalty_discount_applied && (
            <View style={styles.row}>
              <Text style={styles.labelDiscount}>Loyalty Discount (5%)</Text>
              <Text style={styles.valueDiscount}>-{pricing.breakdown.loyalty_discount_amount} PKR</Text>
            </View>
          )}
        </View>

        <View style={styles.ticketDivider}>
          <View style={styles.ticketNotchLeft} />
          <View style={styles.ticketDashedLine} />
          <View style={styles.ticketNotchRight} />
        </View>

        <View style={styles.receiptTicketBottom}>
          <Text style={styles.totalLabel}>Total Estimate</Text>
          <Text style={styles.totalValue}>{pricing.total_pkr} PKR</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.declineButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.declineText}>Decline</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={{ flex: 1, marginLeft: 10 }} onPress={handleConfirm} disabled={bookingLoading} activeOpacity={0.8}>
          <LinearGradient colors={['#4F46E5', '#3B82F6']} style={styles.confirmButtonGradient}>
            {bookingLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.confirmText}>Confirm Booking</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 5 }} />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 15, fontFamily: 'Inter_400Regular', color: '#64748B' },
  headerContainer: { alignItems: 'center', marginBottom: 25, marginTop: 10 },
  headerTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  headerSubtitle: { fontSize: 16, fontFamily: 'Inter_400Regular', color: '#64748B', marginTop: 4 },
  
  receiptCard: { backgroundColor: 'transparent', marginBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  receiptTicketTop: { backgroundColor: '#fff', padding: 25, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  receiptSectionTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#475569' },
  value: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#1E293B' },
  labelDiscount: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#059669' },
  valueDiscount: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#059669' },
  
  ticketDivider: { height: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', overflow: 'hidden' },
  ticketNotchLeft: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#F8FAFC', position: 'absolute', left: -10 },
  ticketDashedLine: { flex: 1, height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: '#E2E8F0', marginHorizontal: 15 },
  ticketNotchRight: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#F8FAFC', position: 'absolute', right: -10 },
  
  receiptTicketBottom: { backgroundColor: '#fff', padding: 25, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, alignItems: 'center' },
  totalLabel: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#64748B', marginBottom: 5 },
  totalValue: { fontSize: 32, fontFamily: 'Inter_700Bold', color: '#4F46E5' },
  
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  declineButton: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  declineText: { color: '#DC2626', fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  confirmButtonGradient: { padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 16 }
});
