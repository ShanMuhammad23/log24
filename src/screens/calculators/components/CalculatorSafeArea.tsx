import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sharedStyles } from '../theme';

type CalculatorSafeAreaProps = {
  children: React.ReactNode;
};

const CalculatorSafeArea: React.FC<CalculatorSafeAreaProps> = ({ children }) => {
  return (
    <SafeAreaView style={sharedStyles.safe} edges={['top']}>
      {children}
    </SafeAreaView>
  );
};

export default CalculatorSafeArea;
