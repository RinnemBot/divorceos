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

async function request<T>(body: Record<string, unknown>): Promise<T> {
  const response = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'same-origin',
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Saved scenarios request failed');
  }

  return payload as T;
}

export async function saveSupportScenario(
  _userId: string,
  payload: Omit<SupportScenario, 'id' | 'createdAt' | 'userId'>
): Promise<SupportScenario> {
  const result = await request<{ scenario: SupportScenario }>({
    action: 'support-scenarios-save',
    ...payload,
  });
  return result.scenario;
}

export async function getSupportScenarios(_userId: string): Promise<SupportScenario[]> {
  const result = await request<{ scenarios: SupportScenario[] }>({
    action: 'support-scenarios-list',
  });
  return Array.isArray(result.scenarios) ? result.scenarios : [];
}

export async function deleteSupportScenario(_userId: string, scenarioId: string): Promise<void> {
  await request({
    action: 'support-scenarios-delete',
    id: scenarioId,
  });
}

export async function getSupportScenario(_userId: string, scenarioId: string): Promise<SupportScenario | null> {
  const scenarios = await getSupportScenarios(_userId);
  return scenarios.find((scenario) => scenario.id === scenarioId) || null;
}
