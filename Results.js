import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../utils/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function Payment({ navigation, route }) {
  const { quizId, attemptId, amount, onPaymentComplete } = route.params;
  const [paymentMethod, setPaymentMethod] = useState('airtime');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create payment record
      const reference = `PAY-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          quiz_id: quizId,
          amount: amount,
          payment_method: paymentMethod,
          reference: reference,
          status: 'pending',
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update payment status
      await supabase
        .from('payments')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', paymentData.id);

      // Update quiz attempt
      await supabase
        .from('quiz_attempts')
        .update({ is_paid: true, payment_reference: reference })
        .eq('id', attemptId);

      Alert.alert(
        'Payment Successful',
        `Thank you for your payment of K${amount}. You can now continue with the quiz.`,
        [
          {
            text: 'Continue',
            onPress: () => {
              if (onPaymentComplete) {
                onPaymentComplete();
              }
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Payment Failed', 'Please try again or use another payment method');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Quiz Access</Text>
          <Text style={styles.summaryAmount}>K{amount}.00</Text>
          <Text style={styles.summarySubtext}>
            Unlock full quiz to continue learning
          </Text>
        </View>

        <View style={styles.paymentMethods}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <TouchableOpacity
            style={[
              styles.methodOption,
              paymentMethod === 'airtime' && styles.methodSelected,
            ]}
            onPress={() => setPaymentMethod('airtime')}
          >
            <Ionicons
              name="phone-portrait-outline"
              size={24}
              color={paymentMethod === 'airtime' ? '#FF6B00' : '#666'}
            />
            <Text style={styles.methodText}>Airtime / Mobile Money</Text>
            {paymentMethod === 'airtime' && (
              <Ionicons name="checkmark-circle" size={24} color="#FF6B00" />
            )}
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="0977123456"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.payButton}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>Pay K{amount}.00</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.secureText}>
          <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
          {' '}Secure payment protected
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#FF6B00',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#666',
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF6B00',
    marginVertical: 10,
  },
  summarySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  paymentMethods: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    marginBottom: 15,
  },
  methodSelected: {
    borderColor: '#FF6B00',
    backgroundColor: '#FF6B0010',
  },
  methodText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  inputContainer: {
    marginTop: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
  },
  payButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secureText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
});