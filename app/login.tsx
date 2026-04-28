import { useSupabaseSession } from '@/utils/auth';
import { supabase } from '@/utils/supabase';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Linking from 'expo-linking';
import { Link, Redirect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { session, loading } = useSupabaseSession();
  const [emailAddress, setEmailAddress] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loadingAction, setLoadingAction] = useState<null | 'otp-send' | 'otp-verify' | 'google' | 'apple'>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!loading && session) {
    return <Redirect href="/(tabs)" />;
  }

  const sendOtpToEmail = async () => {
    if (!emailAddress.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setErrorMessage(null);
    setLoadingAction('otp-send');
    const { error } = await supabase.auth.signInWithOtp({
      email: emailAddress.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    setLoadingAction(null);

    if (error) {
      setErrorMessage(error.message || 'Could not send OTP code.');
      return;
    }

    setOtpSent(true);
  };

  const verifyOtpAndLogin = async () => {
    if (!otpCode.trim()) {
      setErrorMessage('Please enter the verification code.');
      return;
    }

    setErrorMessage(null);
    setLoadingAction('otp-verify');

    const { error } = await supabase.auth.verifyOtp({
      email: emailAddress.trim().toLowerCase(),
      token: otpCode.trim(),
      type: 'email',
    });
    if (error) {
      setLoadingAction(null);
      setErrorMessage(error.message || 'Invalid verification code.');
      return;
    }

    setLoadingAction(null);
  };

  const signInWithOAuth = async (provider: 'google' | 'apple') => {
    setErrorMessage(null);
    setLoadingAction(provider);
    const redirectTo = Linking.createURL('auth/callback');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data?.url) {
      setLoadingAction(null);
      setErrorMessage(error?.message || `Could not start ${provider} login.`);
      return;
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success' || !result.url) {
      setLoadingAction(null);
      if (result.type !== 'cancel') {
        setErrorMessage(`${provider === 'google' ? 'Google' : 'Apple'} sign in was not completed.`);
      }
      return;
    }

    const url = new URL(result.url);
    const code = url.searchParams.get('code');
    if (!code) {
      setLoadingAction(null);
      setErrorMessage('Missing auth code from OAuth redirect.');
      return;
    }

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    setLoadingAction(null);
    if (exchangeError) {
      setErrorMessage(exchangeError.message || 'Could not complete OAuth sign in.');
    }
  };

  return (
    <View className="flex-1 bg-white px-6 pt-14 dark:bg-zinc-950">
      <Text className="text-3xl font-extrabold text-zinc-950 dark:text-zinc-50">Login</Text>
      <Text className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
        Continue with email OTP, Google, or Apple.
      </Text>

      <View className="mt-8">
        <TextInput
          value={emailAddress}
          onChangeText={setEmailAddress}
          placeholder="Email address"
          placeholderTextColor="#71717a"
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
          className="rounded-2xl border border-zinc-300 bg-zinc-50 px-4 py-4 text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <Pressable
          onPress={sendOtpToEmail}
          disabled={loadingAction !== null}
          className="mt-3 flex-row items-center justify-center rounded-2xl bg-zinc-950 py-4 disabled:opacity-60 dark:bg-zinc-50">
          {loadingAction === 'otp-send' ? <ActivityIndicator color="#ffffff" /> : null}
          <Text className="ml-2 text-base font-semibold text-zinc-50 dark:text-zinc-950">
            {otpSent ? 'Resend OTP' : 'Send OTP'}
          </Text>
        </Pressable>
      </View>

      {otpSent ? (
        <View className="mt-4">
          <TextInput
            value={otpCode}
            onChangeText={setOtpCode}
            placeholder="Enter OTP code"
            placeholderTextColor="#71717a"
            keyboardType="number-pad"
            className="rounded-2xl border border-zinc-300 bg-zinc-50 px-4 py-4 text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <Pressable
            onPress={verifyOtpAndLogin}
            disabled={loadingAction !== null}
            className="mt-3 flex-row items-center justify-center rounded-2xl bg-blue-600 py-4 disabled:opacity-60">
            {loadingAction === 'otp-verify' ? <ActivityIndicator color="#ffffff" /> : null}
            <Text className="ml-2 text-base font-semibold text-white">Verify OTP & Login</Text>
          </Pressable>
        </View>
      ) : null}

      <View className="my-6 flex-row items-center">
        <View className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        <Text className="mx-3 text-xs font-semibold uppercase text-zinc-500">or</Text>
        <View className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </View>

      <Pressable
        onPress={() => signInWithOAuth('google')}
        disabled={loadingAction !== null}
        className="flex-row items-center justify-center rounded-2xl border border-zinc-300 bg-zinc-50 py-4 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900">
        {loadingAction === 'google' ? <ActivityIndicator color="#2563eb" /> : <FontAwesome name="google" size={22} color="#2563eb" />}
        <Text className="ml-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">Continue with Google</Text>
      </Pressable>

      <Pressable
        onPress={() => signInWithOAuth('apple')}
        disabled={loadingAction !== null}
        className="mt-3 flex-row items-center justify-center rounded-2xl border border-zinc-300 bg-zinc-50 py-4 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900">
        {loadingAction === 'apple' ? <ActivityIndicator color="#111827" /> : <FontAwesome name="apple" size={24} className='text-zinc-900 dark:text-zinc-100' color={'#ffffff'}/>}
        <Text className="ml-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">Continue with Apple</Text>
      </Pressable>

      {errorMessage ? (
        <Text className="mt-4 text-sm text-red-600 dark:text-red-400">{errorMessage}</Text>
      ) : null}

      <View className="mt-5 flex-row items-center justify-center">
        <Text className="text-sm text-zinc-600 dark:text-zinc-400">Don&apos;t have an account? </Text>
        <Link href="/get-started" asChild>
          <Pressable>
            <Text className="text-sm font-semibold text-zinc-950 underline dark:text-zinc-50">Get Started</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
