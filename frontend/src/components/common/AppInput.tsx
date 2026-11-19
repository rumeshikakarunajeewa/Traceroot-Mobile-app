import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TextInputProps, TouchableOpacity, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../lib/theme';

interface AppInputProps extends TextInputProps {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  isPassword?: boolean;
  error?: string;
}

export function AppInput({ icon, isPassword, error, style, ...props }: AppInputProps) {
  const [isSecure, setIsSecure] = useState(isPassword);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <View style={[
        styles.inputContainer,
        isFocused && styles.focusedContainer,
        error ? styles.errorContainer : null,
      ]}>
        {icon && (
          <MaterialCommunityIcons 
            name={icon} 
            size={20} 
            color={colors.text.secondary} 
            style={styles.icon} 
          />
        )}
        
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.text.secondary}
          secureTextEntry={isSecure}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity 
            onPress={() => setIsSecure(!isSecure)}
            style={styles.eyeIcon}
          >
            <MaterialCommunityIcons 
              name={isSecure ? "eye-outline" : "eye-off-outline"} 
              size={20} 
              color={colors.text.secondary} 
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    height: 56,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  focusedContainer: {
    borderColor: colors.button.accent,
  },
  errorContainer: {
    borderColor: '#F44336',
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    color: colors.text.primary,
    fontSize: 16,
  },
  eyeIcon: {
    padding: spacing.xs,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
    marginLeft: spacing.sm,
  },
});