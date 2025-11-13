import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { ChevronLeft, ChevronRight, Edit2 } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface CustomCalendarPickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
  label?: string;
  compact?: boolean;
}

export default function CustomCalendarPicker({
  value,
  onChange,
  placeholder = 'Select date',
  disabled = false,
  minimumDate,
  maximumDate,
  label,
  compact = false,
}: CustomCalendarPickerProps) {
  const { colors, isDark } = useTheme();
  const effectiveDate = value && value instanceof Date ? value : new Date();
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(effectiveDate);
  const [currentMonth, setCurrentMonth] = useState(effectiveDate.getMonth());
  const [currentYear, setCurrentYear] = useState(effectiveDate.getFullYear());
  const [showYearPicker, setShowYearPicker] = useState(false);

  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  const weekDays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return '';
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const monthsShort = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    
    return `${days[date.getDay()]}, ${monthsShort[date.getMonth()]} ${date.getDate()}`;
  };

  const formatFullDate = (date: Date | null) => {
    if (!date) return placeholder;
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }, [currentMonth, currentYear]);

  const isDateDisabled = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    if (minimumDate && date < minimumDate) return true;
    if (maximumDate && date > maximumDate) return true;
    return false;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    return (
      selectedDate &&
      day === selectedDate.getDate() &&
      currentMonth === selectedDate.getMonth() &&
      currentYear === selectedDate.getFullYear()
    );
  };

  const handleDayPress = (day: number) => {
    if (!isDateDisabled(day)) {
      const newDate = new Date(currentYear, currentMonth, day);
      setSelectedDate(newDate);
    }
  };

  const handleConfirm = () => {
    onChange(selectedDate);
    setShowModal(false);
  };

  const handleCancel = () => {
    const resetDate = value || new Date();
    setSelectedDate(resetDate);
    setCurrentMonth(resetDate.getMonth());
    setCurrentYear(resetDate.getFullYear());
    setShowModal(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const handleYearSelect = (year: number) => {
    setCurrentYear(year);
    setShowYearPicker(false);
  };

  const yearOptions = useMemo(() => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 50; i <= currentYear + 50; i++) {
      years.push(i);
    }
    return years;
  }, []);

  const primaryColor = isDark ? '#10B981' : '#6366F1';
  const headerBg = primaryColor;
  const selectedBg = primaryColor;

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }, compact && styles.labelCompact]}>
          {label}
        </Text>
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
        onPress={() => !disabled && setShowModal(true)}
        disabled={disabled}
      >
        <Text 
          style={[
            styles.pickerText, 
            { color: value ? colors.text : colors.textSecondary }, 
            compact && styles.pickerTextCompact
          ]}
          numberOfLines={1}
        >
          {formatFullDate(value)}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCancel}>
          <Pressable style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: headerBg }]}>
              <Text style={styles.headerLabel}>DATUM AUSWÄHLEN</Text>
              <View style={styles.headerDateContainer}>
                <Text style={styles.headerDate}>{formatDisplayDate(selectedDate)}</Text>
                <TouchableOpacity style={styles.editButton}>
                  <Edit2 color="#FFFFFF" size={20} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Month/Year Selector */}
            <View style={styles.monthYearSelector}>
              <TouchableOpacity 
                onPress={() => setShowYearPicker(true)}
                style={styles.monthYearButton}
              >
                <Text style={[styles.monthYearText, { color: colors.text }]}>
                  {months[currentMonth]} {currentYear}
                </Text>
                <ChevronRight 
                  color={colors.textSecondary} 
                  size={20} 
                  style={styles.chevronDown}
                />
              </TouchableOpacity>
              
              <View style={styles.navigationButtons}>
                <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
                  <ChevronLeft color={colors.textSecondary} size={24} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
                  <ChevronRight color={colors.textSecondary} size={24} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Calendar Grid */}
            {!showYearPicker ? (
              <View style={styles.calendarContainer}>
                {/* Week days header */}
                <View style={styles.weekDaysRow}>
                  {weekDays.map((day) => (
                    <View key={`weekday-${day}`} style={styles.weekDayCell}>
                      <Text style={[styles.weekDayText, { color: colors.textSecondary }]}>
                        {day}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Calendar days */}
                <View style={styles.daysGrid}>
                  {calendarDays.map((day, index) => (
                    <View key={`day-${index}-${day}`} style={styles.dayCell}>
                      {day && (
                        <TouchableOpacity
                          style={[
                            styles.dayButton,
                            isToday(day) && [styles.todayButton, { borderColor: colors.textSecondary }],
                            isSelected(day) && [styles.selectedButton, { backgroundColor: selectedBg }],
                            isDateDisabled(day) && styles.disabledButton,
                          ]}
                          onPress={() => handleDayPress(day)}
                          disabled={isDateDisabled(day)}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              { color: colors.text },
                              isToday(day) && !isSelected(day) && { color: colors.text },
                              isSelected(day) && styles.selectedText,
                              isDateDisabled(day) && [styles.disabledText, { color: colors.textSecondary }],
                            ]}
                          >
                            {day}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <ScrollView style={styles.yearPickerContainer}>
                {yearOptions.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.yearOption,
                      year === currentYear && [styles.selectedYearOption, { backgroundColor: selectedBg }],
                    ]}
                    onPress={() => handleYearSelect(year)}
                  >
                    <Text
                      style={[
                        styles.yearOptionText,
                        { color: colors.text },
                        year === currentYear && styles.selectedYearText,
                      ]}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={handleCancel}
              >
                <Text style={[styles.actionButtonText, { color: primaryColor }]}>
                  ABBRECHEN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={handleConfirm}
              >
                <Text style={[styles.actionButtonText, { color: primaryColor }]}>
                  OK
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  },
  pickerButtonCompact: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 40,
  },
  pickerText: {
    fontSize: 16,
  },
  pickerTextCompact: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 360,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  headerLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
  },
  headerDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerDate: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '500',
  },
  editButton: {
    padding: 8,
  },
  monthYearSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  monthYearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '500',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    padding: 4,
  },
  calendarContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  dayButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  todayButton: {
    borderWidth: 1,
  },
  selectedButton: {
    backgroundColor: '#6366F1',
  },
  disabledButton: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 14,
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  disabledText: {
    opacity: 0.5,
  },
  yearPickerContainer: {
    maxHeight: 300,
    paddingHorizontal: 16,
  },
  yearOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginVertical: 2,
  },
  selectedYearOption: {
    backgroundColor: '#6366F1',
  },
  yearOptionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  selectedYearText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  chevronDown: {
    transform: [{ rotate: '90deg' }],
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
  disabled = false,
  minimumDate,
  maximumDate,
}: DateRangePickerProps) {
  return (
    <View style={rangeStyles.container}>
      <View style={rangeStyles.row}>
        <CustomCalendarPicker
          value={fromDate}
          onChange={onFromDateChange}
          label={fromLabel}
          disabled={disabled}
          minimumDate={minimumDate}
          maximumDate={toDate}
          compact
        />
        <View style={rangeStyles.spacer} />
        <CustomCalendarPicker
          value={toDate}
          onChange={onToDateChange}
          label={toLabel}
          disabled={disabled}
          minimumDate={fromDate}
          maximumDate={maximumDate}
          compact
        />
      </View>
    </View>
  );
}

const rangeStyles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  spacer: {
    width: 8,
  },
});