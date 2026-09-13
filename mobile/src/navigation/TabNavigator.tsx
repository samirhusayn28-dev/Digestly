import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { MainTabParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { BookmarksScreen } from '../screens/BookmarksScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { useTheme } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

interface AnimatedTabIconProps {
  focused: boolean;
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  dotColor: string;
}

const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({ focused, name, color, dotColor }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (focused) {
      scale.value = withSequence(
        withSpring(1.18, { damping: 10, stiffness: 400 }),
        withSpring(1.0, { damping: 12, stiffness: 300 })
      );
    } else {
      scale.value = withSpring(1.0);
    }
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.iconWrapper, animatedStyle]}>
      <Ionicons name={name} size={20} color={color} />
      {focused && <View style={[styles.activeDot, { backgroundColor: dotColor }]} />}
    </Animated.View>
  );
};

export const TabNavigator: React.FC = () => {
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: '#090D16',
          borderTopWidth: 1,
          borderTopColor: '#1A2130',
          height: Platform.OS === 'ios' ? 84 : 62 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom > 0 ? insets.bottom + 4 : 8,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.35,
          shadowRadius: 6,
        },
        tabBarActiveTintColor: '#38BDF8',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'newspaper-outline';

          if (route.name === 'Feed') {
            iconName = 'newspaper-outline';
          } else if (route.name === 'Discover') {
            iconName = 'compass-outline';
          } else if (route.name === 'Bookmarks') {
            iconName = 'bookmark-outline';
          } else if (route.name === 'Settings') {
            iconName = 'settings-outline';
          }

          return (
            <AnimatedTabIcon
              focused={focused}
              name={iconName}
              color={color}
              dotColor="#38BDF8"
            />
          );
        },
      })}
    >
      <Tab.Screen name="Feed" component={HomeScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Bookmarks" component={BookmarksScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 26,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});
