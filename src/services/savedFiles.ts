import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'divorceos_support_scenarios';

export interface SupportScenarioSnapshot {
  parentAIncome: number;
  parentBIncome: number;
  parentATimeShare: number;
  childrenCount: number;
  childcare: number;
  medical: number;
  countyId?: string;
  countyName?: string;
  mode: 'quick' | 'advanced';
}

export interface SupportScenario {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  childSupport: number;
  spousalSupport: number;
  combinedSupport: number;
  estimatePayer: string;
  snapshot: SupportScenarioSnapshot;
}

function readAll(): SupportScenario[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SupportScenario[];
  } catch (error) {
    console.error('Failed to parse saved scenarios', error);
    return [];
  }
}

function writeAll(data: SupportScenario[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function saveSupportScenario(
  userId: string,
  payload: Omit<SupportScenario, 'id' | 'createdAt' | 'userId'>
): SupportScenario {
  const all = readAll();
  const scenario: SupportScenario = {
    ...payload,
    userId,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  all.push(scenario);
  writeAll(all);
  return scenario;
}

export function getSupportScenarios(userId: string): SupportScenario[] {
  return readAll()
    .filter((scenario) => scenario.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function deleteSupportScenario(userId: string, scenarioId: string): void {
  const updated = readAll().filter(
    (scenario) => !(scenario.userId === userId && scenario.id === scenarioId)
  );
  writeAll(updated);
}

export function getSupportScenario(userId: string, scenarioId: string): SupportScenario | null {
  return readAll().find((scenario) => scenario.userId === userId && scenario.id === scenarioId) || null;
}
