import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import './Payment.css';

export default function Payment() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { attemptId, amount, returnTo } = location.state || {};

  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Someone landed here directly (e.g. via a bookmarked/shared link) without
  // going through the quiz flow - there's nothing to pay for.
  if (!attemptId || !amount) {
    return (
      <div className="payment-container">
        <div className="payment-card">
          <p className="empty-title">Nothing to pay for</p>
          <p className="empty-subtitle">Start a quiz first to unlock payment.</p>
          <button className="btn-primary" onClick={() => navigate('/quizzes')}>
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  const handlePayment = async (e) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const reference = `PAY-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          quiz_id: quizId,
          amount,
          payment_method: 'airtime',
          reference,
          status: 'pending',
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Simulated processing delay - see README for swapping in a real
      // mobile money / airtime billing provider.
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await supabase
        .from('payments')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', paymentData.id);

      await supabase
        .from('quiz_attempts')
        .update({ is_paid: true, payment_reference: reference })
        .eq('id', attemptId);

      alert(`Payment successful! Thank you for your payment of K${amount}.`);
      navigate(returnTo || '/quizzes');
    } catch (err) {
      setError('Payment failed. Please try again or use another payment method.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-container">
      <header className="payment-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <h1>Payment</h1>
        <div style={{ width: 20 }} />
      </header>

      <div className="payment-content">
        <div className="summary-card">
          <p className="summary-title">Quiz Access</p>
          <p className="summary-amount">K{amount}.00</p>
          <p className="summary-subtext">Unlock the full quiz to continue learning</p>
        </div>

        <form onSubmit={handlePayment} className="payment-form">
          <p className="section-title">Payment Method</p>
          <div className="method-option selected">
            <span>📱 Airtime / Mobile Money</span>
          </div>

          {error && <div className="error-message">{error}</div>}

          <label className="input-label">Phone Number</label>
          <input
            className="phone-input"
            type="tel"
            placeholder="0977123456"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            maxLength={10}
          />

          <button type="submit" className="pay-btn" disabled={loading}>
            {loading ? 'Processing...' : `Pay K${amount}.00`}
          </button>

          <p className="secure-text">🔒 Secure payment protected</p>
        </form>
      </div>
    </div>
  );
}
