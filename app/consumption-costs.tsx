import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import {
  Filter,
  Zap,
  Droplets,
  Flame,
  Euro,
  Search,
  X,
  TrendingUp,
  TrendingDown,
} from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { formatNumber } from '@/utils/energyCalculations';
import { useTranslation } from '@/constants/languages';
import { Stack } from 'expo-router';

interface FilterOptions {
  dateRange: 'all' | 'week' | 'month' | 'year';
  meterType: 'all' | 'electricity' | 'gas' | 'water';
  searchTerm: string;
}

export default function ConsumptionCostsScreen() {
  const { 
    meterReadings,
    energyProviders,
    language,
  } = useApp();
  const { colors } = useTheme();
  const t = useTranslation(language);
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: 'all',
    meterType: 'all',
    searchTerm: '',
  });

  // Filter and process meter readings
  const filteredReadings = useMemo(() => {
    let filtered = [...meterReadings];

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (filters.dateRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }
      
      filtered = filtered.filter(reading => new Date(reading.timestamp) >= startDate);
    }

    // Filter by meter type
    if (filters.meterType !== 'all') {
      filtered = filtered.filter(reading => reading.type === filters.meterType);
    }

    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(reading => 
        reading.meterName.toLowerCase().includes(searchLower)
      );
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [meterReadings, filters]);

  // Calculate consumption and costs for filtered data
  const consumptionData = useMemo(() => {
    if (filteredReadings.length === 0) {
      return {
        totalConsumption: { electricity: 0, gas: 0, water: 0 },
        totalCosts: { electricity: 0, gas: 0, water: 0, total: 0 },
        dailyData: [],
      };
    }

    // Group readings by date and meter
    const dailyReadings = new Map<string, Map<string, number>>();
    
    filteredReadings.forEach(reading => {
      const dateStr = new Date(reading.timestamp).toISOString().split('T')[0];
      if (!dailyReadings.has(dateStr)) {
        dailyReadings.set(dateStr, new Map());
      }
      const dayMap = dailyReadings.get(dateStr)!;
      const key = `${reading.type}-${reading.meterName}`;
      dayMap.set(key, Math.max(dayMap.get(key) || 0, reading.reading));
    });

    // Calculate daily consumption differences
    const dailyData: {
      date: string;
      electricity: number;
      gas: number;
      water: number;
      electricityCost: number;
      gasCost: number;
      waterCost: number;
      totalCost: number;
    }[] = [];

    const sortedDates = Array.from(dailyReadings.keys()).sort();
    let prevReadings = new Map<string, number>();

    sortedDates.forEach(dateStr => {
      const dayReadings = dailyReadings.get(dateStr)!;
      let dayElectricity = 0;
      let dayGas = 0;
      let dayWater = 0;

      dayReadings.forEach((reading, key) => {
        const prevReading = prevReadings.get(key) || 0;
        const consumption = Math.max(0, reading - prevReading);
        
        if (key.startsWith('electricity')) {
          dayElectricity += consumption;
        } else if (key.startsWith('gas')) {
          dayGas += consumption;
        } else if (key.startsWith('water')) {
          dayWater += consumption;
        }
        
        prevReadings.set(key, reading);
      });

      // Calculate costs
      const electricityProvider = energyProviders.find(p => p.type === 'electricity');
      const gasProvider = energyProviders.find(p => p.type === 'gas');
      const waterProvider = energyProviders.find(p => p.type === 'water');

      const electricityCost = dayElectricity * (electricityProvider?.pricePerUnit || 0);
      const gasCost = dayGas * (gasProvider?.pricePerUnit || 0);
      const waterCost = dayWater * (waterProvider?.pricePerUnit || 0);
      const totalCost = electricityCost + gasCost + waterCost;

      if (dayElectricity > 0 || dayGas > 0 || dayWater > 0) {
        dailyData.push({
          date: dateStr,
          electricity: dayElectricity,
          gas: dayGas,
          water: dayWater,
          electricityCost,
          gasCost,
          waterCost,
          totalCost,
        });
      }
    });

    // Calculate totals
    const totalConsumption = dailyData.reduce(
      (acc, day) => ({
        electricity: acc.electricity + day.electricity,
        gas: acc.gas + day.gas,
        water: acc.water + day.water,
      }),
      { electricity: 0, gas: 0, water: 0 }
    );

    const totalCosts = dailyData.reduce(
      (acc, day) => ({
        electricity: acc.electricity + day.electricityCost,
        gas: acc.gas + day.gasCost,
        water: acc.water + day.waterCost,
        total: acc.total + day.totalCost,
      }),
      { electricity: 0, gas: 0, water: 0, total: 0 }
    );

    return {
      totalConsumption,
      totalCosts,
      dailyData: dailyData.reverse(), // Most recent first
    };
  }, [filteredReadings, energyProviders]);

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <Pressable 
        style={styles.modalOverlay}
        onPress={() => setShowFilterModal(false)}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {language === 'de' ? 'Filter' : language === 'en' ? 'Filters' : 'Фильтры'}
          </Text>
          
          {/* Date Range Filter */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>
              {language === 'de' ? 'Zeitraum' : language === 'en' ? 'Date Range' : 'Период времени'}
            </Text>
            <View style={styles.filterOptions}>
              {(['all', 'week', 'month', 'year'] as const).map((range) => (
                <TouchableOpacity
                  key={range}
                  style={[
                    styles.filterOption,
                    { backgroundColor: colors.background },
                    filters.dateRange === range && styles.filterOptionActive
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, dateRange: range }))}
                >
                  <Text style={[
                    styles.filterOptionText,
                    { color: colors.text },
                    filters.dateRange === range && styles.filterOptionTextActive
                  ]}>
                    {range === 'all' ? (language === 'de' ? 'Alle' : language === 'en' ? 'All' : 'Все') :
                     range === 'week' ? (language === 'de' ? 'Woche' : language === 'en' ? 'Week' : 'Неделя') :
                     range === 'month' ? (language === 'de' ? 'Monat' : language === 'en' ? 'Month' : 'Месяц') :
                     (language === 'de' ? 'Jahr' : language === 'en' ? 'Year' : 'Год')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Meter Type Filter */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>
              {language === 'de' ? 'Zählertyp' : language === 'en' ? 'Meter Type' : 'Тип счетчика'}
            </Text>
            <View style={styles.filterOptions}>
              {(['all', 'electricity', 'gas', 'water'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterOption,
                    { backgroundColor: colors.background },
                    filters.meterType === type && styles.filterOptionActive
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, meterType: type }))}
                >
                  <Text style={[
                    styles.filterOptionText,
                    { color: colors.text },
                    filters.meterType === type && styles.filterOptionTextActive
                  ]}>
                    {type === 'all' ? (language === 'de' ? 'Alle' : language === 'en' ? 'All' : 'Все') :
                     type === 'electricity' ? (language === 'de' ? 'Strom' : language === 'en' ? 'Electricity' : 'Электричество') :
                     type === 'gas' ? (language === 'de' ? 'Gas' : language === 'en' ? 'Gas' : 'Газ') :
                     (language === 'de' ? 'Wasser' : language === 'en' ? 'Water' : 'Вода')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.modalCloseButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowFilterModal(false)}
          >
            <Text style={styles.modalCloseButtonText}>
              {language === 'de' ? 'Anwenden' : language === 'en' ? 'Apply' : 'Применить'}
            </Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );

  const renderSummaryCard = () => (
    <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.summaryTitle, { color: colors.text }]}>
        {language === 'de' ? 'Zusammenfassung' : language === 'en' ? 'Summary' : 'Сводка'}
      </Text>
      
      <View style={styles.summaryGrid}>
        {/* Electricity */}
        <View style={styles.summaryItem}>
          <View style={styles.summaryItemHeader}>
            <Zap color="#3B82F6" size={20} />
            <Text style={[styles.summaryItemTitle, { color: colors.textSecondary }]}>
              {language === 'de' ? 'Strom' : language === 'en' ? 'Electricity' : 'Электричество'}
            </Text>
          </View>
          <Text style={[styles.summaryItemValue, { color: colors.text }]}>
            {formatNumber(consumptionData.totalConsumption.electricity, 1)} kWh
          </Text>
          <Text style={[styles.summaryItemCost, { color: '#3B82F6' }]}>
            {formatNumber(consumptionData.totalCosts.electricity, 2)} €
          </Text>
        </View>

        {/* Gas */}
        <View style={styles.summaryItem}>
          <View style={styles.summaryItemHeader}>
            <Flame color="#F59E0B" size={20} />
            <Text style={[styles.summaryItemTitle, { color: colors.textSecondary }]}>
              {language === 'de' ? 'Gas' : language === 'en' ? 'Gas' : 'Газ'}
            </Text>
          </View>
          <Text style={[styles.summaryItemValue, { color: colors.text }]}>
            {formatNumber(consumptionData.totalConsumption.gas, 1)} m³
          </Text>
          <Text style={[styles.summaryItemCost, { color: '#F59E0B' }]}>
            {formatNumber(consumptionData.totalCosts.gas, 2)} €
          </Text>
        </View>

        {/* Water */}
        <View style={styles.summaryItem}>
          <View style={styles.summaryItemHeader}>
            <Droplets color="#06B6D4" size={20} />
            <Text style={[styles.summaryItemTitle, { color: colors.textSecondary }]}>
              {language === 'de' ? 'Wasser' : language === 'en' ? 'Water' : 'Вода'}
            </Text>
          </View>
          <Text style={[styles.summaryItemValue, { color: colors.text }]}>
            {formatNumber(consumptionData.totalConsumption.water, 1)} m³
          </Text>
          <Text style={[styles.summaryItemCost, { color: '#06B6D4' }]}>
            {formatNumber(consumptionData.totalCosts.water, 2)} €
          </Text>
        </View>

        {/* Total */}
        <View style={[styles.summaryItem, styles.summaryItemTotal]}>
          <View style={styles.summaryItemHeader}>
            <Euro color="#10B981" size={20} />
            <Text style={[styles.summaryItemTitle, { color: colors.textSecondary }]}>
              {language === 'de' ? 'Gesamt' : language === 'en' ? 'Total' : 'Всего'}
            </Text>
          </View>
          <Text style={[styles.summaryItemValue, styles.summaryTotalValue, { color: colors.text }]}>
            {formatNumber(consumptionData.totalCosts.total, 2)} €
          </Text>
        </View>
      </View>
    </View>
  );

  const renderDailyData = () => (
    <View style={[styles.dataSection, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {language === 'de' ? 'Tägliche Verbräuche & Kosten' : language === 'en' ? 'Daily Consumption & Costs' : 'Ежедневное потребление и расходы'}
      </Text>
      
      {consumptionData.dailyData.length === 0 ? (
        <View style={styles.noDataContainer}>
          <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
            {language === 'de' ? 'Keine Daten für die ausgewählten Filter gefunden.' : 
             language === 'en' ? 'No data found for the selected filters.' : 
             'Данные для выбранных фильтров не найдены.'}
          </Text>
        </View>
      ) : (
        consumptionData.dailyData.map((day, index) => {
          const prevDay = consumptionData.dailyData[index + 1];
          const costChange = prevDay ? ((day.totalCost - prevDay.totalCost) / prevDay.totalCost) * 100 : 0;
          const isIncrease = costChange > 0;
          
          return (
            <View key={day.date} style={[styles.dailyItem, { borderBottomColor: colors.border }]}>
              <View style={styles.dailyHeader}>
                <Text style={[styles.dailyDate, { color: colors.text }]}>
                  {new Date(day.date).toLocaleDateString(language === 'de' ? 'de-DE' : language === 'en' ? 'en-US' : 'ru-RU')}
                </Text>
                <View style={styles.dailyTotalCost}>
                  <Text style={[styles.dailyCostValue, { color: colors.primary }]}>
                    {formatNumber(day.totalCost, 2)} €
                  </Text>
                  {prevDay && (
                    <View style={[styles.changeIndicator, { backgroundColor: isIncrease ? '#FEE2E2' : '#DCFCE7' }]}>
                      {isIncrease ? (
                        <TrendingUp color="#EF4444" size={12} />
                      ) : (
                        <TrendingDown color="#10B981" size={12} />
                      )}
                      <Text style={[styles.changeText, { color: isIncrease ? '#EF4444' : '#10B981' }]}>
                        {Math.abs(costChange).toFixed(1)}%
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              
              <View style={styles.dailyDetails}>
                {day.electricity > 0 && (
                  <View style={styles.dailyDetailItem}>
                    <Zap color="#3B82F6" size={16} />
                    <Text style={[styles.dailyDetailText, { color: colors.textSecondary }]}>
                      {formatNumber(day.electricity, 1)} kWh
                    </Text>
                    <Text style={[styles.dailyDetailCost, { color: '#3B82F6' }]}>
                      {formatNumber(day.electricityCost, 2)} €
                    </Text>
                  </View>
                )}
                {day.gas > 0 && (
                  <View style={styles.dailyDetailItem}>
                    <Flame color="#F59E0B" size={16} />
                    <Text style={[styles.dailyDetailText, { color: colors.textSecondary }]}>
                      {formatNumber(day.gas, 1)} m³
                    </Text>
                    <Text style={[styles.dailyDetailCost, { color: '#F59E0B' }]}>
                      {formatNumber(day.gasCost, 2)} €
                    </Text>
                  </View>
                )}
                {day.water > 0 && (
                  <View style={styles.dailyDetailItem}>
                    <Droplets color="#06B6D4" size={16} />
                    <Text style={[styles.dailyDetailText, { color: colors.textSecondary }]}>
                      {formatNumber(day.water, 1)} m³
                    </Text>
                    <Text style={[styles.dailyDetailCost, { color: '#06B6D4' }]}>
                      {formatNumber(day.waterCost, 2)} €
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen 
        options={{
          title: language === 'de' ? 'Alle Verbräuche & Kosten' : language === 'en' ? 'All Consumption & Costs' : 'Все потребление и расходы',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }} 
      />
      
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Search and Filter Bar */}
          <View style={[styles.searchFilterBar, { backgroundColor: colors.card }]}>
            <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
              <Search color={colors.textSecondary} size={20} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={language === 'de' ? 'Zähler suchen...' : language === 'en' ? 'Search meters...' : 'Поиск счетчиков...'}
                placeholderTextColor={colors.textSecondary}
                value={filters.searchTerm}
                onChangeText={(text) => setFilters(prev => ({ ...prev, searchTerm: text }))}
              />
              {filters.searchTerm.length > 0 && (
                <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, searchTerm: '' }))}>
                  <X color={colors.textSecondary} size={20} />
                </TouchableOpacity>
              )}
            </View>
            
            <TouchableOpacity 
              style={[styles.filterButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowFilterModal(true)}
            >
              <Filter color="#FFFFFF" size={20} />
            </TouchableOpacity>
          </View>

          {/* Active Filters */}
          {(filters.dateRange !== 'all' || filters.meterType !== 'all') && (
            <View style={styles.activeFilters}>
              {filters.dateRange !== 'all' && (
                <View style={[styles.activeFilter, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.activeFilterText, { color: colors.primary }]}>
                    {filters.dateRange === 'week' ? (language === 'de' ? 'Diese Woche' : language === 'en' ? 'This Week' : 'Эта неделя') :
                     filters.dateRange === 'month' ? (language === 'de' ? 'Dieser Monat' : language === 'en' ? 'This Month' : 'Этот месяц') :
                     (language === 'de' ? 'Dieses Jahr' : language === 'en' ? 'This Year' : 'Этот год')}
                  </Text>
                  <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, dateRange: 'all' }))}>
                    <X color={colors.primary} size={16} />
                  </TouchableOpacity>
                </View>
              )}
              {filters.meterType !== 'all' && (
                <View style={[styles.activeFilter, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.activeFilterText, { color: colors.primary }]}>
                    {filters.meterType === 'electricity' ? (language === 'de' ? 'Strom' : language === 'en' ? 'Electricity' : 'Электричество') :
                     filters.meterType === 'gas' ? (language === 'de' ? 'Gas' : language === 'en' ? 'Gas' : 'Газ') :
                     (language === 'de' ? 'Wasser' : language === 'en' ? 'Water' : 'Вода')}
                  </Text>
                  <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, meterType: 'all' }))}>
                    <X color={colors.primary} size={16} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {renderSummaryCard()}
          {renderDailyData()}
        </ScrollView>
        
        {renderFilterModal()}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchFilterBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  activeFilterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  summaryItemTotal: {
    width: '100%',
    backgroundColor: '#F0FDF4',
  },
  summaryItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  summaryItemTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryItemValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryTotalValue: {
    fontSize: 20,
  },
  summaryItemCost: {
    fontSize: 14,
    fontWeight: '600',
  },
  dataSection: {
    margin: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 20,
    paddingBottom: 12,
  },
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
  },
  dailyItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  dailyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dailyDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  dailyTotalCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dailyCostValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 2,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dailyDetails: {
    gap: 8,
  },
  dailyDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dailyDetailText: {
    flex: 1,
    fontSize: 14,
  },
  dailyDetailCost: {
    fontSize: 14,
    fontWeight: '600',
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
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterOptionActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
  },
  modalCloseButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});