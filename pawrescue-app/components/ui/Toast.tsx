import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from './icon-symbol';
import { Colors } from '@/constants/theme';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onHide?: () => void;
}

export const Toast = React.forwardRef<any, ToastProps>(
  ({ visible, message, type = 'success', duration = 3000, onHide }, ref) => {
    const slideAnim = React.useRef(new Animated.Value(0)).current;
    const { width } = Dimensions.get('window');

    useEffect(() => {
      if (visible) {
        Animated.sequence([
          Animated.timing(slideAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(duration),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onHide?.();
        });
      }
    }, [visible]);

    if (!visible) return null;

    const getColors = () => {
      switch (type) {
        case 'success':
          return ['#16A34A', '#15803d'];
        case 'error':
          return ['#DC2626', '#991b1b'];
        case 'warning':
          return ['#F97316', '#ea580c'];
        case 'info':
          return ['#2563EB', '#1d4ed8'];
        default:
          return ['#16A34A', '#15803d'];
      }
    };

    const getIcon = () => {
      switch (type) {
        case 'success':
          return 'checkmark.circle.fill';
        case 'error':
          return 'xmark.circle.fill';
        case 'warning':
          return 'exclamationmark.circle.fill';
        case 'info':
          return 'info.circle.fill';
        default:
          return 'checkmark.circle.fill';
      }
    };

    const translateY = slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-100, 0],
    });

    return (
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        <LinearGradient
          colors={getColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.toast}
        >
          <IconSymbol name={getIcon()} size={24} color="#fff" />
          <Text style={styles.message}>{message}</Text>
        </LinearGradient>
      </Animated.View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    gap: 14,
  },
  message: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    letterSpacing: -0.2,
  },
});
