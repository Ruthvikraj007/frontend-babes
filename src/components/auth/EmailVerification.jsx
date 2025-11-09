import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './EmailVerification.css';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/verify-email/${token}`
        );

        if (response.data.success) {
          setStatus('success');
          setMessage(response.data.message);
          
          // Save token and user data using the keys the app expects
          // (AuthContext reads `signlink_token` and `signlink_user`)
          if (response.data.token) {
            localStorage.setItem('signlink_token', response.data.token);
            localStorage.setItem('signlink_user', JSON.stringify(response.data.user));
          }

          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'Email verification failed');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  const handleResendEmail = async () => {
    try {
      const email = prompt('Please enter your email address:');
      if (!email) return;

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/resend-verification`,
        { email }
      );

      alert(response.data.message);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to resend verification email');
    }
  };

  return (
    <div className="email-verification-container">
      <div className="verification-card">
        {status === 'verifying' && (
          <>
            <div className="spinner"></div>
            <h2>Verifying Your Email...</h2>
            <p>Please wait while we verify your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="success-icon">✅</div>
            <h2>Email Verified Successfully!</h2>
            <p>{message}</p>
            <p className="redirect-message">Redirecting to Dashboard in 3 seconds...</p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary">
              Go to Dashboard Now
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="error-icon">❌</div>
            <h2>Verification Failed</h2>
            <p>{message}</p>
            <div className="button-group">
              <button onClick={handleResendEmail} className="btn-secondary">
                Resend Verification Email
              </button>
              <button onClick={() => navigate('/login')} className="btn-primary">
                Go to Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;
