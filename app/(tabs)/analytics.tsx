import React, { useState, useMemo } from 'react';
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
  TrendingUp,
  TrendingDown,
  Calendar,
  Zap,
  Sun,
  Battery,
  Euro,
  Plus,
  X,
  Settings,

} from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { formatNumber, calculateDetailedCosts, calculateTotalForPeriod, calculateProduction, getPeriodDates } from '@/utils/energyCalculations';
import { useTranslation, Translations } from '@/constants/languages';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

interface ChartData {
  label: string;
  production: number;
  consumption: number;
}



export default function AnalyticsScreen() {
  const { 
    energyStats, 
    pvSystemEnabled, 
    analyticsWidgets, 
    addAnalyticsWidget, 
    removeAnalyticsWidget,
    meterReadings,
    energyProviders,
    language,
    theme,
    restoreDefaultAnalyticsWidgets,
    devices
  } = useApp();
  const t = useTranslation(language);
  const { colors } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [showWidgetModal, setShowWidgetModal] = useState<boolean>(false);
  const [showChartOptions, setShowChartOptions] = useState<boolean>(false);
  const [chartDisplayOptions, setChartDisplayOptions] = useState<{
    showProduction: boolean;
    showConsumption: boolean;
    showCosts: boolean;
    showTotal: boolean;
  }>({
    showProduction: true,
    showConsumption: true,
    showCosts: false,
    showTotal: true
  });
  
  const currentStats = energyStats?.[selectedPeriod === 'week' ? 'weekly' : selectedPeriod === 'month' ? 'monthly' : 'yearly'];

  const realCostData = useMemo(() => {
    if (!meterReadings.length) {
      return { 
        electricityCost: 0, 
        gasCost: 0, 
        waterCost: 0, 
        totalCost: 0,
        electricityConsumption: 0,
        gasConsumption: 0,
        waterConsumption: 0
      };
    }

    const electricityProvider = energyProviders.find(p => p.type === 'electricity');
    const gasProvider = energyProviders.find(p => p.type === 'gas');
    const waterProvider = energyProviders.find(p => p.type === 'water');
    
    console.log('Analytics realCostData calculation:', {
      selectedPeriod,
      meterReadingsCount: meterReadings.length,
      electricityProvider: electricityProvider?.name,
      gasProvider: gasProvider?.name,
      waterProvider: waterProvider?.name
    });
    
    // Use the detailed cost calculation from utils
    const detailedCosts = calculateDetailedCosts(meterReadings, energyProviders, selectedPeriod, devices);
    
    console.log('Detailed costs result:', detailedCosts);
    
    return {
      electricityCost: detailedCosts.costs.electricity,
      gasCost: detailedCosts.costs.gas,
      waterCost: detailedCosts.costs.water,
      totalCost: detailedCosts.costs.total,
      electricityConsumption: detailedCosts.realConsumption.electricity,
      gasConsumption: detailedCosts.realConsumption.gas,
      waterConsumption: detailedCosts.realConsumption.water
    };
  }, [meterReadings, energyProviders, selectedPeriod, devices]);

  const availableWidgets = useMemo(() => {
    const staticWidgets = [
      { id: 'total-production', title: t.totalProduction, requiresPV: true },
      { id: 'autarky', title: t.autarky, requiresPV: true },
      { id: 'self-consumption', title: t.selfConsumption, requiresPV: true },
    ];

    const dynamicWidgets: { id: string, title: string, requiresPV: boolean, deviceId?: string, meterType?: string }[] = [];
    const meterDevices = devices.filter(d => d.type === 'meter');
    const meterTypes = new Set<string>();

    meterDevices.forEach(device => {
      const reading = meterReadings.find(r => r.meterId === device.id);
      const meterType = reading?.type;

      if (meterType && meterType !== 'solar' && meterType !== 'solar_pv_feed_in') {
        dynamicWidgets.push({ id: `meter-total-costs-${device.id}`, title: `${device.name} - ${t.costs}`, requiresPV: false, deviceId: device.id });
        dynamicWidgets.push({ id: `meter-last-month-costs-${device.id}`, title: `${device.name} - ${t.lastMonthCosts}`, requiresPV: false, deviceId: device.id });
        
        meterTypes.add(meterType);
      }
    });

    meterTypes.forEach(type => {
      dynamicWidgets.push({ id: `metertype-total-consumption-${type}`, title: `${t.totalConsumption} ${t[type as keyof Translations]}`, requiresPV: false, meterType: type });
      dynamicWidgets.push({ id: `metertype-total-costs-${type}`, title: `${t.totalCosts} ${t[type as keyof Translations]}`, requiresPV: false, meterType: type });
    });

    return [...staticWidgets, ...dynamicWidgets];
  }, [devices, meterReadings, t, language]);

  const filteredAvailableWidgets = availableWidgets.filter(widget => 
    !widget.requiresPV || pvSystemEnabled
  );

  const handleLongPress = () => {
    setShowWidgetModal(true);
  };

  const toggleWidget = (widgetId: string) => {
    if (analyticsWidgets.includes(widgetId)) {
      removeAnalyticsWidget(widgetId);
    } else {
      addAnalyticsWidget(widgetId);
    }
  };

  // Check if analytics widgets section is empty
  const analyticsWidgetsEmpty = !analyticsWidgets.some(id => 
    ['total-production', 'total-consumption', 'autarky', 'self-consumption', 'cost-electricity', 'cost-gas', 'cost-water', 'last-month-cost', 'last-month-consumption', 'all-consumption-costs'].includes(id)
  );

  // Calculate last month's data
  const lastMonthData = useMemo(() => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const lastMonthReadings = meterReadings.filter(reading => {
      const readingDate = new Date(reading.timestamp);
      return readingDate >= lastMonth && readingDate < thisMonth;
    });
    
    if (lastMonthReadings.length === 0) {
      return { totalCost: 0, totalConsumption: 0 };
    }
    
    const detailedCosts = calculateDetailedCosts(lastMonthReadings, energyProviders, 'month', devices);
    
    return {
      totalCost: detailedCosts.costs.total,
      totalConsumption: detailedCosts.consumption
    };
  }, [meterReadings, energyProviders, devices]);

  const chartData = useMemo(() => {
    const data: ChartData[] = [];
    const today = new Date();

    if (selectedPeriod === 'week') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

        const production = calculateProduction(meterReadings, devices, startOfDay, endOfDay);
        const consumption = calculateTotalForPeriod(meterReadings, startOfDay, endOfDay, ['electricity']).total;

        data.push({
          label: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][date.getDay()],
          production: Math.max(0, production),
          consumption: Math.max(0, consumption),
        });
      }
    } else if (selectedPeriod === 'month') {
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(today.getFullYear(), today.getMonth(), i);
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

        const production = calculateProduction(meterReadings, devices, startOfDay, endOfDay);
        const consumption = calculateTotalForPeriod(meterReadings, startOfDay, endOfDay, ['electricity']).total;

        data.push({
          label: i.toString(),
          production: Math.max(0, production),
          consumption: Math.max(0, consumption),
        });
      }
    } else if (selectedPeriod === 'year') {
      for (let i = 0; i < 12; i++) {
        const month = new Date(today.getFullYear(), i, 1);
        const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
        const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

        const production = calculateProduction(meterReadings, devices, startOfMonth, endOfMonth);
        const consumption = calculateTotalForPeriod(meterReadings, startOfMonth, endOfMonth, ['electricity']).total;

        data.push({
          label: month.toLocaleString(language, { month: 'short' }),
          production: Math.max(0, production),
          consumption: Math.max(0, consumption),
        });
      }
    }
    
    return data;
  }, [meterReadings, selectedPeriod, language, devices]);

  // Enhanced chart data with costs
  const enhancedChartData = useMemo(() => {
    return chartData.map(data => {
      const electricityProvider = energyProviders.find(p => p.type === 'electricity');
      const electricityCost = data.consumption * (electricityProvider?.pricePerUnit || 0.32);
      return {
        ...data,
        electricityCost,
        totalCost: electricityCost // Can be extended with gas/water costs
      };
    });
  }, [chartData, energyProviders]);

  const maxValue = Math.max(
    ...enhancedChartData.map(d => {
      let values = [];
      if (chartDisplayOptions.showProduction) values.push(d.production);
      if (chartDisplayOptions.showConsumption) values.push(d.consumption);
      if (chartDisplayOptions.showCosts) values.push(d.totalCost * 10); // Scale costs for visibility
      return Math.max(...values, 1);
    }),
    1 // Minimum value to avoid division by zero
  );

  // Forecast calculations
  const forecastData = useMemo(() => {
    console.log('Calculating forecast data:', {
      currentStats,
      realCostData,
      pvSystemEnabled,
      selectedPeriod
    });
    
    // Use real data or fallback to reasonable defaults
    const currentConsumption = currentStats?.consumption || realCostData.electricityConsumption || 0;
    const currentProduction = currentStats?.production || 0;
    const currentCosts = realCostData.totalCost || 0;
    
    console.log('Forecast base values:', {
      currentConsumption,
      currentProduction,
      currentCosts
    });
    
    // If we have no data, create reasonable forecasts based on typical household values
    const baseConsumption = currentConsumption > 0 ? currentConsumption : 
      (selectedPeriod === 'week' ? 35 : selectedPeriod === 'month' ? 150 : 1800); // kWh
    const baseProduction = currentProduction > 0 ? currentProduction : 
      (pvSystemEnabled ? (selectedPeriod === 'week' ? 40 : selectedPeriod === 'month' ? 170 : 2000) : 0); // kWh
    const baseCosts = currentCosts > 0 ? currentCosts : 
      (selectedPeriod === 'week' ? 25 : selectedPeriod === 'month' ? 110 : 1300); // €
    
    // Simple trend-based forecasting with seasonal adjustments
    const seasonalFactor = new Date().getMonth() >= 3 && new Date().getMonth() <= 8 ? 1.1 : 0.9; // Summer/Winter
    
    const weeklyForecast = {
      consumption: baseConsumption * 1.02, // 2% increase assumption
      production: pvSystemEnabled ? baseProduction * seasonalFactor * 1.05 : 0, // 5% increase with better weather
      costs: baseCosts * 1.02 // 2% cost increase
    };
    
    const monthlyForecast = {
      consumption: weeklyForecast.consumption * 4.3,
      production: weeklyForecast.production * 4.3,
      costs: weeklyForecast.costs * 4.3
    };
    
    const yearlyForecast = {
      consumption: monthlyForecast.consumption * 12,
      production: monthlyForecast.production * 12,
      costs: monthlyForecast.costs * 12
    };
    
    const electricityPrice = energyProviders.find(p => p.type === 'electricity')?.pricePerUnit || 0.32;
    const savings = pvSystemEnabled ? 
      Math.max(0, (weeklyForecast.production * electricityPrice * 0.7) - (weeklyForecast.costs * 0.3)) : 0;
    
    const result = {
      weekly: weeklyForecast,
      monthly: monthlyForecast,
      yearly: yearlyForecast,
      savings
    };
    
    console.log('Final forecast result:', result);
    
    return result;
  }, [currentStats, realCostData, pvSystemEnabled, selectedPeriod, energyProviders]);

  const renderChart = () => {
    const barWidth = selectedPeriod === 'month' ? 10 : selectedPeriod === 'year' ? 20 : 30;
    const chartWidth = enhancedChartData.length * (barWidth + 10);

    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            {language === 'de' ? 'Energie-Diagramm' : language === 'en' ? 'Energy Chart' : 'График энергии'}
          </Text>
          <TouchableOpacity 
            style={styles.chartOptionsButton}
            onPress={() => setShowChartOptions(true)}
          >
            <Settings color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
          <View style={[styles.chart, { width: chartWidth }]}>
            {enhancedChartData.map((data, index) => {
              const productionHeight = (data.production / maxValue) * 150;
              const consumptionHeight = (data.consumption / maxValue) * 150;
              const costHeight = ((data.totalCost * 10) / maxValue) * 150;
              
              return (
                <View key={index} style={[styles.chartBar, { width: barWidth }]}>
                  {/* Value labels above bars */}
                  <View style={styles.valueLabelsContainer}>
                    {chartDisplayOptions.showProduction && pvSystemEnabled && data.production > 0 && (
                      <Text style={[styles.valueLabel, { color: '#10B981' }]}>
                        {formatNumber(data.production, 1)}
                      </Text>
                    )}
                    {chartDisplayOptions.showConsumption && data.consumption > 0 && (
                      <Text style={[styles.valueLabel, { color: '#3B82F6' }]}>
                        {formatNumber(data.consumption, 1)}
                      </Text>
                    )}
                    {chartDisplayOptions.showCosts && data.totalCost > 0 && (
                      <Text style={[styles.valueLabel, { color: '#EF4444' }]}>
                        {formatNumber(data.totalCost, 2)}€
                      </Text>
                    )}
                  </View>
                  
                  <View style={styles.barContainer}>
                    {chartDisplayOptions.showProduction && pvSystemEnabled && (
                      <View
                        style={[
                          styles.productionBar,
                          { height: Math.max(2, productionHeight), width: barWidth / 3 }
                        ]}
                      />
                    )}
                    {chartDisplayOptions.showConsumption && (
                      <View
                        style={[
                          styles.consumptionBar,
                          { height: Math.max(2, consumptionHeight), width: barWidth / 3 }
                        ]}
                      />
                    )}
                    {chartDisplayOptions.showCosts && (
                      <View
                        style={[
                          styles.costBar,
                          { height: Math.max(2, costHeight), width: barWidth / 3 }
                        ]}
                      />
                    )}
                  </View>
                  <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>{data.label}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
        <View style={styles.legend}>
          {chartDisplayOptions.showProduction && pvSystemEnabled && (
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>{language === 'de' ? 'Produktion' : language === 'en' ? 'Production' : 'Производство'}</Text>
            </View>
          )}
          {chartDisplayOptions.showConsumption && (
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#3B82F6' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>{language === 'de' ? 'Verbrauch' : language === 'en' ? 'Consumption' : 'Потребление'}</Text>
            </View>
          )}
          {chartDisplayOptions.showCosts && (
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>{language === 'de' ? 'Kosten (×10)' : language === 'en' ? 'Costs (×10)' : 'Расходы (×10)'}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const StatCard = ({ id, title, value, change, isPositive, icon }: any) => {
    return (
      <TouchableOpacity 
        style={[styles.statCard, { backgroundColor: colors.card }]}
        onLongPress={handleLongPress}
        delayLongPress={500}
      >
        <View style={styles.statHeader}>
          <View>{icon}</View>
          <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
        </View>
        <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
        <View style={styles.statChange}>
          {isPositive ? (
            <TrendingUp color="#10B981" size={16} />
          ) : (
            <TrendingDown color="#EF4444" size={16} />
          )}
          <Text style={[styles.changeText, { color: isPositive ? '#10B981' : '#EF4444' }]}>
            {change}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPeriodSelector = () => (
    <View style={[styles.periodSelector, { backgroundColor: colors.card }]}>
      {(['week', 'month', 'year'] as const).map((period) => (
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
              selectedPeriod === period && styles.periodButtonTextActive,
            ]}
          >
            {period === 'week' ? (language === 'de' ? 'Woche' : language === 'en' ? 'Week' : 'Неделя') : 
             period === 'month' ? (language === 'de' ? 'Monat' : language === 'en' ? 'Month' : 'Месяц') : 
             (language === 'de' ? 'Jahr' : language === 'en' ? 'Year' : 'Год')}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={theme === 'dark' ? ['#1F2937', '#111827'] : ['#3B82F6', '#1D4ED8']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Calendar color="#FFFFFF" size={28} />
          <Text style={styles.headerTitle}>{language === 'de' ? 'Energie-Statistiken' : language === 'en' ? 'Energy Statistics' : 'Статистика энергии'}</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {renderPeriodSelector()}

        {analyticsWidgetsEmpty ? (
          <View style={styles.emptySection}>
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <View style={styles.emptyIconContainer}>
                <Settings color={colors.textSecondary} size={32} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {language === 'de' ? 'Keine Statistik-Widgets vorhanden' : 
                 language === 'en' ? 'No Analytics Widgets Available' : 
                 'Нет доступных виджетов аналитики'}
              </Text>
              <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                {language === 'de' ? 'Sie haben alle Statistik-Widgets entfernt. Klicken Sie unten, um die Standard-Widgets wiederherzustellen.' : 
                 language === 'en' ? 'You have removed all analytics widgets. Click below to restore the default widgets.' : 
                 'Вы удалили все виджеты аналитики. Нажмите ниже, чтобы восстановить виджеты по умолчанию.'}
              </Text>
              <TouchableOpacity 
                style={[styles.restoreButton, { backgroundColor: colors.primary }]}
                onPress={restoreDefaultAnalyticsWidgets}
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
        ) : (
          <View style={styles.statsGrid}>
            {analyticsWidgets.map(widgetId => {
              if (widgetId === 'total-production' && pvSystemEnabled) {
                return <StatCard
                  key={widgetId}
                  id={'total-production'}
                  title={t.totalProduction}
                  value={`${formatNumber(currentStats?.production || 0, 1)} kWh`}
                  change={currentStats?.production ? '+12.5%' : '--'}
                  isPositive={true}
                  icon={<Sun color="#F59E0B" size={20} />}
                />;
              }

              if (widgetId.startsWith('meter-total-costs-')) {
                const deviceId = widgetId.replace('meter-total-costs-', '');
                const device = devices.find(d => d.id === deviceId);
                if (!device) return null;

                const deviceReadings = meterReadings.filter(r => r.meterId === deviceId);
                if (deviceReadings.length === 0) return null;

                const meterType = deviceReadings[0].type;
                const provider = energyProviders.find(p => p.type === meterType);
                const price = provider?.pricePerUnit || 0;
                const fee = provider?.basicFee || 0;

                const totalConsumption = deviceReadings[deviceReadings.length - 1].reading - deviceReadings[0].reading;
                const totalCost = totalConsumption * price + fee;

                return <StatCard
                  key={widgetId}
                  id={widgetId}
                  title={`${device.name} - Kosten`}
                  value={`${formatNumber(totalCost, 2)} €`}
                  change={'--'}
                  isPositive={false}
                  icon={<Euro color="#EF4444" size={20} />}
                />;
              }

              if (widgetId.startsWith('meter-last-month-costs-')) {
                const deviceId = widgetId.replace('meter-last-month-costs-', '');
                const device = devices.find(d => d.id === deviceId);
                if (!device) return null;

                const now = new Date();
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const { startDate, endDate } = getPeriodDates('monthly', lastMonth);

                const consumption = calculateTotalForPeriod(meterReadings, startDate, endDate, [deviceId]);
                const meterType = meterReadings.find(r => r.meterId === deviceId)?.type;
                const provider = energyProviders.find(p => p.type === meterType);
                const price = provider?.pricePerUnit || 0;
                const fee = provider?.basicFee || 0;
                const cost = consumption.total * price + fee;

                return <StatCard
                  key={widgetId}
                  id={widgetId}
                  title={`${device.name} - Letzter Monat`}
                  value={`${formatNumber(cost, 2)} €`}
                  change={'--'}
                  isPositive={false}
                  icon={<Euro color="#EF4444" size={20} />}
                />;
              }

              if (widgetId.startsWith('metertype-total-consumption-')) {
                const meterType = widgetId.replace('metertype-total-consumption-', '');
                const consumption = calculateTotalForPeriod(meterReadings, getPeriodDates(selectedPeriod).startDate, getPeriodDates(selectedPeriod).endDate, [meterType]);
                const widget = availableWidgets.find(w => w.id === widgetId);

                return <StatCard
                  key={widgetId}
                  id={widgetId}
                  title={widget?.title || `Gesamtverbrauch ${meterType}`}
                  value={`${formatNumber(consumption.total, 1)} kWh`}
                  change={'--'}
                  isPositive={true}
                  icon={<Zap color="#3B82F6" size={20} />}
                />;
              }

              if (widgetId.startsWith('metertype-total-costs-')) {
                const meterType = widgetId.replace('metertype-total-costs-', '');
                const consumption = calculateTotalForPeriod(meterReadings, getPeriodDates(selectedPeriod).startDate, getPeriodDates(selectedPeriod).endDate, [meterType]);
                const provider = energyProviders.find(p => p.type === meterType);
                const price = provider?.pricePerUnit || 0;
                const fee = provider?.basicFee || 0;
                const cost = consumption.total * price + fee;
                const widget = availableWidgets.find(w => w.id === widgetId);

                return <StatCard
                  key={widgetId}
                  id={widgetId}
                  title={widget?.title || `Gesamtkosten ${meterType}`}
                  value={`${formatNumber(cost, 2)} €`}
                  change={'--'}
                  isPositive={false}
                  icon={<Euro color="#EF4444" size={20} />}
                />;
              }

              if (widgetId === 'autarky' && pvSystemEnabled) {
                return <StatCard
                  key={widgetId}
                  id={'autarky'}
                  title={t.autarky}
                  value={`${formatNumber(currentStats?.autarky || 0, 0)}%`}
                  change={currentStats?.autarky ? '+8.1%' : '--'}
                  isPositive={true}
                  icon={<Battery color="#10B981" size={20} />}
                />;
              }

              if (widgetId === 'self-consumption' && pvSystemEnabled) {
                return <StatCard
                  key={widgetId}
                  id={'self-consumption'}
                  title={t.selfConsumption}
                  value={`${formatNumber(currentStats?.selfConsumption || 0, 0)}%`}
                  change={currentStats?.selfConsumption ? '+3.4%' : '--'}
                  isPositive={true}
                  icon={<TrendingUp color="#8B5CF6" size={20} />}
                />;
              }

              return null;
            })}
          </View>
        )}

        {/* Only show chart and costs if there are meter readings or PV system is enabled */}
        {(meterReadings.length > 0 || pvSystemEnabled) && (
          <>
            {renderChart()}
            {realCostData.totalCost > 0 && (
              <View style={[styles.totalCostCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.totalCostTitle, { color: colors.text }]}>
                  {language === 'de' ? 'Gesamtkosten' : language === 'en' ? 'Total Costs' : 'Общие расходы'}
                </Text>
                <Text style={[styles.totalCostValue, { color: colors.primary }]}>
                  {formatNumber(realCostData.totalCost, 2)} €
                </Text>
                <Text style={[styles.totalCostPeriod, { color: colors.textSecondary }]}>
                  {selectedPeriod === 'week' ? (language === 'de' ? 'Diese Woche' : language === 'en' ? 'This Week' : 'На этой неделе') : 
                   selectedPeriod === 'month' ? (language === 'de' ? 'Dieser Monat' : language === 'en' ? 'This Month' : 'В этом месяце') : 
                   (language === 'de' ? 'Dieses Jahr' : language === 'en' ? 'This Year' : 'В этом году')}
                </Text>
              </View>
            )}
          </>
        )}
        
        {/* Show message when no data is available */}
        {meterReadings.length === 0 && !pvSystemEnabled && (
          <View style={[styles.noDataCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.noDataTitle, { color: colors.text }]}>
              {language === 'de' ? 'Keine Daten verfügbar' : language === 'en' ? 'No Data Available' : 'Нет данных'}
            </Text>
            <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
              {language === 'de' ? 'Erfassen Sie Zählerstände, um Statistiken und Kosten zu sehen.' : 
               language === 'en' ? 'Record meter readings to see statistics and costs.' : 
               'Записывайте показания счетчиков, чтобы видеть статистику и расходы.'}
            </Text>
          </View>
        )}

        <View style={styles.insights}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{language === 'de' ? 'Erkenntnisse' : language === 'en' ? 'Insights' : 'Выводы'}</Text>
          {currentStats && pvSystemEnabled && currentStats.autarky < 70 && (
            <View style={[styles.insightCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.insightTitle, { color: colors.text }]}>🎯 Optimierungspotential</Text>
              <Text style={[styles.insightText, { color: colors.textSecondary }]}>
                Ihre Autarkie liegt bei {formatNumber(currentStats.autarky, 0)}%. Verlagern Sie mehr Verbrauch in die Sonnenstunden.
              </Text>
            </View>
          )}
          {currentStats && pvSystemEnabled && currentStats.selfConsumption > 80 && (
            <View style={[styles.insightCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.insightTitle, { color: colors.text }]}>📈 Hervorragend!</Text>
              <Text style={[styles.insightText, { color: colors.textSecondary }]}>
                Ihr Eigenverbrauch von {formatNumber(currentStats.selfConsumption, 0)}% ist ausgezeichnet. Sie nutzen Ihre Solarenergie optimal.
              </Text>
            </View>
          )}
          {meterReadings.length === 0 && (
            <View style={[styles.insightCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.insightTitle, { color: colors.text }]}>📊 {language === 'de' ? 'Daten erfassen' : language === 'en' ? 'Record Data' : 'Записать данные'}</Text>
              <Text style={[styles.insightText, { color: colors.textSecondary }]}>
                {language === 'de' ? 'Erfassen Sie Zählerstände, um detaillierte Analysen und Optimierungsvorschläge zu erhalten.' :
                 language === 'en' ? 'Record meter readings to get detailed analysis and optimization suggestions.' :
                 'Записывайте показания счетчиков для получения подробного анализа и рекомендаций по оптимизации.'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.forecast}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{language === 'de' ? 'Prognose' : language === 'en' ? 'Forecast' : 'Прогноз'}</Text>
          
          {forecastData && (
            <>
              <View style={[styles.forecastCard, { backgroundColor: theme === 'dark' ? '#374151' : '#E0F2FE' }]}>
                <Text style={[styles.forecastTitle, { color: theme === 'dark' ? colors.text : '#0369A1' }]}>
                  📊 {selectedPeriod === 'week' ? 
                    (language === 'de' ? 'Nächste Woche' : language === 'en' ? 'Next Week' : 'Следующая неделя') :
                    selectedPeriod === 'month' ?
                    (language === 'de' ? 'Nächster Monat' : language === 'en' ? 'Next Month' : 'Следующий месяц') :
                    (language === 'de' ? 'Nächstes Jahr' : language === 'en' ? 'Next Year' : 'Следующий год')
                  }
                </Text>
                <Text style={[styles.forecastText, { color: theme === 'dark' ? colors.text : '#0369A1' }]}>
                  {language === 'de' ? `Verbrauch: ${formatNumber(forecastData.weekly.consumption, 1)} kWh` :
                   language === 'en' ? `Consumption: ${formatNumber(forecastData.weekly.consumption, 1)} kWh` :
                   `Потребление: ${formatNumber(forecastData.weekly.consumption, 1)} кВт⋅ч`}
                </Text>
                {pvSystemEnabled && (
                  <Text style={[styles.forecastText, { color: theme === 'dark' ? colors.text : '#0369A1' }]}>
                    {language === 'de' ? `Produktion: ${formatNumber(forecastData.weekly.production, 1)} kWh` :
                     language === 'en' ? `Production: ${formatNumber(forecastData.weekly.production, 1)} kWh` :
                     `Производство: ${formatNumber(forecastData.weekly.production, 1)} кВт⋅ч`}
                  </Text>
                )}
                <Text style={[styles.forecastText, { color: theme === 'dark' ? colors.text : '#0369A1' }]}>
                  {language === 'de' ? `Kosten: ${formatNumber(forecastData.weekly.costs, 2)} €` :
                   language === 'en' ? `Costs: ${formatNumber(forecastData.weekly.costs, 2)} €` :
                   `Расходы: ${formatNumber(forecastData.weekly.costs, 2)} €`}
                </Text>
              </View>
              
              <View style={[styles.forecastCard, { backgroundColor: theme === 'dark' ? '#374151' : '#F0FDF4' }]}>
                <Text style={[styles.forecastTitle, { color: theme === 'dark' ? colors.text : '#15803D' }]}>
                  📈 {language === 'de' ? 'Langzeitprognose' : language === 'en' ? 'Long-term Forecast' : 'Долгосрочный прогноз'}
                </Text>
                <Text style={[styles.forecastText, { color: theme === 'dark' ? colors.text : '#15803D' }]}>
                  {language === 'de' ? `Monatsverbrauch: ${formatNumber(forecastData.monthly.consumption, 0)} kWh` :
                   language === 'en' ? `Monthly Consumption: ${formatNumber(forecastData.monthly.consumption, 0)} kWh` :
                   `Месячное потребление: ${formatNumber(forecastData.monthly.consumption, 0)} кВт⋅ч`}
                </Text>
                {pvSystemEnabled && (
                  <Text style={[styles.forecastText, { color: theme === 'dark' ? colors.text : '#15803D' }]}>
                    {language === 'de' ? `Monatsproduktion: ${formatNumber(forecastData.monthly.production, 0)} kWh` :
                     language === 'en' ? `Monthly Production: ${formatNumber(forecastData.monthly.production, 0)} kWh` :
                     `Месячное производство: ${formatNumber(forecastData.monthly.production, 0)} кВт⋅ч`}
                  </Text>
                )}
                <Text style={[styles.forecastText, { color: theme === 'dark' ? colors.text : '#15803D' }]}>
                  {language === 'de' ? `Jahreskosten: ${formatNumber(forecastData.yearly.costs, 0)} €` :
                   language === 'en' ? `Annual Costs: ${formatNumber(forecastData.yearly.costs, 0)} €` :
                   `Годовые расходы: ${formatNumber(forecastData.yearly.costs, 0)} €`}
                </Text>
                {pvSystemEnabled && forecastData.savings > 0 && (
                  <Text style={[styles.forecastText, { color: theme === 'dark' ? colors.text : '#15803D' }]}>
                    {language === 'de' ? `Wöchentliche Einsparungen: ${formatNumber(forecastData.savings, 2)} €` :
                     language === 'en' ? `Weekly Savings: ${formatNumber(forecastData.savings, 2)} €` :
                     `Недельная экономия: ${formatNumber(forecastData.savings, 2)} €`}
                  </Text>
                )}
              </View>
            </>
          )}
          
          {!forecastData && (
            <View style={[styles.forecastCard, { backgroundColor: theme === 'dark' ? '#374151' : '#FEF3C7' }]}>
              <Text style={[styles.forecastText, { color: theme === 'dark' ? colors.text : '#92400E' }]}>
                {language === 'de' ? '📈 Erfassen Sie Daten für personalisierte Prognosen' :
                 language === 'en' ? '📈 Record data for personalized forecasts' :
                 '📈 Записывайте данные для персонализированных прогнозов'}
              </Text>
            </View>
          )}
          
          <Text style={[styles.forecastSubtext, { color: colors.textSecondary }]}>
            {language === 'de' ? 'Prognosen basieren auf aktuellen Verbrauchsmustern und Wetterdaten' :
             language === 'en' ? 'Forecasts based on current consumption patterns and weather data' :
             'Прогнозы основаны на текущих моделях потребления и данных о погоде'}
          </Text>
        </View>
        

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
            <Text style={[styles.modalTitle, { color: colors.text }]}>{language === 'de' ? 'Statistik-Widgets verwalten' : language === 'en' ? 'Manage Statistics Widgets' : 'Управление виджетами статистики'}</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>{language === 'de' ? 'Tippen Sie auf ein Widget, um es hinzuzufügen oder zu entfernen' : language === 'en' ? 'Tap a widget to add or remove it' : 'Нажмите на виджет, чтобы добавить или удалить его'}</Text>
            
            <ScrollView style={styles.widgetList}>
              {filteredAvailableWidgets.map((widget) => (
                <TouchableOpacity
                  key={widget.id}
                  style={[
                    styles.widgetOption,
                    analyticsWidgets.includes(widget.id) && styles.widgetOptionActive
                  ]}
                  onPress={() => toggleWidget(widget.id)}
                >
                  <Text style={[
                    styles.widgetOptionText,
                    analyticsWidgets.includes(widget.id) && styles.widgetOptionTextActive
                  ]}>
                    {widget.title}
                  </Text>
                  {analyticsWidgets.includes(widget.id) && (
                    <X color="#FFFFFF" size={20} />
                  )}
                  {!analyticsWidgets.includes(widget.id) && (
                    <Plus color="#6B7280" size={20} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowWidgetModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>{language === 'de' ? 'Fertig' : language === 'en' ? 'Done' : 'Готово'}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
      
      <Modal
        visible={showChartOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChartOptions(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowChartOptions(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{language === 'de' ? 'Diagramm-Optionen' : language === 'en' ? 'Chart Options' : 'Опции графика'}</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>{language === 'de' ? 'Wählen Sie, was im Diagramm angezeigt werden soll' : language === 'en' ? 'Choose what to display in the chart' : 'Выберите, что отображать на графике'}</Text>
            
            <ScrollView style={styles.widgetList}>
              {pvSystemEnabled && (
                <TouchableOpacity
                  style={[
                    styles.widgetOption,
                    chartDisplayOptions.showProduction && styles.widgetOptionActive
                  ]}
                  onPress={() => setChartDisplayOptions(prev => ({ ...prev, showProduction: !prev.showProduction }))}
                >
                  <Text style={[
                    styles.widgetOptionText,
                    chartDisplayOptions.showProduction && styles.widgetOptionTextActive
                  ]}>
                    ☀️ {language === 'de' ? 'Produktion anzeigen' : language === 'en' ? 'Show Production' : 'Показать производство'}
                  </Text>
                  {chartDisplayOptions.showProduction ? (
                    <X color="#FFFFFF" size={20} />
                  ) : (
                    <Plus color="#6B7280" size={20} />
                  )}
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[
                  styles.widgetOption,
                  chartDisplayOptions.showConsumption && styles.widgetOptionActive
                ]}
                onPress={() => setChartDisplayOptions(prev => ({ ...prev, showConsumption: !prev.showConsumption }))}
              >
                <Text style={[
                  styles.widgetOptionText,
                  chartDisplayOptions.showConsumption && styles.widgetOptionTextActive
                ]}>
                  ⚡ {language === 'de' ? 'Verbrauch anzeigen' : language === 'en' ? 'Show Consumption' : 'Показать потребление'}
                </Text>
                {chartDisplayOptions.showConsumption ? (
                  <X color="#FFFFFF" size={20} />
                ) : (
                  <Plus color="#6B7280" size={20} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.widgetOption,
                  chartDisplayOptions.showCosts && styles.widgetOptionActive
                ]}
                onPress={() => setChartDisplayOptions(prev => ({ ...prev, showCosts: !prev.showCosts }))}
              >
                <Text style={[
                  styles.widgetOptionText,
                  chartDisplayOptions.showCosts && styles.widgetOptionTextActive
                ]}>
                  💰 {language === 'de' ? 'Kosten anzeigen' : language === 'en' ? 'Show Costs' : 'Показать расходы'}
                </Text>
                {chartDisplayOptions.showCosts ? (
                  <X color="#FFFFFF" size={20} />
                ) : (
                  <Plus color="#6B7280" size={20} />
                )}
              </TouchableOpacity>
              
              <View style={styles.optionSeparator} />
              
              <TouchableOpacity
                style={[
                  styles.widgetOption,
                  chartDisplayOptions.showTotal && styles.widgetOptionActive
                ]}
                onPress={() => setChartDisplayOptions(prev => ({ ...prev, showTotal: !prev.showTotal }))}
              >
                <Text style={[
                  styles.widgetOptionText,
                  chartDisplayOptions.showTotal && styles.widgetOptionTextActive
                ]}>
                  📈 {language === 'de' ? 'Gesamtwerte' : language === 'en' ? 'Total Values' : 'Общие значения'}
                </Text>
                {chartDisplayOptions.showTotal ? (
                  <X color="#FFFFFF" size={20} />
                ) : (
                  <Plus color="#6B7280" size={20} />
                )}
              </TouchableOpacity>
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowChartOptions(false)}
            >
              <Text style={styles.modalCloseButtonText}>{language === 'de' ? 'Fertig' : language === 'en' ? 'Done' : 'Готово'}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    padding: 20,
    marginTop: -20,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    marginTop: 10,
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
    backgroundColor: '#3B82F6',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  chartContainer: {
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
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  chartOptionsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    marginBottom: 16,
  },
  chartBar: {
    alignItems: 'center',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  productionBar: {
    width: 12,
    backgroundColor: '#10B981',
    borderRadius: 6,
  },
  consumptionBar: {
    width: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
  },
  costBar: {
    width: 12,
    backgroundColor: '#EF4444',
    borderRadius: 6,
  },
  chartLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  valueLabelsContainer: {
    minHeight: 40,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 4,
  },
  valueLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  insights: {
    marginBottom: 20,
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  forecast: {
    marginBottom: 20,
  },
  forecastCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    marginBottom: 12,
  },
  forecastTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  forecastText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  forecastSubtext: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  optionSeparator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
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
    backgroundColor: '#3B82F6',
    borderColor: '#1D4ED8',
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
    backgroundColor: '#3B82F6',
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
  totalCostCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalCostTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  totalCostValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  totalCostPeriod: {
    fontSize: 12,
    color: '#6B7280',
  },
  noDataCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
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