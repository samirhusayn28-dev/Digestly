import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { InterestsScreen } from '../screens/InterestsScreen';
import { TabNavigator } from './TabNavigator';
import { ArticleDetailScreen } from '../screens/ArticleDetailScreen';
import { useTheme } from '../theme';

import { useAppStore } from '../store/useAppStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { colors } = useTheme();
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const user = useAppStore((state) => state.user);
  const isGuest = useAppStore((state) => state.isGuest);

  const isReturningUser = hasCompletedOnboarding || !!user || isGuest;

  return (
    <Stack.Navigator
      initialRouteName={isReturningUser ? 'MainTabs' : 'Splash'}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Interests" component={InterestsScreen} />
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen
        name="ArticleDetail"
        component={ArticleDetailScreen}
        options={{
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
};
