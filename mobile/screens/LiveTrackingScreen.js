import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';

const TIMELINE_STAGES = [
  { label: "Confirmed", icon: "checkmark-circle" },
  { label: "Reminder sent", icon: "notifications" },
  { label: "En-route", icon: "car" },
  { label: "Arrived", icon: "location" },
  { label: "Complete", icon: "star" }
];

export default function LiveTrackingScreen({ route, navigation }) {
  const { booking_id, provider_id } = route.params;
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    fetch(`${API_BASE_URL}/simulate-followup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id })
    }).catch(e => console.log('Simulation call failed:', e));

    let stage = 0;
    const interval = setInterval(() => {
      stage += 1;
      if (stage < TIMELINE_STAGES.length) {
        setCurrentStage(stage);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          navigation.navigate('Feedback', { provider_id, booking_id });
        }, 1500);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Live Updates</Text>
      <Text style={styles.headerSubtitle}>Booking ID: {booking_id.substring(0, 12)}...</Text>
      
      <View style={styles.timelineContainer}>
        {TIMELINE_STAGES.map((stage, index) => {
          const isActive = index === currentStage;
          const isPast = index < currentStage;
          return (
            <TimelineItem 
              key={index} 
              stage={stage} 
              isActive={isActive} 
              isPast={isPast} 
              isLast={index === TIMELINE_STAGES.length - 1} 
            />
          );
        })}
      </View>
    </View>
  );
}

function TimelineItem({ stage, isActive, isPast, isLast }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.5, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isActive]);

  return (
    <View style={styles.stageContainer}>
      <View style={styles.dotColumn}>
        <View style={styles.iconContainer}>
          {isActive && (
            <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }], opacity: pulseAnim.interpolate({ inputRange: [1, 1.5], outputRange: [0.6, 0] }) }]} />
          )}
          <View style={[styles.dot, isPast ? styles.dotPast : isActive ? styles.dotActive : styles.dotFuture]}>
            <Ionicons name={stage.icon} size={14} color={isPast || isActive ? "#fff" : "#94A3B8"} />
          </View>
        </View>
        {!isLast && <View style={[styles.line, isPast ? styles.linePast : styles.lineFuture]} />}
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.stageText, isActive && styles.stageTextActive, isPast && styles.stageTextPast]}>
          {stage.label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, backgroundColor: '#F8FAFC' },
  headerTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', color: '#1E293B', textAlign: 'center', marginTop: 10 },
  headerSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#64748B', textAlign: 'center', marginBottom: 50, marginTop: 5 },
  
  timelineContainer: { flex: 1, paddingLeft: 20 },
  stageContainer: { flexDirection: 'row', alignItems: 'flex-start', height: 80 },
  
  dotColumn: { alignItems: 'center', width: 40 },
  iconContainer: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  
  pulseRing: { position: 'absolute', width: 28, height: 28, borderRadius: 14, backgroundColor: '#4F46E5' },
  dot: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  dotPast: { backgroundColor: '#10B981' }, // Emerald
  dotActive: { backgroundColor: '#4F46E5', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 5 },
  dotFuture: { backgroundColor: '#E2E8F0' },
  
  line: { width: 2, height: 50, zIndex: 1, marginTop: 4 },
  linePast: { backgroundColor: '#10B981' },
  lineFuture: { backgroundColor: '#E2E8F0' },
  
  textContainer: { justifyContent: 'center', height: 28, marginLeft: 15 },
  stageText: { fontSize: 16, fontFamily: 'Inter_400Regular', color: '#94A3B8' },
  stageTextPast: { color: '#64748B', fontFamily: 'Inter_600SemiBold' },
  stageTextActive: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#1E293B' }
});
