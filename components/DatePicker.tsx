import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
  TextInput,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Clock } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  placeholder?: string;
  disabled?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
  label?: string;
  compact?: boolean;
}

export default function DatePicker({
  value,
  onChange,
  mode = 'date',
  placeholder = 'Select date',
  disabled = false,
  minimumDate,
  maximumDate,
  label,
  compact = false,
}: DatePickerProps) {
  const { colors } = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const [showWebModal, setShowWebModal] = useState(false);
  const [webDate, setWebDate] = useState(value.toISOString().split('T')[0]);
  const [webTime, setWebTime] = useState(
    value.toTimeString().split(' ')[0].substring(0, 5)
  );

  const formatDate = (date: Date) => {
    if (mode === 'date') {
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } else if (mode === 'time') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return `${date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })} ${date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const handleWebDateTimeChange = () => {
    const [year, month, day] = webDate.split('-').map(Number);
    const [hours, minutes] = webTime.split(':').map(Number);
    const newDate = new Date(year, month - 1, day, hours, minutes);
    onChange(newDate);
    setShowWebModal(false);
  };

  const renderWebPicker = () => (
    <Modal
      visible={showWebModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowWebModal(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setShowWebModal(false)}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {mode === 'date' ? 'Select Date' : mode === 'time' ? 'Select Time' : 'Select Date & Time'}
            </Text>
          </View>

          <View style={styles.webPickerContent}>
            {(mode === 'date' || mode === 'datetime') && (
              <View style={styles.webInputGroup}>
                <Text style={[styles.webInputLabel, { color: colors.text }]}>Date</Text>
                <TextInput
                  style={[styles.webInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  value={webDate}
                  onChangeText={setWebDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            )}

            {(mode === 'time' || mode === 'datetime') && (
              <View style={styles.webInputGroup}>
                <Text style={[styles.webInputLabel, { color: colors.text }]}>Time</Text>
                <TextInput
                  style={[styles.webInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  value={webTime}
                  onChangeText={setWebTime}
                  placeholder="HH:MM"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            )}
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.background }]}
              onPress={() => setShowWebModal(false)}
            >
              <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={handleWebDateTimeChange}
            >
              <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }, compact && styles.labelCompact]}>{label}</Text>
      )}
      <TouchableOpacity
        style={[
          styles.pickerButton,
          compact && styles.pickerButtonCompact,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
        onPress={() => {
          if (!disabled) {
            if (Platform.OS === 'web') {
              setWebDate(value.toISOString().split('T')[0]);
              setWebTime(value.toTimeString().split(' ')[0].substring(0, 5));
              setShowWebModal(true);
            } else {
              setShowPicker(true);
            }
          }
        }}
        disabled={disabled}
      >
        <View style={styles.pickerContent}>
          {mode === 'time' ? (
            <Clock color={colors.textSecondary} size={20} />
          ) : (
            <Calendar color={colors.textSecondary} size={20} />
          )}
          <Text 
            style={[styles.pickerText, { color: colors.text }, compact && styles.pickerTextCompact]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {formatDate(value)}
          </Text>
        </View>
      </TouchableOpacity>

      {Platform.OS !== 'web' && showPicker && (
        <DateTimePicker
          value={value}
          mode={mode === 'datetime' ? 'date' : mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}

      {Platform.OS === 'web' && renderWebPicker()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  containerCompact: {
    marginBottom: 12,
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  labelCompact: {
    fontSize: 14,
    marginBottom: 6,
  },
  pickerButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 48,
    minWidth: 140,
  },
  pickerButtonCompact: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 40,
    minWidth: 100,
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  pickerText: {
    fontSize: 16,
    flex: 1,
    textAlign: 'left',
    minWidth: 0,
  },
  pickerTextCompact: {
    fontSize: 12,
    lineHeight: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  webPickerContent: {
    padding: 20,
    gap: 16,
  },
  webInputGroup: {
    gap: 8,
  },
  webInputLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  webInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 0,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateRangeContainer: {
    marginBottom: 16,
  },
  dateRangeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  dateRangeSpacer: {
    width: 12,
  },
});

// DateRangePicker component for handling "von" and "bis" date fields
interface DateRangePickerProps {
  fromDate: Date;
  toDate: Date;
  onFromDateChange: (date: Date) => void;
  onToDateChange: (date: Date) => void;
  fromLabel?: string;
  toLabel?: string;
  mode?: 'date' | 'time' | 'datetime';
  disabled?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
}

export function DateRangePicker({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  fromLabel = 'Von',
  toLabel = 'Bis',
  mode = 'date',
  disabled = false,
  minimumDate,
  maximumDate,
}: DateRangePickerProps) {
  return (
    <View style={styles.dateRangeContainer}>
      <View style={styles.dateRangeRow}>
        <DatePicker
          value={fromDate}
          onChange={onFromDateChange}
          label={fromLabel}
          mode={mode}
          disabled={disabled}
          minimumDate={minimumDate}
          maximumDate={toDate}
          compact
        />
        <View style={styles.dateRangeSpacer} />
        <DatePicker
          value={toDate}
          onChange={onToDateChange}
          label={toLabel}
          mode={mode}
          disabled={disabled}
          minimumDate={fromDate}
          maximumDate={maximumDate}
          compact
        />
      </View>
    </View>
  );
}