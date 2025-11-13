import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  MessageSquare,
  Clock,
  Calendar,
  Settings as SettingsIcon,
  TestTube,
  Check,
} from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack } from 'expo-router';
import notificationService, { MeterReadingReminder } from '@/utils/notificationService';

export default function NotificationSettingsScreen() {
  const { 
    notificationSettings, 
    updateNotificationSettings, 
    userProfile, 
    meterReadings,
    language 
  } = useApp();
  const { colors, isDark } = useTheme();
  const [isTestingNotifications, setIsTestingNotifications] = useState(false);

  const handleTogglePush = (enabled: boolean) => {
    updateNotificationSettings({ push: enabled });
  };

  const handleToggleSMS = (enabled: boolean) => {
    updateNotificationSettings({ sms: enabled });
  };

  const handleReminderDaysChange = (days: string) => {
    const numDays = parseInt(days, 10);
    if (!isNaN(numDays) && numDays >= 1 && numDays <= 30) {
      updateNotificationSettings({ reminderDays: numDays });
    }
  };

  const handleReminderTimeChange = (time: string) => {
    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (timeRegex.test(time)) {
      updateNotificationSettings({ reminderTime: time });
    }
  };

  const testNotifications = async () => {
    if (isTestingNotifications) return;
    
    setIsTestingNotifications(true);
    
    try {
      // Initialize notification service first
      const initialized = await notificationService.initialize();
      if (!initialized) {
        Alert.alert(
          language === 'de' ? 'Benachrichtigungen nicht verfügbar' : 
          language === 'en' ? 'Notifications Not Available' : 
          'Уведомления недоступны',
          language === 'de' ? 'Benachrichtigungsberechtigungen wurden nicht erteilt.' :
          language === 'en' ? 'Notification permissions were not granted.' : 
          'Разрешения на уведомления не были предоставлены.'
        );
        return;
      }

      // Get the latest meter reading for testing or create a dummy one
      let latestReading = meterReadings
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
      
      if (!latestReading) {
        // Create a dummy reading for testing
        latestReading = {
          id: 'test-meter',
          meterId: 'test-meter',
          meterName: 'Test Stromzähler',
          type: 'electricity' as const,
          reading: 1000,
          timestamp: new Date(),
          unit: 'kWh',
        };
      }

      const pushToken = await notificationService.getPushToken();
      console.log('Push token for testing:', pushToken);
      
      // Create test reminder (immediate notification)
      const testReminder: MeterReadingReminder = {
        id: `test-${Date.now()}`,
        meterName: latestReading.meterName,
        meterType: latestReading.type,
        lastReadingDate: latestReading.timestamp,
        nextReminderDate: new Date(Date.now() + 3000), // 3 seconds from now
        frequency: 'monthly',
        userEmail: userProfile?.email,
        pushToken: pushToken || undefined,
      };

      console.log('Testing with reminder:', testReminder);
      console.log('Notification settings:', notificationSettings);

      // Send immediate test notifications
      let pushResult = false;

      if (notificationSettings.push) {
        // Send immediate local notification
        const notificationId = await notificationService.scheduleLocalNotification(
          language === 'de' ? 'Test-Benachrichtigung' : 
          language === 'en' ? 'Test Notification' : 
          'Тестовое уведомление',
          language === 'de' ? 
            `Dies ist eine Test-Benachrichtigung für den Zähler "${testReminder.meterName}".` :
            language === 'en' ? 
            `This is a test notification for meter "${testReminder.meterName}".` :
            `Это тестовое уведомление для счетчика "${testReminder.meterName}".`,
          new Date(Date.now() + 2000), // 2 seconds delay
          {
            type: 'test-notification',
            meterId: testReminder.id,
            meterName: testReminder.meterName,
          },
          'meter-reminders'
        );
        pushResult = !!notificationId;
        console.log('Local notification scheduled:', notificationId);
      }

      Alert.alert(
        language === 'de' ? 'Test-Benachrichtigung gesendet' : 
        language === 'en' ? 'Test Notification Sent' : 
        'Тестовое уведомление отправлено',
        language === 'de' ? 
          `Push-Benachrichtigung: ${pushResult ? 'Erfolgreich geplant' : 'Nicht aktiviert oder fehlgeschlagen'}\n\n${pushResult ? 'Die Push-Benachrichtigung sollte in 2 Sekunden erscheinen.' : ''}` :
          language === 'en' ? 
          `Push Notification: ${pushResult ? 'Successfully scheduled' : 'Not enabled or failed'}\n\n${pushResult ? 'The push notification should appear in 2 seconds.' : ''}` :
          `Push-уведомление: ${pushResult ? 'Успешно запланировано' : 'Не включено или не удалось'}\n\n${pushResult ? 'Push-уведомление должно появиться через 2 секунды.' : ''}`
      );
    } catch (error) {
      console.error('Error testing notifications:', error);
      Alert.alert(
        language === 'de' ? 'Test fehlgeschlagen' : 
        language === 'en' ? 'Test Failed' : 
        'Тест не удался',
        language === 'de' ? `Beim Testen der Benachrichtigungen ist ein Fehler aufgetreten: ${error}` :
        language === 'en' ? `An error occurred while testing notifications: ${error}` :
        `Произошла ошибка при тестировании уведомлений: ${error}`
      );
    } finally {
      setIsTestingNotifications(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: language === 'de' ? 'Benachrichtigungen' : 
                 language === 'en' ? 'Notifications' : 
                 'Уведомления',
          headerStyle: { backgroundColor: '#3B82F6' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={['#3B82F6', '#2563EB']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Bell color="#FFFFFF" size={28} />
            <Text style={styles.headerTitle}>
              {language === 'de' ? 'Benachrichtigungen' : 
               language === 'en' ? 'Notifications' : 
               'Уведомления'}
            </Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {language === 'de' ? 'Erinnerungen für Zählerablesung konfigurieren' :
             language === 'en' ? 'Configure meter reading reminders' : 
             'Настройка напоминаний о показаниях счетчика'}
          </Text>
        </LinearGradient>

        <ScrollView style={[styles.content, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
          {/* Notification Types */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {language === 'de' ? 'Benachrichtigungsarten' : 
               language === 'en' ? 'Notification Types' : 
               'Типы уведомлений'}
            </Text>
            
            <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
              <View style={styles.settingInfo}>
                <Bell color={colors.primary} size={24} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    {language === 'de' ? 'Push-Benachrichtigungen' : 
                     language === 'en' ? 'Push Notifications' : 
                     'Push-уведомления'}
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    {language === 'de' ? 'Sofortige Benachrichtigungen auf Ihrem Gerät' :
                     language === 'en' ? 'Instant notifications on your device' : 
                     'Мгновенные уведомления на вашем устройстве'}
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.push}
                onValueChange={handleTogglePush}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={notificationSettings.push ? '#FFFFFF' : colors.textSecondary}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <MessageSquare color={colors.textSecondary} size={24} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.textSecondary }]}>
                    {language === 'de' ? 'SMS-Benachrichtigungen' : 
                     language === 'en' ? 'SMS Notifications' : 
                     'SMS-уведомления'}
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    {language === 'de' ? 'Bald verfügbar' :
                     language === 'en' ? 'Coming soon' : 
                     'Скоро доступно'}
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.sms}
                onValueChange={handleToggleSMS}
                disabled={true}
                trackColor={{ false: colors.border, true: colors.textSecondary }}
                thumbColor={colors.textSecondary}
              />
            </View>
          </View>

          {/* Reminder Settings */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {language === 'de' ? 'Erinnerungseinstellungen' : 
               language === 'en' ? 'Reminder Settings' : 
               'Настройки напоминаний'}
            </Text>
            
            <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
              <View style={styles.settingInfo}>
                <Calendar color={colors.primary} size={24} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    {language === 'de' ? 'Erinnerung vor Ablesung' : 
                     language === 'en' ? 'Reminder Before Reading' : 
                     'Напоминание перед снятием показаний'}
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    {language === 'de' ? 'Tage vor der nächsten Ablesung' : 
                     language === 'en' ? 'Days before next reading' : 
                     'Дни до следующего снятия показаний'}
                  </Text>
                </View>
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.numberInput, { 
                    backgroundColor: colors.surface, 
                    borderColor: colors.border, 
                    color: colors.text 
                  }]}
                  value={notificationSettings.reminderDays.toString()}
                  onChangeText={handleReminderDaysChange}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  {language === 'de' ? 'Tage' : 
                   language === 'en' ? 'days' : 
                   'дней'}
                </Text>
              </View>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Clock color={colors.primary} size={24} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    {language === 'de' ? 'Erinnerungszeit' : 
                     language === 'en' ? 'Reminder Time' : 
                     'Время напоминания'}
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    {language === 'de' ? 'Uhrzeit für tägliche Erinnerungen' : 
                     language === 'en' ? 'Time of day for daily reminders' : 
                     'Время дня для ежедневных напоминаний'}
                  </Text>
                </View>
              </View>
              <TextInput
                style={[styles.timeInput, { 
                  backgroundColor: colors.surface, 
                  borderColor: colors.border, 
                  color: colors.text 
                }]}
                value={notificationSettings.reminderTime}
                onChangeText={handleReminderTimeChange}
                placeholder="09:00"
                placeholderTextColor={colors.textSecondary}
                maxLength={5}
              />
            </View>
          </View>

          {/* Test Section */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {language === 'de' ? 'Benachrichtigungen testen' : 
               language === 'en' ? 'Test Notifications' : 
               'Тестирование уведомлений'}
            </Text>
            
            <TouchableOpacity
              style={[
                styles.testButton,
                { 
                  backgroundColor: isTestingNotifications ? colors.textSecondary : colors.primary,
                  opacity: isTestingNotifications ? 0.6 : 1
                }
              ]}
              onPress={testNotifications}
              disabled={isTestingNotifications}
            >
              {isTestingNotifications ? (
                <SettingsIcon color="#FFFFFF" size={20} />
              ) : (
                <TestTube color="#FFFFFF" size={20} />
              )}
              <Text style={styles.testButtonText}>
                {isTestingNotifications ? (
                  language === 'de' ? 'Wird gesendet...' : 
                  language === 'en' ? 'Sending...' : 
                  'Отправка...'
                ) : (
                  language === 'de' ? 'Test-Benachrichtigung senden' : 
                  language === 'en' ? 'Send Test Notification' : 
                  'Отправить тестовое уведомление'
                )}
              </Text>
            </TouchableOpacity>
            
            <Text style={[styles.testDescription, { color: colors.textSecondary }]}>
              {language === 'de' ? 
                'Sendet eine Test-Benachrichtigung basierend auf Ihren aktuellen Einstellungen. Push-Benachrichtigungen erscheinen in 2 Sekunden.' :
                language === 'en' ? 
                'Sends a test notification based on your current settings. Push notifications will appear in 2 seconds.' :
                'Отправляет тестовое уведомление на основе ваших текущих настроек. Push-уведомления появятся через 2 секунды.'}
            </Text>
          </View>

          {/* Information Section */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {language === 'de' ? 'Wie funktionieren Erinnerungen?' : 
               language === 'en' ? 'How do reminders work?' : 
               'Как работают напоминания?'}
            </Text>
            
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <Check color={colors.success} size={16} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  {language === 'de' ? 
                    'Automatische Erinnerungen werden beim Hinzufügen neuer Zählerstände geplant' :
                    language === 'en' ? 
                    'Automatic reminders are scheduled when adding new meter readings' :
                    'Автоматические напоминания планируются при добавлении новых показаний счетчика'}
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Check color={colors.success} size={16} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  {language === 'de' ? 
                    'Standardmäßig monatliche Erinnerungen für alle Zählertypen' :
                    language === 'en' ? 
                    'Monthly reminders by default for all meter types' :
                    'Ежемесячные напоминания по умолчанию для всех типов счетчиков'}
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Check color={colors.success} size={16} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  {language === 'de' ? 
                    'Push-Benachrichtigungen funktionieren nur auf physischen Geräten' :
                    language === 'en' ? 
                    'Push notifications only work on physical devices' :
                    'Push-уведомления работают только на физических устройствах'}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    textAlign: 'center',
    minWidth: 50,
    backgroundColor: '#FFFFFF',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    textAlign: 'center',
    minWidth: 80,
    backgroundColor: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  testDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    textAlign: 'center',
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    flex: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  configurationWarning: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  warningDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
});