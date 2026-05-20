import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../config';

export default function FeedbackScreen({ route, navigation }) {
  const { provider_id, booking_id } = route.params || { provider_id: 'prov_ac_001', booking_id: 'book_demo' };
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Hold on', 'Please select a star rating first!');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/submit-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider_id, rating, comment })
      });
      const json = await response.json();
      if (json.success) {
        setSubmitted(true);
      } else {
        Alert.alert('Error', 'Failed to submit feedback.');
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
        <Ionicons name="heart" size={80} color="#10B981" style={{ marginBottom: 20 }} />
        <Text style={styles.successText}>Thanks for your feedback!</Text>
        
        <TouchableOpacity style={styles.homeButtonContainer} onPress={() => navigation.popToTop()}>
          <LinearGradient colors={['#10B981', '#059669']} style={styles.buttonGradient}>
            <Text style={styles.btnText}>Return to Home</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.disputeButton} onPress={() => navigation.navigate('Dispute', { booking_id, provider_id })}>
          <Text style={styles.disputeText}>Had an issue? File a Dispute</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <Text style={styles.header}>How was your service?</Text>
      <Text style={styles.subtext}>Your feedback helps us improve.</Text>
      
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
            <Ionicons 
              name={rating >= star ? "star" : "star-outline"} 
              size={50} 
              color={rating >= star ? "#F59E0B" : "#CBD5E1"} 
              style={{ marginHorizontal: 5 }} 
            />
          </TouchableOpacity>
        ))}
      </View>
      
      <TextInput
        style={styles.input}
        placeholder="Leave a comment (optional)..."
        placeholderTextColor="#94A3B8"
        value={comment}
        onChangeText={setComment}
        multiline
      />

      <TouchableOpacity style={styles.submitButtonContainer} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
        <LinearGradient colors={['#4F46E5', '#0D9488']} style={styles.buttonGradient}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit Feedback</Text>}
        </LinearGradient>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  centerContainer: { flex: 1, padding: 30, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  header: { fontSize: 26, fontFamily: 'Inter_700Bold', color: '#1E293B', marginBottom: 5 },
  subtext: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#64748B', marginBottom: 40 },
  
  starsContainer: { flexDirection: 'row', marginBottom: 40 },
  
  input: { width: '100%', backgroundColor: '#fff', padding: 20, borderRadius: 16, minHeight: 120, textAlignVertical: 'top', marginBottom: 40, fontFamily: 'Inter_400Regular', fontSize: 16, color: '#1E293B', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  
  submitButtonContainer: { width: '100%', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  homeButtonContainer: { width: '100%', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  buttonGradient: { padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  
  successText: { fontSize: 24, fontFamily: 'Inter_700Bold', color: '#10B981', marginBottom: 40 },
  
  disputeButton: { marginTop: 25, padding: 10 },
  disputeText: { color: '#DC2626', fontFamily: 'Inter_600SemiBold', textDecorationLine: 'underline', fontSize: 14 }
});
