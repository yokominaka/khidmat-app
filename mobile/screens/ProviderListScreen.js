import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Animated } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../config';

export default function ProviderListScreen({ route, navigation }) {
  const { intent } = route.params;
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/match-providers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intent)
      });
      const json = await response.json();
      if (json.success) {
        if (json.ranked_list && json.ranked_list.length === 0) {
          Alert.alert('No Providers', 'Could not find any providers for this request.');
        }
        setProviders(json.ranked_list || []);
      } else {
        Alert.alert('Error', 'Failed to fetch providers.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item, index }) => {
    return (
      <ProviderCard 
        item={item} 
        index={index}
        isExpanded={expandedId === item.id}
        onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
        onSelect={() => navigation.navigate('Pricing', { intent, provider: item })}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={styles.loadingText}>Finding best matches...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4F46E5', '#0D9488']} style={styles.headerBanner}>
        <Ionicons name="search" size={24} color="#fff" />
        <Text style={styles.headerText}>Top matches for {intent.service_type} in {intent.location}</Text>
      </LinearGradient>
      
      <FlatList
        data={providers}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 15, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// Separate component for Animation scope
function ProviderCard({ item, index, isExpanded, onToggleExpand, onSelect }) {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateY: slideAnim }], opacity: fadeAnim }}>
      <TouchableOpacity 
        style={styles.card} 
        onPress={onSelect}
        onLongPress={onToggleExpand}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>

        <View style={styles.cardRow}>
          <View style={styles.badgeInfo}>
            <Feather name="map-pin" size={12} color="#0D9488" />
            <Text style={styles.badgeText}>{item.distance_km} km</Text>
          </View>
          <View style={styles.badgeInfo}>
            <Feather name="clock" size={12} color="#0D9488" />
            <Text style={styles.badgeText}>{Math.round(item.on_time_score * 100)}% On-time</Text>
          </View>
          {item.risk_score === 'high' && (
            <View style={styles.badgeDanger}>
              <Ionicons name="warning" size={12} color="#DC2626" />
              <Text style={styles.badgeDangerText}>High Risk</Text>
            </View>
          )}
        </View>
        
        <View style={styles.specs}>
          {item.specializations.map((spec, i) => (
            <View key={i} style={styles.specBadge}>
              <Text style={styles.specBadgeText}>{spec}</Text>
            </View>
          ))}
        </View>

        {isExpanded && (
          <View style={styles.breakdown}>
            <Text style={styles.breakdownTitle}>AI Match Score: {item.algorithm_score}</Text>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownText}>Distance: {item.metrics_breakdown.distance.toFixed(2)}</Text>
              <Text style={styles.breakdownText}>Rating: {item.metrics_breakdown.rating.toFixed(2)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownText}>OnTime: {item.metrics_breakdown.onTime.toFixed(2)}</Text>
              <Text style={styles.breakdownText}>Availability: {item.metrics_breakdown.availability.toFixed(2)}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 15, fontFamily: 'Inter_400Regular', color: '#64748B' },
  headerBanner: { padding: 20, flexDirection: 'row', alignItems: 'center', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  headerText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff', marginLeft: 10 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  name: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#1E293B', flex: 1 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  ratingText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#D97706', marginLeft: 4 },
  cardRow: { flexDirection: 'row', marginBottom: 15, flexWrap: 'wrap', gap: 10 },
  badgeInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#CCFBF1', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  badgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#0F766E', marginLeft: 4 },
  badgeDanger: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  badgeDangerText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#B91C1C', marginLeft: 4 },
  specs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  specBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  specBadgeText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#475569' },
  breakdown: { backgroundColor: '#F8FAFC', padding: 15, borderRadius: 10, marginTop: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  breakdownTitle: { fontFamily: 'Inter_700Bold', color: '#334155', marginBottom: 8, fontSize: 13 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  breakdownText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#64748B' }
});
