import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';

export default function ChatInputScreen({ navigation }) {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [clarification, setClarification] = useState(null);
  const [isUrduKeyboard, setIsUrduKeyboard] = useState(false);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setClarification(null);

    try {
      const response = await fetch(`${API_BASE_URL}/parse-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: inputText })
      });
      
      const json = await response.json();
      
      if (json.success && json.data) {
        setInputText(''); // Clear input after processing
        if (json.data.confidence_score < 0.70) {
          setClarification(json.data.clarification_question);
        } else {
          navigation.navigate('ProviderList', { intent: json.data });
        }
      } else {
        Alert.alert('Error', json.error || 'Failed to parse intent.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
    >
      <View style={styles.chatHistory}>
        <View style={styles.botMessageContainer}>
          <View style={styles.botAvatar}>
            <Ionicons name="sparkles" size={16} color="#fff" />
          </View>
          <View style={styles.botBubble}>
            <Text style={styles.botText}>
              Hi! Tell me what service you need and where. For example: "I need an AC technician in G-13 tomorrow morning."
            </Text>
          </View>
        </View>

        {clarification && (
          <View style={[styles.botMessageContainer, { marginTop: 15 }]}>
            <View style={[styles.botAvatar, { backgroundColor: '#EF4444' }]}>
              <Ionicons name="help-outline" size={18} color="#fff" />
            </View>
            <View style={[styles.botBubble, styles.botBubbleError]}>
              <Text style={styles.botTextError}>{clarification}</Text>
            </View>
          </View>
        )}
      </View>
      
      <View style={styles.inputWrapper}>
        <View style={styles.inputContainer}>
          <TouchableOpacity 
            style={[styles.langToggle, isUrduKeyboard && styles.langToggleActive]} 
            onPress={() => setIsUrduKeyboard(!isUrduKeyboard)}
          >
            <Text style={[styles.langText, isUrduKeyboard && styles.langTextActive]}>
              {isUrduKeyboard ? 'UR' : 'EN'}
            </Text>
          </TouchableOpacity>
          
          <TextInput
            style={[styles.input, isUrduKeyboard && styles.urduInput]}
            placeholder="Type your request..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
            onPress={handleSend} 
            disabled={loading || !inputText.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="send" size={20} color={inputText.trim() ? "#fff" : "#A7F3D0"} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'space-between' },
  chatHistory: { padding: 20, flex: 1, justifyContent: 'flex-end' },
  botMessageContainer: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  botAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  botBubble: { backgroundColor: '#fff', padding: 15, borderRadius: 20, borderBottomLeftRadius: 5, maxWidth: '80%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  botText: { fontFamily: 'Inter_400Regular', fontSize: 15, color: '#334155', lineHeight: 22 },
  botBubbleError: { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1 },
  botTextError: { fontFamily: 'Inter_400Regular', fontSize: 15, color: '#B91C1C', lineHeight: 22 },
  inputWrapper: { padding: 15, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 5 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 25, paddingHorizontal: 10, paddingVertical: 8 },
  langToggle: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#E2E8F0', borderRadius: 20, marginRight: 10 },
  langToggleActive: { backgroundColor: '#0D9488' },
  langText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#64748B' },
  langTextActive: { color: '#fff' },
  input: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 16, color: '#1E293B', minHeight: 40, maxHeight: 100 },
  urduInput: { writingDirection: 'rtl', textAlign: 'right' },
  sendButton: { backgroundColor: '#0D9488', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  sendButtonDisabled: { backgroundColor: '#99F6E4' }
});
