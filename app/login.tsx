import { Link } from 'expo-router';
import { Redirect } from 'expo-router';
import { useAuth, useSignIn, useSSO } from '@clerk/expo';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, TextInput, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function LoginScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn } = useSignIn();
  const { startSSOFlow } = useSSO();
  const [emailAddress, setEmailAddress] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loadingAction, setLoadingAction] = useState<null | 'otp-send' | 'otp-verify' | 'google' | 'apple'>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (isLoaded && isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  const sendOtpToEmail = async () => {
    if (!signIn) return;
    if (!emailAddress.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setErrorMessage(null);
    setLoadingAction('otp-send');
    const response = await signIn.emailCode.sendCode({ emailAddress: emailAddress.trim().toLowerCase() });
    setLoadingAction(null);

    if (response.error) {
      setErrorMessage(response.error.message || 'Could not send OTP code.');
      return;
    }

    setOtpSent(true);
  };

  const verifyOtpAndLogin = async () => {
    if (!signIn) return;
    if (!otpCode.trim()) {
      setErrorMessage('Please enter the verification code.');
      return;
    }

    setErrorMessage(null);
    setLoadingAction('otp-verify');

    const verifyResponse = await signIn.emailCode.verifyCode({ code: otpCode.trim() });
    if (verifyResponse.error) {
      setLoadingAction(null);
      setErrorMessage(verifyResponse.error.message || 'Invalid verification code.');
      return;
    }

    const finalizeResponse = await signIn.finalize();
    setLoadingAction(null);

    if (finalizeResponse.error) {
      setErrorMessage(finalizeResponse.error.message || 'Could not complete sign in.');
    }
  };

  const signInWithSSO = async (strategy: 'oauth_google' | 'oauth_apple') => {
    setErrorMessage(null);
    setLoadingAction(strategy === 'oauth_google' ? 'google' : 'apple');

    try {
      const { createdSessionId, setActive } = await startSSOFlow({ strategy });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      } else {
        setErrorMessage('Authentication is incomplete. Please try again.');
      }
    } catch (error: any) {
      setErrorMessage(error?.errors?.[0]?.message || error?.message || 'Sign in failed. Please try again.');
    } finally {
      setLoadingAction(null);
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
        onPress={() => signInWithSSO('oauth_google')}
        disabled={loadingAction !== null}
        className="flex-row items-center justify-center rounded-2xl border border-zinc-300 bg-zinc-50 py-4 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900">
        {loadingAction === 'google' ? <ActivityIndicator color="#2563eb" /> : null}
        <FontAwesome name="google" size={24} color="#2563eb" />
        <Text className="ml-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">Continue with Google</Text>
      </Pressable>

      <Pressable
        onPress={() => signInWithSSO('oauth_apple')}
        disabled={loadingAction !== null}
        className="mt-3 flex-row items-center justify-center rounded-2xl border border-zinc-300 bg-zinc-50 py-4 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900">
        {loadingAction === 'apple' ? <ActivityIndicator color="#111827" /> : null}
        <FontAwesome name="apple" size={24} color="#111827" />
        <Text className="ml-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">Continue with Apple</Text>
      </Pressable>

      {Platform.OS !== 'ios' ? (
        <Text className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Apple sign in works on iOS devices.
        </Text>
      ) : null}

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
