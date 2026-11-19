import React from 'react';
import { View, Text, StyleSheet, TextInput, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ProfileFieldCardProps {
  label: string;
  placeholder: string;
  iconEmoji: string;
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  isFocused?: boolean;
  error?: string;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
}

export const ProfileFieldCard: React.FC<ProfileFieldCardProps> = ({
  label,
  placeholder,
  iconEmoji,
  value,
  onChangeText,
  onFocus,
  onBlur,
  isFocused = false,
  error,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}) => {
  const isFilled = value.trim().length > 0;

  return (
    <View style={styles.fieldWrapper}>
      <View
        style={[
          styles.cardContainer,
          isFocused && styles.cardContainerFocused,
          error ? styles.cardContainerError : null,
        ]}
      >
        {/* Left Icon Badge */}
        <View style={styles.iconContainer}>
          <Text style={styles.iconEmoji}>{iconEmoji}</Text>
        </View>

        {/* Label and Input */}
        <View style={styles.inputDetailsContainer}>
          <Text style={styles.inputLabel}>{label}</Text>
          <TextInput
            style={styles.textInput}
            placeholder={placeholder}
            placeholderTextColor="#B8BEB8"
            value={value}
            onChangeText={onChangeText}
            onFocus={onFocus}
            onBlur={onBlur}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
          />
        </View>

        {/* Right Status Indicator */}
        <View
          style={[
            styles.statusIndicator,
            isFilled && styles.statusIndicatorFilled,
          ]}
        >
          {isFilled && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  fieldWrapper: {
    marginBottom: 2,
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: '#ECEAE2',
  },
  cardContainerFocused: {
    borderColor: '#1C5B32',
    shadowOpacity: 0.08,
  },
  cardContainerError: {
    borderColor: '#D32F2F',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F5F5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconEmoji: {
    fontSize: 20,
  },
  inputDetailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#768779',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  textInput: {
    fontSize: 15,
    color: '#1C3122',
    fontWeight: '500',
    padding: 0,
    margin: 0,
  },
  statusIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E7ECE8',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  statusIndicatorFilled: {
    backgroundColor: '#2A7A44',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 11,
    marginTop: 4,
    marginLeft: 12,
    fontWeight: '500',
  },
});
