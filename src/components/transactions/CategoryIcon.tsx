import React from 'react';
import { View, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme/colors';

interface CategoryIconProps {
  icon: string;
  color: string;
  size?: 'small' | 'medium' | 'large';
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  icon,
  color,
  size = 'medium',
}) => {
  const getContainerSize = () => {
    switch (size) {
      case 'small':
        return 32;
      case 'medium':
        return 40;
      case 'large':
        return 56;
      default:
        return 40;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'medium':
        return 20;
      case 'large':
        return 28;
      default:
        return 20;
    }
  };

  const containerSize = getContainerSize();
  const iconSize = getIconSize();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: color,
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={icon as any}
        size={iconSize}
        color={colors.neutral.white}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
