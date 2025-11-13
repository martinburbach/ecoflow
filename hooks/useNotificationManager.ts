import { useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useApp } from '@/contexts/AppContext';
import notificationService, { MeterReadingReminder } from '@/utils/notificationService';

export function useNotificationManager() {
  const { 
    meterReadings, 
    notificationSettings, 
    userProfile, 
    language, 
    addAlert 
  } = useApp();

  // Handle notification responses (when user taps on notification)
  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    
    if (data?.type === 'meter-reminder') {
      console.log('User tapped on meter reminder notification:', data);
      
      // Add alert to show that user should add meter reading
      addAlert({
        type: 'info',
        title: language === 'de' ? 'Zählerstand ablesen' : 
               language === 'en' ? 'Read Meter' : 
               'Снять показания счетчика',
        message: language === 'de' ? 
          `Bitte lesen Sie den Zählerstand für ${data.meterName} ab und tragen Sie ihn in der App ein.` :
          language === 'en' ? 
          `Please read the meter for ${data.meterName} and enter it in the app.` :
          `Пожалуйста, снимите показания счетчика ${data.meterName} и введите их в приложение.`,
        timestamp: new Date(),
        acknowledged: false,
      });
    }
  }, [addAlert, language]);

  // Set up notification listeners
  useEffect(() => {
    // Listen for notification responses
    const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    // Listen for notifications received while app is in foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
    });

    return () => {
      subscription.remove();
      foregroundSubscription.remove();
    };
  }, [handleNotificationResponse]);

  // Check for overdue meter readings and send reminders
  const checkOverdueReadings = useCallback(async () => {
    if (!notificationSettings.push && !notificationSettings.email) {
      return; // No notifications enabled
    }

    try {
      const now = new Date();
      const pushToken = await notificationService.getPushToken();
      
      // Group meter readings by meter
      const meterGroups = meterReadings.reduce((acc, reading) => {
        const key = `${reading.type}-${reading.meterName}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(reading);
        return acc;
      }, {} as Record<string, typeof meterReadings>);

      // Check each meter for overdue readings
      for (const [meterKey, readings] of Object.entries(meterGroups)) {
        const sortedReadings = readings.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        const latestReading = sortedReadings[0];
        
        if (!latestReading) continue;

        // Calculate when next reading should be due (default: monthly)
        const nextDueDate = new Date(latestReading.timestamp);
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        
        // Calculate reminder date
        const reminderDate = new Date(nextDueDate);
        reminderDate.setDate(reminderDate.getDate() - notificationSettings.reminderDays);
        
        // Check if reminder should be sent (within 24 hours of reminder date)
        const timeDiff = now.getTime() - reminderDate.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        if (hoursDiff >= 0 && hoursDiff <= 24) {
          // Check if we already sent a reminder for this meter recently
          const recentReminders = await notificationService.getScheduledReminders();
          const existingReminder = recentReminders.find(r => 
            r.meterName === latestReading.meterName && 
            r.meterType === latestReading.type &&
            new Date(r.createdAt).getTime() > (now.getTime() - 24 * 60 * 60 * 1000) // Within last 24 hours
          );
          
          if (!existingReminder) {
            const reminder: MeterReadingReminder = {
              id: latestReading.meterId,
              meterName: latestReading.meterName,
              meterType: latestReading.type,
              lastReadingDate: latestReading.timestamp,
              nextReminderDate: reminderDate,
              frequency: 'monthly',
              userEmail: userProfile?.email,
              pushToken: pushToken || undefined,
            };

            // Send immediate notification
            const results = await notificationService.scheduleMeterReadingReminder(
              reminder,
              notificationSettings,
              language
            );

            console.log('Overdue reading reminder sent:', results);
            
            // Add alert about sent reminder
            addAlert({
              type: 'warning',
              title: language === 'de' ? 'Zählerablesung überfällig' : 
                     language === 'en' ? 'Meter Reading Overdue' : 
                     'Просрочено снятие показаний счетчика',
              message: language === 'de' ? 
                `Der Zähler "${latestReading.meterName}" sollte abgelesen werden. Letzte Ablesung: ${latestReading.timestamp.toLocaleDateString('de-DE')}.` :
                language === 'en' ? 
                `The meter "${latestReading.meterName}" should be read. Last reading: ${latestReading.timestamp.toLocaleDateString('en-US')}.` :
                `Счетчик "${latestReading.meterName}" должен быть считан. Последние показания: ${latestReading.timestamp.toLocaleDateString('ru-RU')}.`,
              timestamp: new Date(),
              acknowledged: false,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking overdue readings:', error);
    }
  }, [meterReadings, notificationSettings, userProfile, language, addAlert]);

  // Check for overdue readings periodically
  useEffect(() => {
    // Initial check
    checkOverdueReadings();
    
    // Check every hour
    const interval = setInterval(checkOverdueReadings, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [checkOverdueReadings]);

  // Initialize notification service when app starts
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        const initialized = await notificationService.initialize();
        if (initialized) {
          console.log('Notification service initialized successfully');
        } else {
          console.log('Notification service initialization failed - permissions not granted');
        }
      } catch (error) {
        console.error('Error initializing notification service:', error);
      }
    };

    initializeNotifications();
  }, []);

  // Test notification function for debugging
  const sendTestNotification = useCallback(async () => {
    try {
      const initialized = await notificationService.initialize();
      if (!initialized) {
        console.log('Cannot send test notification - service not initialized');
        return false;
      }

      const notificationId = await notificationService.scheduleLocalNotification(
        'Test Notification',
        'This is a test notification from EcoFlow',
        new Date(Date.now() + 2000), // 2 seconds delay
        {
          type: 'test',
          timestamp: new Date().toISOString(),
        },
        'meter-reminders'
      );

      console.log('Test notification scheduled:', notificationId);
      return !!notificationId;
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  }, []);

  return {
    checkOverdueReadings,
    sendTestNotification,
  };
}