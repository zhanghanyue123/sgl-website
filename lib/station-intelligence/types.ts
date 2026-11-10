import type { ProductDemandForecast, WeeklyForecastAccuracy } from "./demand-forecast";
import type { PreparationPlan } from "./preparation-planner";
import type { MaterialPlanningResult } from "./material-planning";

export type IntelligenceStatus = "available" | "not_recorded" | "not_connected" | "stale" | "blocked";

export type EvidenceRef = {
  source: string;
  sourceRef: string;
  observedAt: string | null;
  status: IntelligenceStatus;
};

export type WeatherSnapshot = {
  status: IntelligenceStatus;
  location: string;
  temperatureC: number | null;
  precipitationMm: number | null;
  windKph: number | null;
  alert: string | null;
  observedAt: string | null;
  source: string;
};

export type HourlyDemand = {
  hour: string;
  actualFootfall: number | null;
  forecastFootfall: number | null;
  scheduledStaff: number | null;
  recommendedStaff: number | null;
  gap: number | null;
  status: IntelligenceStatus;
  evidence: EvidenceRef[];
};

export type ReplenishmentRecommendation = {
  materialId: string;
  name: string;
  unit: string | null;
  currentStock: number | null;
  safetyStock: number | null;
  averageDailyUsage: number | null;
  reservedStock: number | null;
  inboundStock: number | null;
  daysRemaining: number | null;
  suggestedQuantity: number | null;
  supplier: string | null;
  leadTimeDays: number | null;
  moq: number | null;
  estimatedArrival: string | null;
  approvalState: "recommendation" | "blocked";
  blockers: string[];
  evidence: EvidenceRef[];
};

export type StationIntelligenceView = {
  generatedAt: string;
  sourceGeneratedAt: string | null;
  sourceReceivedAt: string | null;
  connected: boolean;
  stale: boolean;
  weather: WeatherSnapshot;
  overview: {
    forecastFootfall: number | null;
    expectedSales: number | null;
    staffingDemand: number | null;
    inventoryRisks: number;
    pendingApprovals: number;
  };
  workforce: {
    status: IntelligenceStatus;
    hourly: HourlyDemand[];
    shiftGaps: number;
    availabilityRows: number;
    recommendation: string;
    draftScheduleAllowed: false;
    backtest: { status: IntelligenceStatus; sampleDays: number; message: string };
  };
  demand: {
    status: IntelligenceStatus;
    forecasts: ProductDemandForecast[];
    coverage: { salesDays: number; footfallDays: number; productRows: number };
    message: string;
  };
  preparation: {
    status: IntelligenceStatus;
    plans: PreparationPlan[];
    message: string;
  };
  materialRequirements: {
    status: IntelligenceStatus;
    plan: MaterialPlanningResult | null;
    blockedProducts: Array<{ productId: string; reason: string }>;
    message: string;
  };
  forecastAccuracy: {
    status: "Available" | "Insufficient Data";
    weeks: WeeklyForecastAccuracy[];
    message: string;
  };
  dailyBriefing: Array<{ label: string; value: string; status: IntelligenceStatus; source: string }>;
  replenishment: {
    status: IntelligenceStatus;
    recommendations: ReplenishmentRecommendation[];
    purchaseDraftAllowed: false;
    message: string;
  };
  activity: Array<{
    id: string;
    type: "workforce" | "replenishment" | "weather";
    result: string;
    approvalState: "not_required" | "recommendation" | "blocked";
    createdAt: string;
    evidence: EvidenceRef[];
  }>;
  missingCapabilities: string[];
};
