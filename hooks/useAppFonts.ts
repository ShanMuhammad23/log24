import {
  FamiljenGrotesk_400Regular,
  FamiljenGrotesk_400Regular_Italic,
  FamiljenGrotesk_500Medium,
  FamiljenGrotesk_600SemiBold,
  FamiljenGrotesk_700Bold,
  useFonts,
} from '@expo-google-fonts/familjen-grotesk';

export function useAppFonts() {
  return useFonts({
    FamiljenGrotesk_400Regular,
    FamiljenGrotesk_400Regular_Italic,
    FamiljenGrotesk_500Medium,
    FamiljenGrotesk_600SemiBold,
    FamiljenGrotesk_700Bold,
  });
}
