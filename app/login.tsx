import { useSupabaseSession } from '@/utils/auth';
import { useColorScheme } from '@/components/useColorScheme';
import { isNativeGoogleSignInAvailable, isRunningInExpoGo, signInWithGoogleNative } from '@/utils/google-auth';
import { supabase } from '@/utils/supabase';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Linking from 'expo-linking';
import { Link, Redirect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { INK, MIST, NIGHT, SUB } from '@/constants/Colors';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { session, loading } = useSupabaseSession();
  const isDark = useColorScheme() === 'dark';
  const ph = isDark ? MIST : SUB;
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [loadingAction, setLoadingAction] = useState<
    null | 'otp-send' | 'otp-verify' | 'password' | 'google' | 'apple'
  >(null);
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

  /** Password login is for App Store / Play Store review accounts (OTP remains the primary flow). */
  const signInWithPassword = async () => {
    if (!emailAddress.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setErrorMessage(null);
    setLoadingAction('password');
    const { error } = await supabase.auth.signInWithPassword({
      email: emailAddress.trim().toLowerCase(),
      password,
    });
    setLoadingAction(null);

    if (error) {
      setErrorMessage(error.message || 'Could not sign in with password.');
    }
  };

  const signInWithGoogle = async () => {
    setErrorMessage(null);
    setLoadingAction('google');

    try {
      const { error } = await signInWithGoogleNative();
      if (error) {
        setErrorMessage(error);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google Sign-In failed.';
      setErrorMessage(message);
    } finally {
      setLoadingAction(null);
    }
  };

  /** Apple still uses the browser OAuth flow (native Apple uses expo-apple-authentication separately). */
  const signInWithAppleOAuth = async () => {
    setErrorMessage(null);
    setLoadingAction('apple');
    const redirectTo = Linking.createURL('auth/callback');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data?.url) {
      setLoadingAction(null);
      setErrorMessage(error?.message || 'Could not start Apple login.');
      return;
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success' || !result.url) {
      setLoadingAction(null);
      if (result.type !== 'cancel') {
        setErrorMessage('Apple sign in was not completed.');
      }
      return;
    }

    const url = new URL(result.url);
    const code = url.searchParams.get('code');
    if (!code) {
      setLoadingAction(null);
      setErrorMessage('Missing auth code from Apple redirect.');
      return;
    }

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    setLoadingAction(null);
    if (exchangeError) {
      setErrorMessage(exchangeError.message || 'Could not complete Apple sign in.');
    }
  };

  return (
    <View className="flex-1 bg-paper px-6 pt-14 dark:bg-night">
      <Text className="text-3xl font-bold text-ink dark:text-white">Sign in</Text>
      <Text className="mt-2 text-base text-sub dark:text-mist">
        Log in to your logbook with email OTP, Google, or Apple.
      </Text>

      <View className="mt-8">
        <TextInput
          value={emailAddress}
          onChangeText={setEmailAddress}
          placeholder="Email address"
          placeholderTextColor={ph}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
          className="rounded-lg border border-rule bg-white px-4 py-4 text-ink dark:border-ruleDark dark:bg-panel dark:text-white"
        />

        {showPasswordLogin ? (
          <>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={ph}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              className="mt-3 rounded-lg border border-rule bg-white px-4 py-4 text-ink dark:border-ruleDark dark:bg-panel dark:text-white"
            />
            <Pressable
              onPress={signInWithPassword}
              disabled={loadingAction !== null}
              className="mt-3 flex-row items-center justify-center rounded-lg bg-arc py-4 disabled:opacity-60">
              {loadingAction === 'password' ? <ActivityIndicator color={NIGHT} /> : null}
              <Text className="ml-2 text-base font-semibold text-night">Sign in with password</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setShowPasswordLogin(false);
                setPassword('');
                setErrorMessage(null);
              }}
              disabled={loadingAction !== null}
              className="mt-3 py-2">
              <Text className="text-center text-sm font-medium text-arcDeep dark:text-arc">
                Use email OTP instead
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              onPress={sendOtpToEmail}
              disabled={loadingAction !== null}
              className="mt-3 flex-row items-center justify-center rounded-lg bg-arc py-4 disabled:opacity-60">
              {loadingAction === 'otp-send' ? <ActivityIndicator color={NIGHT} /> : null}
              <Text className="ml-2 text-base font-semibold text-night">
                {otpSent ? 'Resend OTP' : 'Send OTP'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setShowPasswordLogin(true);
                setOtpSent(false);
                setOtpCode('');
                setErrorMessage(null);
              }}
              disabled={loadingAction !== null}
              className="mt-3 py-2">
              <Text className="text-center text-sm font-medium text-arcDeep dark:text-arc">
                Sign in with password
              </Text>
            </Pressable>
          </>
        )}
      </View>

      {!showPasswordLogin && otpSent ? (
        <View className="mt-4">
          <TextInput
            value={otpCode}
            onChangeText={setOtpCode}
            placeholder="Enter OTP code"
            placeholderTextColor={ph}
            keyboardType="number-pad"
            className="rounded-lg border border-rule bg-white px-4 py-4 text-ink dark:border-ruleDark dark:bg-panel dark:text-white"
          />
          <Pressable
            onPress={verifyOtpAndLogin}
            disabled={loadingAction !== null}
            className="mt-3 flex-row items-center justify-center rounded-lg bg-arc py-4 disabled:opacity-60">
            {loadingAction === 'otp-verify' ? <ActivityIndicator color={NIGHT} /> : null}
            <Text className="ml-2 text-base font-semibold text-night">Verify OTP</Text>
          </Pressable>
        </View>
      ) : null}

      <View className="my-6 flex-row items-center">
        <View className="h-px flex-1 bg-rule dark:bg-ruleDark" />
        <Text className="mx-3 text-xs font-medium text-sub dark:text-mist">or</Text>
        <View className="h-px flex-1 bg-rule dark:bg-ruleDark" />
      </View>

      {Platform.OS !== 'web' ? (
        <>
          <Pressable
            onPress={signInWithGoogle}
            disabled={loadingAction !== null || !isNativeGoogleSignInAvailable()}
            className="flex-row items-center justify-center rounded-lg border border-rule bg-white py-4 disabled:opacity-60 dark:border-ruleDark dark:bg-panel">
            {loadingAction === 'google' ? <ActivityIndicator color="#2EA8FF" /> : <FontAwesome name="google" size={22} color="#2EA8FF" />}
            <Text className="ml-2 text-base font-semibold text-ink dark:text-white">Continue with Google</Text>
          </Pressable>
          {!isNativeGoogleSignInAvailable() ? (
            <Text className="mt-2 text-center text-xs text-amber-600 dark:text-amber-400">
              {isRunningInExpoGo()
                ? 'Google Sign-In is not available in Expo Go. Use a development or store build.'
                : 'Google Sign-In is missing from this build. Rebuild after setting Google client IDs in EAS.'}
            </Text>
          ) : null}
        </>
      ) : (
        <Text className="text-center text-sm text-sub dark:text-mist">Use the mobile app for Google Sign-In.</Text>
      )}

      <Pressable
        onPress={signInWithAppleOAuth}
        disabled={loadingAction !== null}
        className="mt-3 flex-row items-center justify-center rounded-lg border border-rule bg-white py-4 disabled:opacity-60 dark:border-ruleDark dark:bg-panel">
        {loadingAction === 'apple' ? <ActivityIndicator color={NIGHT} /> : <FontAwesome name="apple" size={24} color={isDark ? '#ffffff' : INK} />}
        <Text className="ml-2 text-base font-semibold text-ink dark:text-white">Continue with Apple</Text>
      </Pressable>

      {errorMessage ? (
        <Text className="mt-4 text-sm text-red-600 dark:text-red-400">{errorMessage}</Text>
      ) : null}

      <View className="mt-5 flex-row items-center justify-center">
        <Text className="text-sm text-sub dark:text-mist">Don&apos;t have an account? </Text>
        <Link href="/get-started" asChild>
          <Pressable>
            <Text className="text-sm font-semibold text-arcDeep dark:text-arc">Get started</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
