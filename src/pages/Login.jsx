import React, { useState } from 'react';
import {
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { Shield } from 'lucide-react';
import { auth } from '../firebase';
import { SignInPage } from '../components/ui/sign-in';

const testimonials = [
  {
    avatarSrc: 'https://randomuser.me/api/portraits/women/57.jpg',
    name: 'Ananya Iyer',
    handle: '@chennairesponse',
    text: 'SOS alerts, live location, and media proof stay clear even during tense late-night response calls.',
  },
  {
    avatarSrc: 'https://randomuser.me/api/portraits/women/44.jpg',
    name: 'Kavya Menon',
    handle: '@kochisafety',
    text: 'Our volunteers can coordinate faster because every guardian sees the same verified incident timeline.',
  },
  {
    avatarSrc: 'https://randomuser.me/api/portraits/women/68.jpg',
    name: 'Meera Sharma',
    handle: '@delhicaredesk',
    text: 'The dashboard feels secure, quick, and practical for reviewing emergency updates with families.',
  },
  {
    avatarSrc: 'https://randomuser.me/api/portraits/women/65.jpg',
    name: 'Riya Kapoor',
    handle: '@mumbaisentinel',
    text: 'The alert feed is fast and readable, even when multiple SOS reports arrive together.',
  },
  {
    avatarSrc: 'https://randomuser.me/api/portraits/women/76.jpg',
    name: 'Priya Nair',
    handle: '@bengaluruguard',
    text: 'I like how location, evidence, and family contact details stay organized in one secure view.',
  },
  {
    avatarSrc: 'https://randomuser.me/api/portraits/women/30.jpg',
    name: 'Sneha Kulkarni',
    handle: '@puneresponse',
    text: 'It gives our team the confidence to act quickly without losing track of the case history.',
  },
  {
    avatarSrc: 'https://randomuser.me/api/portraits/women/81.jpg',
    name: 'Aditi Banerjee',
    handle: '@kolkatacare',
    text: 'The interface feels calm, serious, and built for real emergency coordination work.',
  },
  {
    avatarSrc: 'https://randomuser.me/api/portraits/women/48.jpg',
    name: 'Fatima Khan',
    handle: '@hyderabadwatch',
    text: 'Guardian review is smoother now because media, GPS, and status updates are easy to scan.',
  },
];

const provider = new GoogleAuthProvider();

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '').trim();

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error('Login error:', err);
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password'
      ) {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError('Failed to sign in. Check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError('Google sign-in could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const email = window.prompt('Enter your guardian account email to receive a password reset link:');

    if (!email) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await sendPasswordResetEmail(auth, email.trim());
      window.alert('Password reset email sent. Please check your inbox.');
    } catch (err) {
      console.error('Password reset error:', err);
      setError('Unable to send a password reset email for that address.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = () => {
    setError('Guardian accounts are issued by an administrator. Please contact your Shrimati Setu admin.');
  };

  return (
    <SignInPage
      title={
        <span className="flex flex-col gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-[#FF5F8A] to-rose-500 shadow-xl shadow-[#FF5F8A]/30">
            <Shield className="h-6 w-6 text-white" />
          </span>
          <span>
            Shrimati Setu
            <span className="block text-xl font-medium text-slate-400 md:text-2xl">
              Guardian Emergency Console
            </span>
          </span>
        </span>
      }
      description="Access real-time emergency SOS dispatch, live GPS telemetry, and encrypted media review."
      heroImageSrc="/guardian-dashboard-background.png"
      testimonials={testimonials}
      error={error}
      isLoading={loading}
      submitLabel="Login"
      onSignIn={handleLogin}
      onGoogleSignIn={handleGoogleSignIn}
      onResetPassword={handleResetPassword}
      onCreateAccount={handleCreateAccount}
    />
  );
}
