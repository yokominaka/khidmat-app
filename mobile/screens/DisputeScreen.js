import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../config';

export default function DisputeScreen({ route, navigation }) {
  const { provider_id, booking_id } = route.params || {};
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Details Required', 'Please provide details about the issue.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        booking_id,
        user_id: "user_client_45",
        description,
        evidence_urls: []
      };

      const response = await fetch(`${API_BASE_URL}/file-dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await response.json();
      if (json.success) {
        setSubmitted(true);
      } else {
        Alert.alert('Error', 'Failed to file dispute.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="shield-checkmark" size={60} color="#DC2626" />
        </View>
        <Text style={styles.successText}>Dispute Submitted</Text>
        <Text style={styles.successSubtext}>Our support team will review this within 24 hours.</Text>
        
        <TouchableOpacity style={styles.homeButtonContainer} onPress={() => navigation.popToTop()}>
          <LinearGradient colors={['#4F46E5', '#3B82F6']} style={styles.buttonGradient}>
            <Text style={styles.btnText}>Return to Home</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={24} color="#B91C1C" />
          <Text style={styles.warningText}>We take disputes seriously. Please describe the issue clearly.</Text>
        </View>

        <Text style={styles.label}>Booking ID: {booking_id}</Text>

        <TextInput
          style={styles.input}
          placeholder="Describe the issue with the provider or service..."
          placeholderTextColor="#94A3B8"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <TouchableOpacity style={styles.submitButtonContainer} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
          <LinearGradient colors={['#DC2626', '#B91C1C']} style={styles.buttonGradient}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit Dispute</Text>}
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 25, backgroundColor: '#F8FAFC' },
  centerContainer: { flex: 1, padding: 30, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  
  warningBanner: { flexDirection: 'row', backgroundColor: '#FEE2E2', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 25 },
  warningText: { color: '#991B1B', fontFamily: 'Inter_600SemiBold', fontSize: 14, marginLeft: 10, flex: 1 },
  
  label: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#475569', marginBottom: 15 },
  
  input: { width: '100%', backgroundColor: '#fff', padding: 20, borderRadius: 16, minHeight: 180, textAlignVertical: 'top', marginBottom: 30, fontFamily: 'Inter_400Regular', fontSize: 16, color: '#1E293B', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  
  submitButtonContainer: { width: '100%', shadowColor: '#DC2626', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  buttonGradient: { padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  
  cancelButton: { marginTop: 20, padding: 15, alignItems: 'center' },
  cancelText: { color: '#64748B', fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successText: { fontSize: 24, fontFamily: 'Inter_700Bold', color: '#DC2626', marginBottom: 10 },
  successSubtext: { fontSize: 15, fontFamily: 'Inter_400Regular', color: '#64748B', textAlign: 'center', marginBottom: 40 },
  homeButtonContainer: { width: '100%', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 }
});
