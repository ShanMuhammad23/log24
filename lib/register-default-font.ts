import { Platform, Text, TextInput } from 'react-native';
import { AppFontFamily } from '@/constants/fonts';

const defaultTextStyle = {
  fontFamily: Platform.select({
    web: 'Familjen Grotesk',
    default: AppFontFamily.regular,
  }),
};

// Applies Familjen Grotesk to Text/TextInput without a className (RN does not inherit font from parent Views).
if ((Text as { defaultProps?: { style?: object } }).defaultProps == null) {
  (Text as { defaultProps?: { style?: object } }).defaultProps = {};
}
(Text as { defaultProps: { style?: object } }).defaultProps.style = defaultTextStyle;

if ((TextInput as { defaultProps?: { style?: object } }).defaultProps == null) {
  (TextInput as { defaultProps?: { style?: object } }).defaultProps = {};
}
(TextInput as { defaultProps: { style?: object } }).defaultProps.style = defaultTextStyle;
