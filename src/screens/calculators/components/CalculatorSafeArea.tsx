import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCalculatorTheme } from '../theme';

type CalculatorSafeAreaProps = {
  children: React.ReactNode;
};

const CalculatorSafeArea: React.FC<CalculatorSafeAreaProps> = ({ children }) => {
  const { styles } = useCalculatorTheme();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {children}
    </SafeAreaView>
  );
};

export default CalculatorSafeArea;
