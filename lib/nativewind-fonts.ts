import { Image, Text, TextInput } from 'react-native';
import { cssInterop } from 'nativewind';

cssInterop(Text, { className: 'style' });
cssInterop(TextInput, { className: 'style' });
cssInterop(Image, { className: 'style' });
