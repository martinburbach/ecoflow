import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';


// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationSettings {
  push: boolean;
  email: boolean;
  sms: boolean;
  reminderDays: number; // Days before meter reading reminder
  reminderTime: string; // Time of day for reminders (HH:MM format)
}

export interface MeterReadingReminder {
  id: string;
  meterName: string;
  meterType: string;
  lastReadingDate: Date;
  nextReminderDate: Date;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  userEmail?: string;
  pushToken?: string;
}

class NotificationService {
  private pushToken: string | null = null;
  private isInitialized = false;

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permissions not granted');
        return false;
      }

      // Get push token for physical devices
      if (Device.isDevice) {
        try {
          // Try to get push token without project ID first (for Expo Go)
          let token;
          try {
            token = await Notifications.getExpoPushTokenAsync();
          } catch {
            console.log('Trying with project ID fallback...');
            // Fallback with a default project ID
            token = await Notifications.getExpoPushTokenAsync({
              projectId: 'ecoenergy-balance-project',
            });
          }
          
          this.pushToken = token.data;
          console.log('Push token obtained:', this.pushToken);
          
          // Store token for later use
          await AsyncStorage.setItem('pushToken', this.pushToken);
        } catch (error) {
          console.error('Error getting push token:', error);
          // For development, we can still proceed without push token
          console.log('Continuing without push token - local notifications will still work');
        }
      } else {
        console.log('Push notifications only work on physical devices - using local notifications for web/simulator');
      }

      // Configure notification channels for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('meter-reminders', {
          name: 'Meter Reading Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#10B981',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('alerts', {
          name: 'Energy Alerts',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#EF4444',
          sound: 'default',
        });
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  async getPushToken(): Promise<string | null> {
    if (!this.pushToken) {
      const storedToken = await AsyncStorage.getItem('pushToken');
      if (storedToken) {
        this.pushToken = storedToken;
      }
    }
    return this.pushToken;
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    trigger: Date,
    data?: any,
    channelId: string = 'default'
  ): Promise<string | null> {
    try {
      await this.initialize();

      // Calculate seconds until trigger date
      const now = new Date();
      const secondsUntilTrigger = Math.max(1, Math.floor((trigger.getTime() - now.getTime()) / 1000));

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: {
          seconds: secondsUntilTrigger,
        } as any,
        ...(Platform.OS === 'android' && { channelId }),
      });

      console.log('Local notification scheduled:', notificationId, 'in', secondsUntilTrigger, 'seconds');
      return notificationId;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      return null;
    }
  }

  async sendPushNotification(
    pushToken: string,
    title: string,
    body: string,
    data?: any
  ): Promise<boolean> {
    try {
      // For Expo Go and development, we'll use local notifications instead
      if (Platform.OS === 'web' || !Device.isDevice) {
        console.log('Using local notification instead of push for web/simulator');
        const notificationId = await this.scheduleLocalNotification(
          title,
          body,
          new Date(Date.now() + 1000), // 1 second delay
          data
        );
        return !!notificationId;
      }

      const message = {
        to: pushToken,
        sound: 'default',
        title,
        body,
        data,
        priority: 'high' as const,
        channelId: 'meter-reminders',
      };

      // Use the correct Expo push notification endpoint
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Push notification response:', result);
      
      // Check if the response indicates success
      if (result.data) {
        return result.data.status === 'ok';
      }
      
      return response.ok;
    } catch (error) {
      console.error('Error sending push notification:', error);
      // Fallback to local notification
      console.log('Falling back to local notification');
      const notificationId = await this.scheduleLocalNotification(
        title,
        body,
        new Date(Date.now() + 1000),
        data
      );
      return !!notificationId;
    }
  }



  async scheduleMeterReadingReminder(
    reminder: MeterReadingReminder,
    settings: NotificationSettings,
    language: 'de' | 'en' | 'ru' = 'de'
  ): Promise<{ pushScheduled: boolean; emailSent: boolean }> {
    const results = { pushScheduled: false, emailSent: false };

    try {
      // Calculate next reminder date based on frequency
      const nextReminderDate = this.calculateNextReminderDate(
        reminder.lastReadingDate,
        reminder.frequency,
        settings.reminderDays
      );

      // Prepare notification content based on language
      const content = this.getMeterReminderContent(reminder, language);

      // Schedule push notification if enabled
      if (settings.push && reminder.pushToken) {
        const pushScheduled = await this.scheduleLocalNotification(
          content.title,
          content.body,
          nextReminderDate,
          {
            type: 'meter-reminder',
            meterId: reminder.id,
            meterName: reminder.meterName,
          },
          'meter-reminders'
        );
        results.pushScheduled = !!pushScheduled;


      }



      // Store reminder for tracking
      await this.storeScheduledReminder(reminder, nextReminderDate);

      console.log('Meter reading reminder scheduled:', results);
      return results;
    } catch (error) {
      console.error('Error scheduling meter reading reminder:', error);
      return results;
    }
  }

  private calculateNextReminderDate(
    lastReadingDate: Date,
    frequency: 'monthly' | 'quarterly' | 'yearly',
    reminderDays: number
  ): Date {
    const nextReadingDate = new Date(lastReadingDate);
    
    switch (frequency) {
      case 'monthly':
        nextReadingDate.setMonth(nextReadingDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextReadingDate.setMonth(nextReadingDate.getMonth() + 3);
        break;
      case 'yearly':
        nextReadingDate.setFullYear(nextReadingDate.getFullYear() + 1);
        break;
    }

    // Subtract reminder days to get notification date
    const reminderDate = new Date(nextReadingDate);
    reminderDate.setDate(reminderDate.getDate() - reminderDays);

    // If the calculated reminder date is in the past, schedule it for one day before the due date
    // to avoid immediate (and confusing) notifications.
    if (reminderDate.getTime() < Date.now()) {
      const fallbackDate = new Date(nextReadingDate);
      fallbackDate.setDate(fallbackDate.getDate() - 1);
      // Ensure even the fallback is not in the past
      if (fallbackDate.getTime() < Date.now()) {
        return nextReadingDate;
      }
      return fallbackDate;
    }
    
    return reminderDate;
  }

  private getMeterReminderContent(
    reminder: MeterReadingReminder,
    language: 'de' | 'en' | 'ru'
  ): { title: string; body: string } {
    const meterTypeNames = {
      de: {
        electricity: 'Stromzähler',
        gas: 'Gaszähler',
        water: 'Wasserzähler',
        heat: 'Wärmezähler',
      },
      en: {
        electricity: 'Electricity Meter',
        gas: 'Gas Meter',
        water: 'Water Meter',
        heat: 'Heat Meter',
      },
      ru: {
        electricity: 'Счетчик электроэнергии',
        gas: 'Счетчик газа',
        water: 'Счетчик воды',
        heat: 'Счетчик тепла',
      },
    };

    const meterTypeName = meterTypeNames[language][reminder.meterType as keyof typeof meterTypeNames.de] || reminder.meterType;

    switch (language) {
      case 'de':
        return {
          title: 'Zählerstand ablesen',
          body: `Es ist Zeit, den ${meterTypeName} "${reminder.meterName}" abzulesen. Letzte Ablesung: ${reminder.lastReadingDate ? reminder.lastReadingDate.toLocaleDateString('de-DE') : 'N/A'}.`,
        };
      case 'en':
        return {
          title: 'Meter Reading Reminder',
          body: `Time to read your ${meterTypeName} "${reminder.meterName}". Last reading: ${reminder.lastReadingDate ? reminder.lastReadingDate.toLocaleDateString('en-US') : 'N/A'}.`,
        };
      case 'ru':
        return {
          title: 'Напоминание о показаниях счетчика',
          body: `Время снять показания с ${meterTypeName} "${reminder.meterName}". Последние показания: ${reminder.lastReadingDate ? reminder.lastReadingDate.toLocaleDateString('ru-RU') : 'N/A'}.`,
        };
      default:
        return {
          title: 'Meter Reading Reminder',
          body: `Time to read your ${reminder.meterName} meter.`,
        };
    }
  }



  private async storeScheduledReminder(
    reminder: MeterReadingReminder,
    scheduledDate: Date
  ): Promise<void> {
    try {
      const storedReminders = await AsyncStorage.getItem('scheduledReminders');
      const reminders = storedReminders ? JSON.parse(storedReminders) : [];
      
      const reminderData = {
        ...reminder,
        scheduledDate: scheduledDate.toISOString(),
        createdAt: new Date().toISOString(),
      };
      
      reminders.push(reminderData);
      await AsyncStorage.setItem('scheduledReminders', JSON.stringify(reminders));
    } catch (error) {
      console.error('Error storing scheduled reminder:', error);
    }
  }

  async getScheduledReminders(): Promise<any[]> {
    try {
      const storedReminders = await AsyncStorage.getItem('scheduledReminders');
      return storedReminders ? JSON.parse(storedReminders) : [];
    } catch (error) {
      console.error('Error getting scheduled reminders:', error);
      return [];
    }
  }

  async cancelAllScheduledNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All scheduled notifications cancelled');
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Notification cancelled:', notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
