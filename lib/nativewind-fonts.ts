import { Text, TextInput } from 'react-native';
import { cssInterop } from 'nativewind';

cssInterop(Text, { className: 'style' });
cssInterop(TextInput, { className: 'style' });
