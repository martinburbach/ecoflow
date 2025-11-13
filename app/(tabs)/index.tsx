import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Sun,
  Battery,
  Zap,
  TrendingUp,
  Leaf,
  AlertTriangle,
  Settings,
  BarChart3,
  Gauge,
  Plus,
  X,
  Euro,
  Building,
  HardDrive,
  Download,
  Upload,
} from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { formatNumber, formatEnergyValue, formatCurrency, calculateDetailedCosts, getPeriodDates, calculateTotalForPeriod } from '@/utils/energyCalculations';
import { router } from 'expo-router';
import { useTranslation, Translations } from '@/constants/languages';

const { width } = Dimensions.get('window');

export default function EnergyDashboard() {
  const { 
    currentEnergyData, 
    energyStats, 
    devices,
    lastMonthConsumption,
    alerts, 
    pvSystemEnabled, 
    dashboardWidgets, 
    addDashboardWidget, 
    removeDashboardWidget,
    meterReadings,
    energyProviders,
    language,
    quickAccessWidgets,
    addQuickAccessWidget,
    removeQuickAccessWidget,
    userProfile,
    restoreDefaultDashboardWidgets,
    restoreDefaultQuickAccessWidgets
  } = useApp();
  const { colors, isDark } = useTheme();
  const t = useTranslation(language);
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [showWidgetModal, setShowWidgetModal] = useState<boolean>(false);
  const [showQuickAccessModal, setShowQuickAccessModal] = useState<boolean>(false);
  const [showQuickAccessManageModal, setShowQuickAccessManageModal] = useState<boolean>(false);
  const [currentTipIndex, setCurrentTipIndex] = useState<number>(0);
  const [formData] = useState({
    showPvOnDashboard: dashboardWidgets.includes('solar-production'),
  });
  
  const currentStats = energyStats?.[selectedPeriod];
  
  const realData = useMemo(() => {
    const detailedCosts = calculateDetailedCosts(meterReadings, energyProviders, selectedPeriod, devices);

    return {
      solarProduction: detailedCosts.production,
      consumption: detailedCosts.consumption,
      batteryLevel: currentEnergyData?.batteryLevel ?? 0,
      gridFeedIn: detailedCosts.gridFeedIn,
      savings: detailedCosts.savings,
      co2Saved: detailedCosts.co2Saved,
      electricityCost: detailedCosts.costs.electricity,
      gasCost: detailedCosts.costs.gas,
      waterCost: detailedCosts.costs.water,
    };
  }, [currentEnergyData, energyProviders, selectedPeriod, meterReadings, devices]);
  
  // Generate contract expiration alerts
  const contractExpirationAlerts = useMemo(() => {
    const now = new Date();
    const alertThreshold = 35 * 24 * 60 * 60 * 1000; // 35 days in milliseconds
    
    return energyProviders
      .filter(provider => provider.validTo)
      .filter(provider => {
        const expirationDate = new Date(provider.validTo!);
        const timeDiff = expirationDate.getTime() - now.getTime();
        return timeDiff > 0 && timeDiff <= alertThreshold;
      })
      .map(provider => ({
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

  const allAlerts = [...alerts, ...contractExpirationAlerts, ...unusualConsumptionAlerts];
  const unacknowledgedAlerts = allAlerts.filter(alert => !alert.acknowledged);

  const availableWidgets = useMemo(() => {
    const staticWidgets = [
      { id: 'solar-production', title: t.solarProduction, requiresPV: true },
      { id: 'grid-feed-in', title: t.gridFeedIn, requiresPV: true },
      { id: 'savings', title: t.savings, requiresPV: false },
      { id: 'co2-saved', title: t.co2Saved, requiresPV: false },
    ];

    const dynamicWidgets: { id: string, title: string, requiresPV: boolean, deviceId?: string, meterType?: string }[] = [];
    const meterDevices = devices.filter(d => d.type === 'meter');
    const meterTypes = new Set<string>();

    meterDevices.forEach(device => {
      const reading = meterReadings.find(r => r.meterId === device.id);
      const meterType = reading?.type;

      if (meterType && meterType !== 'solar' && meterType !== 'solar_pv_feed_in') {
        dynamicWidgets.push({ id: `meter-total-consumption-${device.id}`, title: `${device.name} - ${t.consumption}`, requiresPV: false, deviceId: device.id });
        dynamicWidgets.push({ id: `meter-last-month-consumption-${device.id}`, title: `${device.name} - ${t.lastMonthConsumption}`, requiresPV: false, deviceId: device.id });
        dynamicWidgets.push({ id: `meter-total-costs-${device.id}`, title: `${device.name} - ${t.costs}`, requiresPV: false, deviceId: device.id });
        dynamicWidgets.push({ id: `meter-last-month-costs-${device.id}`, title: `${device.name} - ${t.lastMonthCosts}`, requiresPV: false, deviceId: device.id });
        
        meterTypes.add(meterType);
      }
    });

    meterTypes.forEach(type => {
      dynamicWidgets.push({ id: `metertype-total-consumption-${type}`, title: `${t.totalConsumption} ${t[type as keyof Translations] || type}`, requiresPV: false, meterType: type });
      dynamicWidgets.push({ id: `metertype-total-costs-${type}`, title: `${t.totalCosts} ${t[type as keyof Translations] || type}`, requiresPV: false, meterType: type });
    });

    return [...staticWidgets, ...dynamicWidgets];
  }, [devices, meterReadings, t, language]);

  const filteredAvailableWidgets = availableWidgets.filter(widget => 
    !widget.requiresPV || pvSystemEnabled
  );

  const handleLongPress = () => {
    setShowWidgetModal(true);
  };

  const handleQuickAccessLongPress = () => {
    setShowQuickAccessManageModal(true);
  };

  const availableQuickAccessWidgets = [
    { id: 'meter-readings', title: t.meterReadings, icon: 'Gauge', route: '/meter-readings' },

    { id: 'statistics', title: t.statistics, icon: 'BarChart3', route: '/(tabs)/analytics' },
    { id: 'all-consumption-costs', title: language === 'de' ? 'Alle Verbräuche & Kosten' : language === 'en' ? 'All Consumption & Costs' : 'Все потребление и расходы', icon: 'Euro', route: '/consumption-costs' },
    { id: 'alarms', title: t.alarms, icon: 'AlertTriangle', route: '/alarms' },
    { id: 'energy-providers', title: language === 'de' ? 'Energieversorger' : language === 'en' ? 'Energy Providers' : 'Поставщики энергии', icon: 'Building', route: '/energy-providers' },
    { id: 'devices', title: language === 'de' ? 'Geräte verwalten' : language === 'en' ? 'Manage Devices' : 'Управление устройствами', icon: 'HardDrive', route: '/devices' },
    { id: 'backup', title: language === 'de' ? 'Backup erstellen' : language === 'en' ? 'Create Backup' : 'Создать резервную копию', icon: 'Download', route: null },
    { id: 'restore', title: language === 'de' ? 'Daten wiederherstellen' : language === 'en' ? 'Restore Data' : 'Восстановить данные', icon: 'Upload', route: null }
  ];

  const toggleQuickAccessWidget = (widgetId: string) => {
    if (quickAccessWidgets.includes(widgetId)) {
      removeQuickAccessWidget(widgetId);
    } else {
      addQuickAccessWidget(widgetId);
    }
  };

  const handleQuickAccessPress = (widget: any) => {
    if (widget.route) {
      router.push(widget.route);
    } else if (widget.id === 'backup') {
      // Handle backup creation
      console.log('Creating backup...');
    } else if (widget.id === 'restore') {
      // Handle data restore
      console.log('Restoring data...');
    }
  };

  const getQuickAccessIcon = (iconName: string, color: string, size: number) => {
    switch (iconName) {
      case 'Gauge': return <Gauge color={color} size={size} />;

      case 'BarChart3': return <BarChart3 color={color} size={size} />;
      case 'AlertTriangle': return <AlertTriangle color={color} size={size} />;
      case 'Building': return <Building color={color} size={size} />;
      case 'HardDrive': return <HardDrive color={color} size={size} />;
      case 'Download': return <Download color={color} size={size} />;
      case 'Upload': return <Upload color={color} size={size} />;
      case 'Euro': return <Euro color={color} size={size} />;
      default: return <Settings color={color} size={size} />;
    }
  };

  const toggleWidget = (widgetId: string) => {
    if (dashboardWidgets.includes(widgetId)) {
      removeDashboardWidget(widgetId);
    } else {
      addDashboardWidget(widgetId);
    }
  };

  // Check if main dashboard widgets section is empty
  const mainWidgetsEmpty = !dashboardWidgets.some(id => 
    ['solar-production', 'consumption', 'grid-feed-in', 'savings', 'co2-saved', 'electricity-cost', 'gas-cost', 'water-cost', 'last-month-cost', 'last-month-consumption'].includes(id)
  );

  // Calculate last month's data
  const lastMonthData = useMemo(() => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    const detailedCosts = calculateDetailedCosts(meterReadings, energyProviders, 'monthly', devices, lastMonth);
    
    return {
      totalCost: detailedCosts.costs.total,
      totalConsumption: detailedCosts.realConsumption.electricity + detailedCosts.realConsumption.gas + detailedCosts.realConsumption.water
    };
  }, [meterReadings, energyProviders, devices]);

  // Check if quick access section is empty
  const quickAccessEmpty = quickAccessWidgets.length === 0;

  // Rotating tips for "Erste Schritte" section
  const allTips = [
    {
      icon: '📊',
      text: language === 'de' ? 'Erfassen Sie Ihre ersten Zählerstände, um mit der Energieüberwachung zu beginnen.' : 
            language === 'en' ? 'Record your first meter readings to start energy monitoring.' : 
            'Записывайте показания счетчиков для начала мониторинга энергии.'
    },
    {
      icon: '⚡',
      text: language === 'de' ? 'Erfassen Sie Ihren Energieversorger, um Kosten im Blick zu behalten.' : 
            language === 'en' ? 'Add your energy provider to track costs.' : 
            'Добавьте поставщика энергии для отслеживания расходов.'
    },

    {
      icon: '📈',
      text: language === 'de' ? 'Nutzen Sie die Statistiken zur Optimierung Ihres Energieverbrauchs.' : 
            language === 'en' ? 'Use statistics to optimize your energy consumption.' : 
            'Используйте статистику для оптимизации энергопотребления.'
    },
    {
      icon: '🔔',
      text: language === 'de' ? 'Aktivieren Sie Alarme für wichtige Ereignisse und Grenzwerte.' : 
            language === 'en' ? 'Enable alarms for important events and thresholds.' : 
            'Включите уведомления для важных событий и пороговых значений.'
    },
    {
      icon: '💾',
      text: language === 'de' ? 'Erstellen Sie regelmäßig Backups Ihrer Energiedaten.' : 
            language === 'en' ? 'Create regular backups of your energy data.' : 
            'Регулярно создавайте резервные копии данных об энергии.'
    },
    {
      icon: '🌱',
      text: language === 'de' ? 'Verfolgen Sie Ihre CO₂-Einsparungen und Umweltauswirkungen.' : 
            language === 'en' ? 'Track your CO₂ savings and environmental impact.' : 
            'Отслеживайте экономию CO₂ и воздействие на окружающую среду.'
    },
    {
      icon: '🏠',
      text: language === 'de' ? 'Verwalten Sie mehrere Immobilien zentral in einer App.' : 
            language === 'en' ? 'Manage multiple properties centrally in one app.' : 
            'Управляйте несколькими объектами недвижимости централизованно в одном приложении.'
    }
  ];

  // Rotate tips every 10 seconds, showing 2 at a time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 2) % allTips.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [allTips.length]);

  const currentTips = [
    allTips[currentTipIndex],
    allTips[(currentTipIndex + 1) % allTips.length]
  ];

  const EnergyCard = ({ id, title, value, unit, icon, color, trend, subValue, subValueUnit, subValueLabel }: any) => {
    return (
      <TouchableOpacity 
        style={[styles.energyCard, { borderLeftColor: color, backgroundColor: colors.card }]}
        onLongPress={handleLongPress}
        delayLongPress={500}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            {icon}
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardValue, { color: colors.text }]}>{value}</Text>
          <Text style={[styles.cardUnit, { color: colors.textSecondary }]}>{unit}</Text>
        </View>
        {subValue && (
          <View style={{ marginTop: 8 }}>
            {subValueLabel && <Text style={{ fontSize: 12, color: colors.textSecondary }}>{subValueLabel}</Text>}
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>{subValue}</Text>
              {subValueUnit && <Text style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 4 }}>{subValueUnit}</Text>}
            </View>
          </View>
        )}
        {trend && (
          <Text style={[styles.trend, { color: trend.startsWith('+') ? '#10B981' : '#EF4444' }]}>
            {trend}
          </Text>
        )}
      </TouchableOpacity>
    );
  };





  const renderPeriodSelector = () => (
    <View style={[styles.periodSelector, { backgroundColor: colors.card }]}>
      {(['weekly', 'monthly'] as const).map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive,
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text
            style={[
              styles.periodButtonText,
              { color: colors.textSecondary },
              selectedPeriod === period && styles.periodButtonTextActive,
            ]}
          >
            {period === 'weekly' ? t.week : t.month}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
    <ScrollView showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#10B981', '#059669']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>{t.goodAfternoon}</Text>
          <Text style={styles.subtitle}>{t.energyOverview}</Text>
        </View>
      </LinearGradient>

      <View style={[styles.content, { backgroundColor: colors.background }]}>
        {renderPeriodSelector()}

        <View style={styles.mainStats}>
          {dashboardWidgets.map(widgetId => {
            if (widgetId === 'solar-production' && pvSystemEnabled) {
              return <EnergyCard
                key={widgetId}
                id={'solar-production'}
                title={t.solarProduction}
                value={formatNumber(realData.solarProduction, 1)}
                unit={'kWh'}
                icon={<Sun color="#F59E0B" size={20} />}
                color={'#F59E0B'}
                trend={(currentStats?.production ?? 0) > 0 ? '+12%' : undefined}
              />;
            }

            if (widgetId.startsWith('meter-total-consumption-')) {
              const deviceId = widgetId.replace('meter-total-consumption-', '');
              const device = devices.find(d => d.id === deviceId);
              if (!device) return null;

              const deviceReadings = meterReadings
                .filter(r => r.meterId === deviceId)
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

              if (deviceReadings.length > 0) {
                const lastReading = deviceReadings[deviceReadings.length - 1];
                const previousReading = deviceReadings.length > 1 ? deviceReadings[deviceReadings.length - 2] : null;

                return <EnergyCard
                  key={widgetId}
                  id={widgetId}
                  title={`${device.name}`}
                  value={formatNumber(lastReading.reading, 1)}
                  unit={lastReading.unit}
                  icon={<Zap color="#3B82F6" size={20} />}
                  color={'#3B82F6'}
                  subValue={previousReading ? formatNumber(lastReading.reading - previousReading.reading, 1) : '-'}
                  subValueUnit={lastReading.unit}
                  subValueLabel={'Seit letzter Ablesung'}
                />;
              }
            }
            
            if (widgetId.startsWith('meter-last-month-consumption-')) {
                const deviceId = widgetId.replace('meter-last-month-consumption-', '');
                const device = devices.find(d => d.id === deviceId);
                if (!device) return null;

                const now = new Date();
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const { startDate, endDate } = getPeriodDates('monthly', lastMonth);

                const consumption = calculateTotalForPeriod(meterReadings, startDate, endDate, [device.id]);

                return <EnergyCard
                    key={widgetId}
                    id={widgetId}
                    title={`${device.name} - Letzter Monat`}
                    value={formatNumber(consumption.total, 1)}
                    unit={'kWh'}
                    icon={<Zap color="#3B82F6" size={20} />}
                    color={'#3B82F6'}
                />;
            }

            if (widgetId === 'grid-feed-in' && pvSystemEnabled) {
              return <EnergyCard
                key={widgetId}
                id={'grid-feed-in'}
                title={t.gridFeedIn}
                value={formatNumber(realData.gridFeedIn, 1)}
                unit={'kWh'}
                icon={<TrendingUp color="#10B981" size={20} />}
                color={'#10B981'}
              />;
            }

            if (widgetId === 'savings') {
              return <EnergyCard
                key={widgetId}
                id={'savings'}
                title={t.savings}
                value={formatNumber(realData.savings, 2)}
                unit={'€'}
                icon={<Leaf color="#059669" size={20} />}
                color={'#059669'}
              />;
            }

            if (widgetId === 'co2-saved') {
              return <EnergyCard
                key={widgetId}
                id={'co2-saved'}
                title={selectedPeriod === 'weekly' 
                  ? (language === 'de' ? 'CO2 diese Woche eingespart' : language === 'en' ? 'CO2 saved this week' : 'CO2 сэкономлено на этой неделе') 
                  : (language === 'de' ? 'CO2 diesen Monat eingespart' : language === 'en' ? 'CO2 saved this month' : 'CO2 сэкономлено в этом месяце')}
                value={formatNumber(realData.co2Saved, 1)}
                unit={'kg'}
                icon={<Leaf color="#10B981" size={20} />}
                color={'#10B981'}
              />;
            }

            return null;
          })}
        </View>

        {/* Show restore button when main widgets are empty */}
        {mainWidgetsEmpty && (
          <View style={styles.emptySection}>
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <View style={styles.emptyIconContainer}>
                <Settings color={colors.textSecondary} size={32} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {language === 'de' ? 'Keine Widgets vorhanden' : 
                 language === 'en' ? 'No Widgets Available' : 
                 'Нет доступных виджетов'}
              </Text>
              <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                {language === 'de' ? 'Sie haben alle Widgets aus diesem Bereich entfernt. Klicken Sie unten, um die Standard-Widgets wiederherzustellen.' : 
                 language === 'en' ? 'You have removed all widgets from this section. Click below to restore the default widgets.' : 
                 'Вы удалили все виджеты из этого раздела. Нажмите ниже, чтобы восстановить виджеты по умолчанию.'}
              </Text>
              <TouchableOpacity 
                style={[styles.restoreButton, { backgroundColor: colors.primary }]}
                onPress={restoreDefaultDashboardWidgets}
              >
                <Plus color="#FFFFFF" size={20} />
                <Text style={styles.restoreButtonText}>
                  {language === 'de' ? 'Standard-Widgets wiederherstellen' : 
                   language === 'en' ? 'Restore Default Widgets' : 
                   'Восстановить виджеты по умолчанию'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}



        {dashboardWidgets.includes('co2-saved') && (
          <View style={styles.environmentalImpact}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.environmentalImpact}</Text>
            <TouchableOpacity 
              style={[styles.co2Card, { backgroundColor: colors.card }]}
              onLongPress={handleLongPress}
              delayLongPress={500}
            >
              <Leaf color="#10B981" size={32} />
              <View style={styles.co2Content}>
                <Text style={styles.co2Value}>{formatNumber(realData.co2Saved, 1)} kg</Text>
                <Text style={[styles.co2Label, { color: colors.textSecondary }]}>CO₂ {selectedPeriod === 'week' ? (language === 'de' ? 'diese Woche' : language === 'en' ? 'this week' : 'эта неделя') : (language === 'de' ? 'diesen Monat' : language === 'en' ? 'this month' : 'этот месяц')} {language === 'de' ? 'eingespart' : language === 'en' ? 'saved' : 'сэкономлено'}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.quickActions}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.quickAccess}</Text>
          {quickAccessEmpty ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <View style={styles.emptyIconContainer}>
                <Settings color={colors.textSecondary} size={32} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {language === 'de' ? 'Keine Schnellzugriffe vorhanden' : 
                 language === 'en' ? 'No Quick Access Available' : 
                 'Нет быстрого доступа'}
              </Text>
              <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                {language === 'de' ? 'Sie haben alle Schnellzugriffe entfernt. Klicken Sie unten, um die Standard-Schnellzugriffe wiederherzustellen.' : 
                 language === 'en' ? 'You have removed all quick access items. Click below to restore the default quick access items.' : 
                 'Вы удалили все элементы быстрого доступа. Нажмите ниже, чтобы восстановить элементы быстрого доступа по умолчанию.'}
              </Text>
              <TouchableOpacity 
                style={[styles.restoreButton, { backgroundColor: colors.primary }]}
                onPress={restoreDefaultQuickAccessWidgets}
              >
                <Plus color="#FFFFFF" size={20} />
                <Text style={styles.restoreButtonText}>
                  {language === 'de' ? 'Standard-Schnellzugriffe wiederherstellen' : 
                   language === 'en' ? 'Restore Default Quick Access' : 
                   'Восстановить быстрый доступ по умолчанию'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            (() => {
              const visibleWidgets = availableQuickAccessWidgets.filter(widget => quickAccessWidgets.includes(widget.id));
              const rows = [];
              
              for (let i = 0; i < visibleWidgets.length; i += 2) {
                const widget1 = visibleWidgets[i];
                const widget2 = visibleWidgets[i + 1];
                
                const isAlarmWidget1 = widget1?.id === 'alarms';
                const hasAlerts1 = isAlarmWidget1 && unacknowledgedAlerts.length > 0;
                
                const isAlarmWidget2 = widget2?.id === 'alarms';
                const hasAlerts2 = isAlarmWidget2 && unacknowledgedAlerts.length > 0;
                
                rows.push(
                  <View key={`row-${i}`} style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={[styles.actionButton, hasAlerts1 && styles.actionButtonAlert, { backgroundColor: colors.card }]}
                      onPress={() => handleQuickAccessPress(widget1)}
                      onLongPress={handleQuickAccessLongPress}
                      delayLongPress={500}
                    >
                      {getQuickAccessIcon(widget1.icon, hasAlerts1 ? "#EF4444" : colors.secondary, 24)}
                      <Text style={[styles.actionButtonText, hasAlerts1 && styles.actionButtonTextAlert, { color: colors.text }]}>{widget1.title}</Text>
                      {hasAlerts1 && (
                        <View style={styles.alertBadge}>
                          <Text style={styles.alertBadgeText}>{unacknowledgedAlerts.length}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    {widget2 ? (
                      <TouchableOpacity 
                        style={[styles.actionButton, hasAlerts2 && styles.actionButtonAlert, { backgroundColor: colors.card }]}
                        onPress={() => handleQuickAccessPress(widget2)}
                        onLongPress={handleQuickAccessLongPress}
                        delayLongPress={500}
                      >
                        {getQuickAccessIcon(widget2.icon, hasAlerts2 ? "#EF4444" : colors.secondary, 24)}
                        <Text style={[styles.actionButtonText, hasAlerts2 && styles.actionButtonTextAlert, { color: colors.text }]}>{widget2.title}</Text>
                        {hasAlerts2 && (
                          <View style={styles.alertBadge}>
                            <Text style={styles.alertBadgeText}>{unacknowledgedAlerts.length}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.actionButton} />
                    )}
                  </View>
                );
              }
              
              return rows;
            })()
          )}
        </View>

        {currentStats && currentStats.autarky < 50 && (
          <View style={styles.tips}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.energyTip}</Text>
            <View style={styles.tipCard}>
              <Text style={styles.tipText}>
                💡 {language === 'de' ? `Ihre Autarkie liegt bei ${formatNumber(currentStats.autarky, 0)}%. Verlagern Sie energieintensive Tätigkeiten in die Mittagszeit!` : language === 'en' ? `Your self-sufficiency is at ${formatNumber(currentStats.autarky, 0)}%. Shift energy-intensive activities to midday!` : `Ваша автономность составляет ${formatNumber(currentStats.autarky, 0)}%. Перенесите энергоемкие задачи на полдень!`}
              </Text>
            </View>
          </View>
        )}
        
        <View style={styles.tips}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.firstSteps}</Text>
          {currentTips.map((tip, index) => (
            <View key={`${currentTipIndex}-${index}`} style={[styles.tipCard, { marginBottom: 16 }]}>
              <Text style={styles.tipText}>
                {tip.icon} {tip.text}
              </Text>
            </View>
          ))}
        </View>
        
        {/* Zeige Hinweis wenn keine Zählerstände vorhanden */}
        {meterReadings.length === 0 && (
          <View style={styles.tips}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Erste Schritte</Text>
            <View style={[styles.tipCard, { backgroundColor: '#E3F2FD', borderLeftColor: '#2196F3' }]}>
              <Text style={[styles.tipText, { color: '#1565C0' }]}>
                📊 Erfassen Sie Ihre ersten Zählerstände, um mit der Energieüberwachung zu beginnen und echte Verbrauchsdaten zu sehen.
              </Text>
            </View>
            <View style={[styles.tipCard, { backgroundColor: '#E8F5E8', borderLeftColor: '#4CAF50' }]}>
              <Text style={[styles.tipText, { color: '#2E7D32' }]}>
                ⚡ Fügen Sie Ihre Energieversorger hinzu, um genaue Kostenberechnungen zu erhalten.
              </Text>
            </View>
          </View>
        )}
        
        {/* Zeige Debug-Informationen für Entwicklung */}
        {__DEV__ && (
          <View style={styles.tips}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Debug Info</Text>
            <View style={[styles.tipCard, { backgroundColor: '#FFF3E0', borderLeftColor: '#FF9800' }]}>
              <Text style={[styles.tipText, { color: '#E65100', fontSize: 12 }]}>
                Zählerstände: {meterReadings.length} | 
                Anbieter: {energyProviders.length} | 
                Produktion: {formatNumber(realData.solarProduction, 1)} kWh | 
                Verbrauch: {formatNumber(realData.consumption, 1)} kWh | 
                Strom: {formatNumber(realData.electricityCost, 2)} € | 
                Gas: {formatNumber(realData.gasCost, 2)} € | 
                Wasser: {formatNumber(realData.waterCost, 2)} €
              </Text>
            </View>
          </View>
        )}
        

      </View>
      
      <Modal
        visible={showWidgetModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWidgetModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowWidgetModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t.addRemoveWidgets}</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>{language === 'de' ? 'Tippen Sie auf ein Widget, um es hinzuzufügen oder zu entfernen' : language === 'en' ? 'Tap on a widget to add or remove it' : 'Нажмите на виджет, чтобы добавить или удалить его'}</Text>
            
            <ScrollView style={styles.widgetList}>
              {filteredAvailableWidgets.map((widget) => (
                <TouchableOpacity
                  key={widget.id}
                  style={[
                    styles.widgetOption,
                    { backgroundColor: colors.background },
                    dashboardWidgets.includes(widget.id) && styles.widgetOptionActive
                  ]}
                  onPress={() => toggleWidget(widget.id)}
                >
                  <Text style={[
                    styles.widgetOptionText,
                    { color: colors.text },
                    dashboardWidgets.includes(widget.id) && styles.widgetOptionTextActive
                  ]}>
                    {widget.title}
                  </Text>
                  {dashboardWidgets.includes(widget.id) && (
                    <X color="#FFFFFF" size={20} />
                  )}
                  {!dashboardWidgets.includes(widget.id) && (
                    <Plus color={colors.textSecondary} size={20} />
                  )}
                </TouchableOpacity>
              ))}
              

            </ScrollView>
            
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowWidgetModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>{t.done}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
      
      <Modal
        visible={showQuickAccessManageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQuickAccessManageModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowQuickAccessManageModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{language === 'de' ? 'Schnellzugriffe verwalten' : language === 'en' ? 'Manage Quick Access' : 'Управление быстрым доступом'}</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>{language === 'de' ? 'Tippen Sie auf ein Widget, um es hinzuzufügen oder zu entfernen' : language === 'en' ? 'Tap on a widget to add or remove it' : 'Нажмите на виджет, чтобы добавить или удалить его'}</Text>
            
            <ScrollView style={styles.widgetList}>
              {availableQuickAccessWidgets.map((widget) => (
                <TouchableOpacity
                  key={widget.id}
                  style={[
                    styles.widgetOption,
                    { backgroundColor: colors.background },
                    quickAccessWidgets.includes(widget.id) && styles.widgetOptionActive
                  ]}
                  onPress={() => toggleQuickAccessWidget(widget.id)}
                >
                  <View style={styles.widgetOptionContent}>
                    {getQuickAccessIcon(widget.icon, quickAccessWidgets.includes(widget.id) ? '#FFFFFF' : colors.textSecondary, 20)}
                    <Text style={[
                      styles.widgetOptionText,
                      { color: colors.text, marginLeft: 12 },
                      quickAccessWidgets.includes(widget.id) && styles.widgetOptionTextActive
                    ]}>
                      {widget.title}
                    </Text>
                  </View>
                  {quickAccessWidgets.includes(widget.id) && (
                    <X color="#FFFFFF" size={20} />
                  )}
                  {!quickAccessWidgets.includes(widget.id) && (
                    <Plus color={colors.textSecondary} size={20} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowQuickAccessManageModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>{t.done}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pvSystemInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pvSystemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pvSystemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  pvSystemDetails: {
    gap: 12,
  },
  pvSystemDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pvSystemDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  pvSystemDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    flex: 1,
    marginLeft: 8,
  },
  settingsButton: {
    padding: 8,
  },
  content: {
    padding: 20,
    marginTop: -20,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#10B981',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  mainStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  energyCard: {
    flex: 1,
    minWidth: (width - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  cardUnit: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  trend: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  batteryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  batteryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  batteryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
    marginLeft: 8,
  },
  batteryLevel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  batteryBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  batteryFill: {
    height: '100%',
    borderRadius: 4,
  },
  batteryStatus: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  secondaryStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  environmentalImpact: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  co2Card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  co2Content: {
    marginLeft: 16,
  },
  co2Value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  co2Label: {
    fontSize: 14,
    color: '#6B7280',
  },
  quickActions: {
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
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
    position: 'relative',
  },
  actionButtonAlert: {
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
  },
  actionButtonTextAlert: {
    color: '#EF4444',
  },
  alertBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tips: {
    marginBottom: 20,
  },
  tipCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  addWidgetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#10B981',
    borderStyle: 'dashed',
  },
  addWidgetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 8,
  },
  connectionWidgets: {
    marginBottom: 20,
  },
  connectionWidgetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  widgetList: {
    maxHeight: 400,
  },
  widgetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  widgetOptionActive: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  widgetOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  widgetOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  widgetOptionTextActive: {
    color: '#FFFFFF',
  },
  modalCloseButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptySection: {
    marginBottom: 20,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});