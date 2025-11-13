export interface EnergyData {
    timestamp: Date;
    solarProduction: number;
    consumption: number;
    batteryLevel: number;
    batteryCharging: boolean;
    gridFeedIn: number;
    gridConsumption: number;
  }
  
  export interface MeterReading {
    id: string;
    deviceId: string;  // Hinzugefügt
    meterId: string;
    meterName: string;
    reading: number;   // Geändert von value zu reading
    timestamp: Date;
    type: 'electricity' | 'gas' | 'water' | 'heat' | 'solar' | 'grid_feed_in' | 'solar_pv_feed_in';
    unit: string;
    notes?: string;
  }
  
  export interface Connection {
    id: string;
    name: string;
    type: 'inverter' | 'battery' | 'meter' | 'weather';
    protocol: 'modbus' | 'http' | 'mqtt' | 'sma' | 'fronius' | 'kostal';
    host: string;
    port?: number;
    username?: string;
    password?: string;
    apiKey?: string;
    status: 'connected' | 'disconnected' | 'error';
    lastSync?: Date;
    config: Record<string, any>;
  }
  
  export interface EnergyStats {
    totalProduction?: number;
    daily: {
      production: number;
      consumption: number;
      savings: number;
      co2Saved: number;
      autarky: number;
      selfConsumption: number;
    };
    weekly: {
      production: number;
      consumption: number;
      savings: number;
      co2Saved: number;
      autarky: number;
      selfConsumption: number;
    };
    monthly: {
      production: number;
      consumption: number;
      savings: number;
      co2Saved: number;
      autarky: number;
      selfConsumption: number;
    };
    yearly: {
      production: number;
      consumption: number;
      savings: number;
      co2Saved: number;
      autarky: number;
      selfConsumption: number;
    };
  }
  
  export interface Device {
    id: string;
    name: string;
    type: 'inverter' | 'battery' | 'meter' | 'sensor' | 'solar-pv' | 'solar-pv-export'; // Erweitert
    status: 'online' | 'offline' | 'error';
    lastUpdate: Date;
    data: Record<string, any>;
    calculationType?: 'difference' | 'sum';
  }
  
  export interface Alert {
    id: string;
    type: 'warning' | 'error' | 'info';
    title: string;
    message: string;
    timestamp: Date;
    acknowledged: boolean;
    deviceId?: string;
  }
  
  export interface EnergyTip {
    id: string;
    title: string;
    description: string;
    category: 'consumption' | 'production' | 'efficiency' | 'maintenance';
    priority: 'low' | 'medium' | 'high';
    potentialSavings?: number;
    estimatedCost?: number;
  }
  
  export interface EnergyProvider {
    id: string;
    name: string;
    type: 'electricity' | 'gas' | 'water' | 'heating';
    contractNumber: string;
    tariff: string;
    pricePerUnit: number;
    basicFee: number;
    validFrom: Date;
    validTo?: Date;
    contractStart?: Date;
    contractEnd?: Date;
    meterId?: string; // Link to meter for cost calculations
    contact: {
      phone?: string;
      email?: string;
      website?: string;
    };
  }
  
  export interface UserProfile {
    id: string;
    name: string;
    email: string;
    address: {
      street: string;
      city: string;
      zipCode: string;
      country: string;
    };
    userType: 'homeowner' | 'landlord' | 'business';
    language: 'de' | 'en' | 'ru';
    notifications: {
      push: boolean;
      sms: boolean;
      frequency?: 'daily' | 'weekly' | 'monthly';
    };
    pvSystem?: {
      installedPower: number;
      installationDate: Date;
      inverterBrand: string;
      batteryCapacity?: number;
    };
  }
  
  export interface RentalUnit {
    id: string;
    name: string;
    address: string;
    tenantName: string;
    tenantEmail: string;
    meterIds: string[];
    rentStartDate: Date;
    rentEndDate?: Date;
  }
  
  export interface ComplianceReport {
    id: string;
    type: 'iso50001' | 'co2-balance' | 'sustainability' | 'energy-audit';
    title: string;
    period: {
      from: Date;
      to: Date;
    };
    data: Record<string, any>;
    generatedAt: Date;
    status: 'draft' | 'final' | 'submitted';
  }
  
  export interface CostBenefitAnalysis {
    id: string;
    pvSystemId: string;
    initialInvestment: number;
    annualSavings: number;
    paybackPeriod: number;
    roi: number;
    projectedSavings: {
      year: number;
      savings: number;
      cumulativeSavings: number;
    }[];
    assumptions: {
      energyPriceIncrease: number;
      systemDegradation: number;
      maintenanceCosts: number;
    };
  }

  export interface SustainabilityGoals {
    monthlyCo2Goal: number; // in kg
    energySaverGoal: number; // in kg CO2
    solarPioneerGoal: number; // in kWh
    sustainabilityChampionGoal: number; // in EUR
  }

  export interface SustainabilityStats {
    co2Saved: number;
    kmEquivalent: number;
    treesEquivalent: number;
    avoidedEmissions: number;
    monthlyProgress: number;
    energySaverProgress: number;
  }

  export type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface DetailedCosts {
  costs: {
    electricity: number;
    gas: number;
    water: number;
    total: number;
  };
  realConsumption: {
    electricity: number;
    gas: number;
    water: number;
  };
  production: number;
  consumption: number;
  autarky: number;
  selfConsumption: number;
  savings: number;
  co2Saved: number;
  gridFeedIn: number;
}