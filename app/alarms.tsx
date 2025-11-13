import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert as RNAlert,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertTriangle,
  Info,
  AlertCircle,
  X,
  Check,
  Download,
  Share as ShareIcon,
  Calendar,
  TrendingUp,
  FileText,
  Square,
  CheckSquare,
  Trash2,
} from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/constants/languages';
import { router } from 'expo-router';
import { Alert } from '@/types/energy';
import { formatNumber } from '@/utils/energyCalculations';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AlarmsScreen() {
  const { 
    alerts, 
    acknowledgeAlert, 
    clearAlert, 
    energyProviders, 
    energyStats, 
    language,
    hiddenAlertIds 
  } = useApp() as any;
  const { colors } = useTheme();
  const t = useTranslation(language);
  const [showAlertModal, setShowAlertModal] = useState<boolean>(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [selectionMode, setSelectionMode] = useState<boolean>(false);
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());

  // Generate contract expiration alerts
  const contractExpirationAlerts = useMemo(() => {
    const now = new Date();
    const alertThreshold = 35 * 24 * 60 * 60 * 1000; // 35 days in milliseconds
    
    return energyProviders
      .filter((provider: any) => provider.validTo)
      .filter((provider: any) => {
        const expirationDate = new Date(provider.validTo!);
        const timeDiff = expirationDate.getTime() - now.getTime();
        return timeDiff > 0 && timeDiff <= alertThreshold;
      })
      .map((provider: any) => ({
        id: `contract-expiry-${provider.id}`,
        type: 'warning' as const,
        title: language === 'de' ? 'Vertrag läuft ab' : language === 'en' ? 'Contract Expiring' : 'Истекает договор',
        message: language === 'de' ? 
          `Ihr Vertrag mit ${provider.name} läuft am ${new Date(provider.validTo!).toLocaleDateString('de-DE')} ab.` :
          language === 'en' ? 
          `Your contract with ${provider.name} expires on ${new Date(provider.validTo!).toLocaleDateString('en-US')}.` :
          `Ваш договор с ${provider.name} истекает ${new Date(provider.validTo!).toLocaleDateString('ru-RU')}.`,
        timestamp: now,
        acknowledged: false,
      }));
  }, [energyProviders, language]);

  // Generate unusual consumption alerts
  const unusualConsumptionAlerts = useMemo(() => {
    if (!energyStats?.daily) return [];
    
    const avgConsumption = energyStats.weekly.consumption / 7;
    const todayConsumption = energyStats.daily.consumption;
    const threshold = avgConsumption * 1.5; // 50% above average
    
    if (todayConsumption > threshold && todayConsumption > 0) {
      return [{
        id: 'unusual-consumption',
        type: 'warning' as const,
        title: language === 'de' ? 'Ungewöhnlicher Verbrauch' : language === 'en' ? 'Unusual Consumption' : 'Необычное потребление',
        message: language === 'de' ? 
          `Ihr heutiger Verbrauch (${formatNumber(todayConsumption, 1)} kWh) ist ${Math.round((todayConsumption / avgConsumption - 1) * 100)}% höher als der Durchschnitt.` :
          language === 'en' ? 
          `Your consumption today (${formatNumber(todayConsumption, 1)} kWh) is ${Math.round((todayConsumption / avgConsumption - 1) * 100)}% above average.` :
          `Ваше потребление сегодня (${formatNumber(todayConsumption, 1)} кВтч) на ${Math.round((todayConsumption / avgConsumption - 1) * 100)}% выше среднего.`,
        timestamp: new Date(),
        acknowledged: false,
      }];
    }
    
    return [];
  }, [energyStats, language]);

  // Filter out hidden alerts
  const visibleContractAlerts = contractExpirationAlerts.filter(
    (alert: Alert) => !hiddenAlertIds?.includes(alert.id)
  );
  const visibleUnusualAlerts = unusualConsumptionAlerts.filter(
    (alert: Alert) => !hiddenAlertIds?.includes(alert.id)
  );
  
  const allAlerts = [...alerts, ...visibleContractAlerts, ...visibleUnusualAlerts];
  const sortedAlerts = allAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const unacknowledgedAlerts = sortedAlerts.filter(alert => !alert.acknowledged);
  const acknowledgedAlerts = sortedAlerts.filter(alert => alert.acknowledged);

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle color="#EF4444" size={24} />;
      case 'warning':
        return <AlertTriangle color="#F59E0B" size={24} />;
      case 'info':
        return <Info color="#3B82F6" size={24} />;
      default:
        return <AlertTriangle color="#6B7280" size={24} />;
    }
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      case 'info':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  const handleAlertPress = (alert: Alert) => {
    if (selectionMode) {
      toggleAlertSelection(alert.id);
    } else {
      setSelectedAlert(alert);
      setShowAlertModal(true);
    }
  };

  const handleAlertLongPress = (alert: Alert) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedAlerts(new Set([alert.id]));
    }
  };

  const toggleAlertSelection = (alertId: string) => {
    const newSelection = new Set(selectedAlerts);
    if (newSelection.has(alertId)) {
      newSelection.delete(alertId);
    } else {
      newSelection.add(alertId);
    }
    setSelectedAlerts(newSelection);
    
    if (newSelection.size === 0) {
      setSelectionMode(false);
    }
  };

  const selectAllAlerts = () => {
    const allAlertIds = new Set(allAlerts.map(alert => alert.id));
    setSelectedAlerts(allAlertIds);
  };

  const deselectAllAlerts = () => {
    setSelectedAlerts(new Set());
    setSelectionMode(false);
  };

  const handleBulkAcknowledge = () => {
    const alertsToAcknowledge = Array.from(selectedAlerts).filter(alertId => {
      const alert = allAlerts.find(a => a.id === alertId);
      return alert && !alert.acknowledged;
    });
    
    if (alertsToAcknowledge.length === 0) {
      RNAlert.alert(
        language === 'de' ? 'Keine Aktion erforderlich' : language === 'en' ? 'No Action Required' : 'Действие не требуется',
        language === 'de' ? 'Alle ausgewählten Alarme sind bereits bestätigt.' : 
        language === 'en' ? 'All selected alerts are already acknowledged.' :
        'Все выбранные тревоги уже подтверждены.'
      );
      return;
    }
    
    RNAlert.alert(
      language === 'de' ? 'Alarme bestätigen' : language === 'en' ? 'Acknowledge Alerts' : 'Подтвердить тревоги',
      language === 'de' ? `Möchten Sie ${alertsToAcknowledge.length} Alarm(e) bestätigen?` :
      language === 'en' ? `Do you want to acknowledge ${alertsToAcknowledge.length} alert(s)?` :
      `Вы хотите подтвердить ${alertsToAcknowledge.length} тревог(и)?`,
      [
        { text: language === 'de' ? 'Abbrechen' : language === 'en' ? 'Cancel' : 'Отмена', style: 'cancel' },
        {
          text: language === 'de' ? 'Bestätigen' : language === 'en' ? 'Acknowledge' : 'Подтвердить',
          onPress: async () => {
            // Process all selected alerts sequentially to avoid state conflicts
            for (const alertId of alertsToAcknowledge) {
              console.log('Acknowledging alert:', alertId);
              acknowledgeAlert(alertId);
              // Small delay to ensure state updates are processed
              await new Promise(resolve => setTimeout(resolve, 10));
            }
            deselectAllAlerts();
          },
        },
      ]
    );
  };

  const handleBulkDelete = () => {
    const alertsToDelete = Array.from(selectedAlerts);
    
    RNAlert.alert(
      language === 'de' ? 'Alarme löschen' : language === 'en' ? 'Delete Alerts' : 'Удалить тревоги',
      language === 'de' ? `Möchten Sie ${alertsToDelete.length} Alarm(e) wirklich löschen?` :
      language === 'en' ? `Do you really want to delete ${alertsToDelete.length} alert(s)?` :
      `Вы действительно хотите удалить ${alertsToDelete.length} тревог(и)?`,
      [
        { text: language === 'de' ? 'Abbrechen' : language === 'en' ? 'Cancel' : 'Отмена', style: 'cancel' },
        {
          text: language === 'de' ? 'Löschen' : language === 'en' ? 'Delete' : 'Удалить',
          style: 'destructive',
          onPress: () => {
            // Process all selected alerts at once
            console.log('Deleting alerts:', alertsToDelete);
            
            // Clear each alert
            alertsToDelete.forEach(alertId => {
              clearAlert(alertId);
            });
            
            // Clear selection after deletion
            deselectAllAlerts();
          },
        },
      ]
    );
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    acknowledgeAlert(alertId);
    setShowAlertModal(false);
  };

  const handleClearAlert = (alertId: string) => {
    clearAlert(alertId);
    setShowAlertModal(false);
  };

  const generatePDFReport = async () => {
    const reportData = {
      title: language === 'de' ? 'Alarm-Bericht' : language === 'en' ? 'Alarm Report' : 'Отчет о тревогах',
      generatedAt: new Date().toLocaleString(),
      totalAlerts: allAlerts.length,
      unacknowledged: unacknowledgedAlerts.length,
      acknowledged: acknowledgedAlerts.length,
      alerts: allAlerts.map(alert => ({
        type: alert.type,
        title: alert.title,
        message: alert.message,
        timestamp: alert.timestamp.toLocaleString(),
        status: alert.acknowledged ? 'Bestätigt' : 'Unbestätigt'
      }))
    };

    const reportText = `${reportData.title}\n\n` +
      `${language === 'de' ? 'Erstellt am:' : language === 'en' ? 'Generated on:' : 'Создано:'} ${reportData.generatedAt}\n\n` +
      `${language === 'de' ? 'Zusammenfassung:' : language === 'en' ? 'Summary:' : 'Сводка:'}\n` +
      `${language === 'de' ? 'Gesamt:' : language === 'en' ? 'Total:' : 'Всего:'} ${reportData.totalAlerts}\n` +
      `${language === 'de' ? 'Unbestätigt:' : language === 'en' ? 'Unacknowledged:' : 'Неподтвержденные:'} ${reportData.unacknowledged}\n` +
      `${language === 'de' ? 'Bestätigt:' : language === 'en' ? 'Acknowledged:' : 'Подтвержденные:'} ${reportData.acknowledged}\n\n` +
      `${language === 'de' ? 'Alarme:' : language === 'en' ? 'Alerts:' : 'Тревоги:'}\n` +
      reportData.alerts.map(alert => 
        `\n[${alert.type.toUpperCase()}] ${alert.title}\n` +
        `${alert.message}\n` +
        `${language === 'de' ? 'Zeit:' : language === 'en' ? 'Time:' : 'Время:'} ${alert.timestamp}\n` +
        `${language === 'de' ? 'Status:' : language === 'en' ? 'Status:' : 'Статус:'} ${alert.status}`
      ).join('\n');

    try {
      await Share.share({
        message: reportText,
        title: reportData.title,
      });
    } catch (error) {
      console.error('Error sharing report:', error);
    }
  };

  const renderAlertCard = (alert: Alert) => {
    const isSelected = selectedAlerts.has(alert.id);
    
    return (
      <TouchableOpacity
        key={alert.id}
        style={[ 
          styles.alertCard,
          { 
            backgroundColor: colors.card,
            borderLeftColor: getAlertColor(alert.type),
            opacity: alert.acknowledged ? 0.7 : 1,
            borderWidth: isSelected ? 2 : 0,
            borderColor: isSelected ? colors.primary : 'transparent'
          }
        ]}
        onPress={() => handleAlertPress(alert)}
        onLongPress={() => handleAlertLongPress(alert)}
      >
        <View style={styles.alertHeader}>
          {selectionMode && (
            <TouchableOpacity
              style={styles.selectionCheckbox}
              onPress={() => toggleAlertSelection(alert.id)}
            >
              {isSelected ? (
                <CheckSquare color={colors.primary} size={24} />
              ) : (
                <Square color={colors.textSecondary} size={24} />
              )}
            </TouchableOpacity>
          )}
          <View style={styles.alertIconContainer}>
            {getAlertIcon(alert.type)}
          </View>
          <View style={styles.alertInfo}>
            <Text style={[styles.alertTitle, { color: colors.text }]}>{alert.title}</Text>
            <Text style={[styles.alertTimestamp, { color: colors.textSecondary }]}>
              {alert.timestamp.toLocaleString()}
            </Text>
          </View>
          {alert.acknowledged && (
            <View style={styles.acknowledgedBadge}>
              <Check color="#10B981" size={16} />
            </View>
          )}
        </View>
        <Text style={[styles.alertMessage, { color: colors.textSecondary }]} numberOfLines={2}>
          {alert.message}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderAlertModal = () => {
    if (!selectedAlert) return null;

    return (
      <Modal
        visible={showAlertModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background, flex: 1 }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {language === 'de' ? 'Alarm Details' : language === 'en' ? 'Alert Details' : 'Детали тревоги'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAlertModal(false)}
            >
              <X color={colors.textSecondary} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={[styles.alertDetailCard, { backgroundColor: colors.card }]}>
              <View style={styles.alertDetailHeader}>
                {getAlertIcon(selectedAlert.type)}
                <View style={styles.alertDetailInfo}>
                  <Text style={[styles.alertDetailTitle, { color: colors.text }]}>
                    {selectedAlert.title}
                  </Text>
                  <Text style={[styles.alertDetailType, { color: getAlertColor(selectedAlert.type) }]}>
                    {selectedAlert.type.toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <Text style={[styles.alertDetailMessage, { color: colors.text }]}>
                {selectedAlert.message}
              </Text>
              
              <View style={styles.alertDetailMeta}>
                <View style={styles.metaItem}>
                  <Calendar color={colors.textSecondary} size={16} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {selectedAlert.timestamp.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Info color={colors.textSecondary} size={16} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {selectedAlert.acknowledged ? 
                      (language === 'de' ? 'Bestätigt' : language === 'en' ? 'Acknowledged' : 'Подтверждено') :
                      (language === 'de' ? 'Unbestätigt' : language === 'en' ? 'Unacknowledged' : 'Неподтверждено')
                    }
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={[styles.modalActions, { borderTopColor: colors.border }]}>
            {!selectedAlert.acknowledged && (
              <TouchableOpacity
                style={[styles.acknowledgeButton, { backgroundColor: colors.success }]}
                onPress={() => handleAcknowledgeAlert(selectedAlert.id)}
              >
                <Check color="#FFFFFF" size={20} />
                <Text style={styles.acknowledgeButtonText}>
                  {language === 'de' ? 'Bestätigen' : language === 'en' ? 'Acknowledge' : 'Подтвердить'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.clearButton, { backgroundColor: colors.error }]}
              onPress={() => {
                RNAlert.alert(
                  language === 'de' ? 'Alarm löschen' : language === 'en' ? 'Clear Alert' : 'Удалить тревогу',
                  language === 'de' ? 'Möchten Sie diesen Alarm wirklich löschen?' :
                  language === 'en' ? 'Do you really want to clear this alert?' :
                  'Вы действительно хотите удалить эту тревогу?',
                  [
                    { text: language === 'de' ? 'Abbrechen' : language === 'en' ? 'Cancel' : 'Отмена', style: 'cancel' },
                    {
                      text: language === 'de' ? 'Löschen' : language === 'en' ? 'Clear' : 'Удалить',
                      style: 'destructive',
                      onPress: () => handleClearAlert(selectedAlert.id),
                    },
                  ]
                );
              }}
            >
              <X color="#FFFFFF" size={20} />
              <Text style={styles.clearButtonText}>
                {language === 'de' ? 'Löschen' : language === 'en' ? 'Clear' : 'Удалить'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#EF4444', '#DC2626']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <AlertTriangle color="#FFFFFF" size={28} />
          <Text style={styles.headerTitle}>
            {language === 'de' ? 'Alarme' : language === 'en' ? 'Alarms' : 'Тревоги'}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{allAlerts.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {language === 'de' ? 'Gesamt' : language === 'en' ? 'Total' : 'Всего'}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{unacknowledgedAlerts.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {language === 'de' ? 'Aktiv' : language === 'en' ? 'Active' : 'Активные'}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{acknowledgedAlerts.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {language === 'de' ? 'Bestätigt' : language === 'en' ? 'Acknowledged' : 'Подтверждено'}
            </Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          {selectionMode ? (
            <View style={styles.selectionActions}>
              <View style={styles.selectionInfo}>
                <Text style={[styles.selectionText, { color: colors.text }]}>
                  {language === 'de' ? `${selectedAlerts.size} ausgewählt` : 
                   language === 'en' ? `${selectedAlerts.size} selected` : 
                   `${selectedAlerts.size} выбрано`}
                </Text>
                <TouchableOpacity onPress={deselectAllAlerts}>
                  <Text style={[styles.cancelSelectionText, { color: colors.primary }]}>
                    {language === 'de' ? 'Abbrechen' : language === 'en' ? 'Cancel' : 'Отмена'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.bulkActions}>
                <TouchableOpacity
                  style={[styles.bulkActionButton, { backgroundColor: colors.success }]}
                  onPress={selectAllAlerts}
                >
                  <CheckSquare color="#FFFFFF" size={18} />
                  <Text style={styles.bulkActionText}>
                    {language === 'de' ? 'Alle' : language === 'en' ? 'All' : 'Все'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.bulkActionButton, { backgroundColor: colors.primary }]}
                  onPress={handleBulkAcknowledge}
                  disabled={selectedAlerts.size === 0}
                >
                  <Check color="#FFFFFF" size={18} />
                  <Text style={styles.bulkActionText}>
                    {language === 'de' ? 'Bestätigen' : language === 'en' ? 'Acknowledge' : 'Подтвердить'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.bulkActionButton, { backgroundColor: colors.error }]}
                  onPress={handleBulkDelete}
                  disabled={selectedAlerts.size === 0}
                >
                  <Trash2 color="#FFFFFF" size={18} />
                  <Text style={styles.bulkActionText}>
                    {language === 'de' ? 'Löschen' : language === 'en' ? 'Delete' : 'Удалить'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={generatePDFReport}
            >
              <FileText color="#FFFFFF" size={20} />
              <Text style={styles.actionButtonText}>
                {language === 'de' ? 'PDF Export' : language === 'en' ? 'Export PDF' : 'Экспорт PDF'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.alertsList} showsVerticalScrollIndicator={false}>
          {unacknowledgedAlerts.length > 0 && (
            <View style={styles.alertSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {language === 'de' ? 'Aktive Alarme' : language === 'en' ? 'Active Alerts' : 'Активные тревоги'}
              </Text>
              {unacknowledgedAlerts.map(renderAlertCard)}
            </View>
          )}

          {acknowledgedAlerts.length > 0 && (
            <View style={styles.alertSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {language === 'de' ? 'Bestätigte Alarme' : language === 'en' ? 'Acknowledged Alerts' : 'Подтвержденные тревоги'}
              </Text>
              {acknowledgedAlerts.map(renderAlertCard)}
            </View>
          )}

          {allAlerts.length === 0 && (
            <View style={styles.emptyState}>
              <AlertTriangle color={colors.textSecondary} size={64} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                {language === 'de' ? 'Keine Alarme' : language === 'en' ? 'No Alerts' : 'Нет тревог'}
              </Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                {language === 'de' ? 'Alle Systeme funktionieren normal.' : 
                 language === 'en' ? 'All systems are operating normally.' : 
                 'Все системы работают нормально.'}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {renderAlertModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  content: {
    flex: 1,
    padding: 20,
    marginTop: -20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  actionsContainer: {
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  alertsList: {
    flex: 1,
  },
  alertSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertIconContainer: {
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  alertTimestamp: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  acknowledgedBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: 60,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  alertDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertDetailInfo: {
    marginLeft: 12,
    flex: 1,
  },
  alertDetailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  alertDetailType: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  alertDetailMessage: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 20,
  },
  alertDetailMeta: {
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  acknowledgeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  acknowledgeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  selectionCheckbox: {
    marginRight: 12,
    padding: 4,
  },
  selectionActions: {
    gap: 12,
  },
  selectionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  selectionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelSelectionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bulkActions: {
    flexDirection: 'row',
    gap: 8,
  },
  bulkActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  bulkActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
