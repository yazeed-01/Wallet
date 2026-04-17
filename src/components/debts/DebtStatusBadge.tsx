// DebtStatusBadge - Visual indicator for debt payment status
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { DebtStatus } from '../../types/models';
import { useThemeColors } from '../../hooks/useThemeColors';

interface DebtStatusBadgeProps {
    status: DebtStatus;
    size?: 'small' | 'medium' | 'large';
    isOverdue?: boolean;
}

export const DebtStatusBadge: React.FC<DebtStatusBadgeProps> = ({
    status,
    size = 'medium',
    isOverdue = false,
}) => {
    const themeColors = useThemeColors();

    const getBadgeConfig = () => {
        if (status === 'paid') {
            return {
                label: 'Paid',
                icon: 'check-circle',
                color: '#06D6A0',
                bgColor: 'rgba(6, 214, 160, 0.1)',
            };
        }

        if (status === 'partial') {
            return {
                label: 'Partial',
                icon: 'clock-outline',
                color: '#118AB2',
                bgColor: 'rgba(17, 138, 178, 0.1)',
            };
        }

        // Pending status
        if (isOverdue) {
            return {
                label: 'Overdue',
                icon: 'alert-circle',
                color: '#EF476F',
                bgColor: 'rgba(239, 71, 111, 0.1)',
            };
        }

        return {
            label: 'Pending',
            icon: 'clock-alert-outline',
            color: '#FFD166',
            bgColor: 'rgba(255, 209, 102, 0.1)',
        };
    };

    const config = getBadgeConfig();
    const sizeConfig = {
        small: { fontSize: 10, iconSize: 12, padding: 4 },
        medium: { fontSize: 12, iconSize: 14, padding: 6 },
        large: { fontSize: 14, iconSize: 16, padding: 8 },
    }[size];

    return (
        <View
            style={[
                styles.badge,
                { backgroundColor: config.bgColor, padding: sizeConfig.padding },
            ]}>
            <Icon name={config.icon} size={sizeConfig.iconSize} color={config.color} />
            <Text
                style={[
                    styles.label,
                    { color: config.color, fontSize: sizeConfig.fontSize, marginLeft: 4 },
                ]}>
                {config.label}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 8,
    },
    label: {
        fontWeight: '600',
    },
});
