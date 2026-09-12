import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface CustomRefreshHeaderProps {
  isRefreshing: boolean;
}

export const CustomRefreshHeader: React.FC<CustomRefreshHeaderProps> = ({ isRefreshing }) => {
  const { colors, typography } = useTheme();
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (isRefreshing) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
      pulse.value = withRepeat(
        withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      rotation.value = 0;
      pulse.value = 1;
    }
  }, [isRefreshing]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: pulse.value }],
  }));

  if (!isRefreshing) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.iconBox,
          { backgroundColor: colors.accentSubtle },
          animatedIconStyle,
        ]}
      >
        <Ionicons name="sparkles" size={18} color={colors.accent} />
      </Animated.View>

      <View style={styles.textColumn}>
        <Text style={[typography.badge, { color: colors.accent, fontSize: 10.5 }]}>
          DIGESTLY LIVE RADAR
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          Scanning Dawn, Tribune & Geo News...
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    justifyContent: 'center',
  },
});
