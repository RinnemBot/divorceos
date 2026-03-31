import { useMemo, useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { COUNTY_GUIDES } from '@/data/countyGuides';
import { Slider } from '@/components/ui/slider';
import { Info, Calculator, Zap, Settings2 } from 'lucide-react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const counties = COUNTY_GUIDES.map((c) => ({ id: c.id, name: c.name }));

const MULTI_CHILD_FACTORS: Record<number, number> = {
  1: 1,
  2: 1.6,
  3: 2.1,
  4: 2.5,
  5: 2.7,
  6: 2.9,
};

type ParentKey = 'parentA' | 'parentB';

type OverrideField = 'federalOverride' | 'stateOverride' | 'ficaOverride';

type GrossField =
  | 'wages'
  | 'overtime'
  | 'selfEmployment'
  | 'unemployment'
  | 'otherIncome'
  | 'retirement'
  | 'unionDues'
  | 'healthPremiums'
  | 'existingOrders'
  | 'hardship';

type ParentGrossInputs = {
  wages: number;
  overtime: number;
  selfEmployment: number;
  unemployment: number;
  otherIncome: number;
  retirement: number;
  unionDues: number;
  healthPremiums: number;
  existingOrders: number;
  hardship: number;
  federalOverride: number | null;
  stateOverride: number | null;
  ficaOverride: number | null;
};

type AdvancedSummary = {
  baseIncome: number;
  additionalIncome: number;
  totalGross: number;
  autoFederal: number;
  autoState: number;
  autoFica: number;
  federal: number;
  state: number;
  fica: number;
  otherDeductions: number;
  totalDeductions: number;
  netDisposable: number;
  overrides: {
    federal: boolean;
    state: boolean;
    fica: boolean;
  };
};

type FilingStatus = 'single' | 'married-joint' | 'married-separate';

type SpousalInputs = {
  filingStatus: FilingStatus;
  dependentCount: number;
  higherNet: number;
  lowerNet: number;
  childSupportPaid: number;
  healthPremiums: number;
};

type SpousalEstimate = {
  amount: number;
  range: {
    low: number;
    high: number;
  };
  note: string;
};

function getIncomeFraction(totalNet: number) {
  if (totalNet <= 0) return 0;
  if (totalNet <= 2900) {
    return 0.165 + totalNet / 82857;
  }
  if (totalNet <= 5000) {
    return 0.131 + totalNet / 42149;
  }
  if (totalNet <= 10000) {
    return 0.25;
  }
  if (totalNet <= 15000) {
    return 0.1 + 1499 / totalNet;
  }
  return 0.12 + 1200 / totalNet;
}

function formatCurrency(value: number) {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

function initialParentGrossInputs(defaultNet: number): ParentGrossInputs {
  return {
    wages: defaultNet,
    overtime: 0,
    selfEmployment: 0,
    unemployment: 0,
    otherIncome: 0,
    retirement: 0,
    unionDues: 0,
    healthPremiums: 0,
    existingOrders: 0,
    hardship: 0,
    federalOverride: null,
    stateOverride: null,
    ficaOverride: null,
  };
}

function initialSpousalInputs(higher: number, lower: number): SpousalInputs {
  return {
    filingStatus: 'single',
    dependentCount: 0,
    higherNet: higher,
    lowerNet: lower,
    childSupportPaid: 0,
    healthPremiums: 0,
  };
}

const FEDERAL_BRACKETS = [
  { max: 11000, rate: 0.1 },
  { max: 44725, rate: 0.12 },
  { max: 95375, rate: 0.22 },
  { max: 182100, rate: 0.24 },
  { max: Number.POSITIVE_INFINITY, rate: 0.32 },
];

const CALIFORNIA_BRACKETS = [
  { max: 10099, rate: 0.01 },
  { max: 23942, rate: 0.02 },
  { max: 37788, rate: 0.04 },
  { max: 52455, rate: 0.06 },
  { max: 66295, rate: 0.08 },
  { max: Number.POSITIVE_INFINITY, rate: 0.093 },
];

const SOCIAL_SECURITY_CAP = 168600;

function estimateBracketTax(monthlyGross: number, brackets: { max: number; rate: number }[]) {
  if (monthlyGross <= 0) return 0;
  const annual = monthlyGross * 12;
  for (const bracket of brackets) {
    if (annual <= bracket.max) {
      return (annual * bracket.rate) / 12;
    }
  }
  return 0;
}

function estimateFederalTax(monthlyGross: number) {
  return estimateBracketTax(monthlyGross, FEDERAL_BRACKETS);
}

function estimateCaliforniaTax(monthlyGross: number) {
  return estimateBracketTax(monthlyGross, CALIFORNIA_BRACKETS);
}

function estimateFica(monthlyGross: number) {
  if (monthlyGross <= 0) return 0;
  const annual = monthlyGross * 12;
  const socialSecurity = Math.min(annual, SOCIAL_SECURITY_CAP) * 0.062;
  const medicare = annual * 0.0145;
  return (socialSecurity + medicare) / 12;
}

function computeAdvancedSummary(inputs: ParentGrossInputs): AdvancedSummary {
  const baseIncome = Math.max(0, inputs.wages);
  const additionalIncome = Math.max(0, inputs.overtime)
    + Math.max(0, inputs.selfEmployment)
    + Math.max(0, inputs.unemployment)
    + Math.max(0, inputs.otherIncome);
  const totalGross = baseIncome + additionalIncome;

  const autoFederal = estimateFederalTax(totalGross);
  const autoState = estimateCaliforniaTax(totalGross);
  const autoFica = estimateFica(totalGross);

  const federal = inputs.federalOverride ?? autoFederal;
  const state = inputs.stateOverride ?? autoState;
  const fica = inputs.ficaOverride ?? autoFica;

  const otherDeductions =
    Math.max(0, inputs.retirement)
    + Math.max(0, inputs.unionDues)
    + Math.max(0, inputs.healthPremiums)
    + Math.max(0, inputs.existingOrders)
    + Math.max(0, inputs.hardship);

  const totalDeductions = federal + state + fica + otherDeductions;
  const netDisposable = Math.max(0, totalGross - totalDeductions);

  return {
    baseIncome,
    additionalIncome,
    totalGross,
    autoFederal,
    autoState,
    autoFica,
    federal,
    state,
    fica,
    otherDeductions,
    totalDeductions,
    netDisposable,
    overrides: {
      federal: inputs.federalOverride !== null,
      state: inputs.stateOverride !== null,
      fica: inputs.ficaOverride !== null,
    },
  };
}

const parentLabels: Record<ParentKey, string> = {
  parentA: 'Parent A (Petitioner)',
  parentB: 'Parent B (Respondent)',
};

interface ChildSupportEstimatorProps {
  initialCountyId?: string;
}

export function ChildSupportEstimator({ initialCountyId }: ChildSupportEstimatorProps) {
  const [countyId, setCountyId] = useState(initialCountyId || counties[0]?.id);
  const [parentAIncome, setParentAIncome] = useState(7500);
  const [parentBIncome, setParentBIncome] = useState(4500);
  const [parentATimeShare, setParentATimeShare] = useState(65);
  const [childrenCount, setChildrenCount] = useState(1);
  const [childcare, setChildcare] = useState(400);
  const [medical, setMedical] = useState(150);
  const [mode, setMode] = useState<'quick' | 'advanced'>('quick');
  const [grossInputs, setGrossInputs] = useState<{ parentA: ParentGrossInputs; parentB: ParentGrossInputs }>(
    {
      parentA: initialParentGrossInputs(7500),
      parentB: initialParentGrossInputs(4500),
    },
  );
  const [spousalInputs, setSpousalInputs] = useState<SpousalInputs>(() => initialSpousalInputs(7500, 4500));
  const [shareEmail, setShareEmail] = useState('');
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialCountyId) {
      setCountyId(initialCountyId);
    }
  }, [initialCountyId]);

  const advancedSummaries = useMemo(() => ({
    parentA: computeAdvancedSummary(grossInputs.parentA),
    parentB: computeAdvancedSummary(grossInputs.parentB),
  }), [grossInputs]);

  const effectiveParentAIncome = mode === 'advanced' ? advancedSummaries.parentA.netDisposable : parentAIncome;
  const effectiveParentBIncome = mode === 'advanced' ? advancedSummaries.parentB.netDisposable : parentBIncome;

  const estimate = useMemo(() => {
    const aIncome = Number(effectiveParentAIncome) || 0;
    const bIncome = Number(effectiveParentBIncome) || 0;
    const totalIncome = aIncome + bIncome || 1;
    const higherIsA = aIncome >= bIncome;
    const highIncome = higherIsA ? aIncome : bIncome;
    const lowIncome = higherIsA ? bIncome : aIncome;
    const highTimeShare = (higherIsA ? parentATimeShare : 100 - parentATimeShare) / 100;
    const TN = totalIncome;
    const HN = highIncome;
    const parentingFactor = highTimeShare <= 0.5 ? 1 + highTimeShare : 2 - highTimeShare;
    const incomeFraction = getIncomeFraction(TN);
    const K = parentingFactor * incomeFraction;
    const baseSupport = Math.max(0, K * (HN - highTimeShare * TN));
    const netBase = Number.isFinite(baseSupport) ? baseSupport : 0;
    const childFactor =
      MULTI_CHILD_FACTORS[childrenCount] ?? Math.max(1, 1 + 0.2 * (childrenCount - 1));
    const scaledBase = netBase * childFactor;
    const addOns = (Number(childcare) || 0) + (Number(medical) || 0);
    const total = Math.max(0, scaledBase + addOns / 2);
    return {
      payer: higherIsA ? 'Parent A' : 'Parent B',
      guideline: total,
      baseSupport: scaledBase,
      rawBase: netBase,
      childFactor,
      addOns,
      parentATimeShare,
      parentBTimeShare: 100 - parentATimeShare,
      lowIncome,
      highIncome,
      incomeFraction,
      parentingFactor,
      kFactor: K,
    };
  }, [
    childcare,
    childrenCount,
    effectiveParentAIncome,
    effectiveParentBIncome,
    medical,
    parentATimeShare,
  ]);

  const higherParentNet = Math.max(effectiveParentAIncome, effectiveParentBIncome);
  const lowerParentNet = Math.min(effectiveParentAIncome, effectiveParentBIncome);
  const presumedChildSupport = estimate.guideline;

  const spousalEstimate: SpousalEstimate = useMemo(() => {
    const higher = Math.max(0, spousalInputs.higherNet);
    const lower = Math.max(0, spousalInputs.lowerNet);
    const adjustedHigher = Math.max(0, higher - spousalInputs.childSupportPaid - spousalInputs.healthPremiums);
    const base = Math.max(0, adjustedHigher * 0.4 - lower * 0.5);
    const dependentBuffer = Math.min(base, spousalInputs.dependentCount * 50);
    const amount = Math.max(0, base - dependentBuffer);
    const note =
      spousalInputs.filingStatus === 'married-joint'
        ? 'Joint filers sometimes see a slightly smaller number because taxes are balanced.'
        : 'Short-term 40/50 guideline only. Courts still weigh Family Code §4320 factors.';
    return {
      amount,
      range: {
        low: amount * 0.9,
        high: amount * 1.1,
      },
      note,
    };
  }, [spousalInputs]);

  const handleGrossFieldChange = (parent: ParentKey, field: GrossField, rawValue: string) => {
    const parsed = Math.max(0, Number(rawValue) || 0);
    setGrossInputs((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: parsed,
      },
    }));
  };

  const handleOverrideChange = (parent: ParentKey, field: OverrideField, rawValue: string) => {
    const parsed = rawValue === '' ? null : Math.max(0, Number(rawValue) || 0);
    setGrossInputs((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: parsed,
      },
    }));
  };

  const syncSpousalFromGuideline = () => {
    setSpousalInputs((prev) => ({
      ...prev,
      higherNet: higherParentNet,
      lowerNet: lowerParentNet,
      childSupportPaid: presumedChildSupport,
    }));
    setShareMessage(null);
  };

  const handleShareSummary = () => {
    if (!shareEmail || !shareEmail.includes('@')) {
      setShareMessage('Enter a valid email address.');
      return;
    }
    setShareMessage(`We'll send a PDF summary to ${shareEmail} as soon as email delivery is wired up.`);
  };

  const renderAdvancedForm = (parent: ParentKey) => {
    const inputs = grossInputs[parent];
    const summary = advancedSummaries[parent];
    const additionalIncomeFields: { field: GrossField; label: string; helper: string }[] = [
      { field: 'overtime', label: 'Overtime / bonus / commission', helper: 'Average monthly extra pay.' },
      { field: 'selfEmployment', label: 'Self-employment net income', helper: 'Net profit after business expenses.' },
      { field: 'unemployment', label: 'Unemployment / disability benefits', helper: 'Taxable benefits only.' },
      { field: 'otherIncome', label: 'Other taxable income', helper: 'Rental income, RSUs, etc.' },
    ];

    const deductionFields: { field: GrossField; label: string; helper: string }[] = [
      { field: 'retirement', label: 'Mandatory retirement contributions', helper: 'CalPERS, 401(k) loan repayments, etc.' },
      { field: 'unionDues', label: 'Union dues / agency fees', helper: 'Monthly dues that must be paid to keep the job.' },
      { field: 'healthPremiums', label: "Children's health premiums", helper: 'Only the portion paid for the covered children.' },
      { field: 'existingOrders', label: 'Existing child/spousal support paid', helper: 'Orders you are actually paying each month.' },
      { field: 'hardship', label: 'Extreme hardship deduction', helper: 'Court-approved hardships (e.g., extraordinary medical).' },
    ];

    const overrideFields: { field: OverrideField; label: string; auto: number; helper: string }[] = [
      {
        field: 'federalOverride',
        label: 'Federal tax',
        auto: summary.autoFederal,
        helper: summary.overrides.federal
          ? 'Manual amount applied.'
          : 'Auto estimate assumes single filer + standard deduction.',
      },
      {
        field: 'stateOverride',
        label: 'California tax',
        auto: summary.autoState,
        helper: summary.overrides.state
          ? 'Manual amount applied.'
          : 'Auto estimate assumes CA resident with no itemized deductions.',
      },
      {
        field: 'ficaOverride',
        label: 'FICA (Social Security + Medicare)',
        auto: summary.autoFica,
        helper: summary.overrides.fica
          ? 'Manual amount applied.'
          : 'Auto estimate uses 6.2% Social Security (capped) + 1.45% Medicare.',
      },
    ];

    return (
      <div key={parent} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">{parentLabels[parent]}</p>
            <p className="text-xs text-slate-500">Enter monthly amounts before taxes, rounded to the nearest dollar.</p>
          </div>
          <Badge variant="secondary">Gross capture</Badge>
        </div>

        <div>
          <Label className="text-sm font-semibold text-slate-700">Base wages / salary</Label>
          <Input
            type="number"
            min={0}
            value={inputs.wages}
            onChange={(e) => handleGrossFieldChange(parent, 'wages', e.target.value)}
          />
          <p className="text-xs text-slate-500 mt-1">Use the monthly gross pay from the most recent pay stub.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {additionalIncomeFields.map(({ field, label, helper }) => (
            <div key={field}>
              <Label className="text-sm font-semibold text-slate-700">{label}</Label>
              <Input
                type="number"
                min={0}
                value={inputs[field]}
                onChange={(e) => handleGrossFieldChange(parent, field, e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">{helper}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {overrideFields.map(({ field, label, auto, helper }) => (
            <div key={field}>
              <Label className="text-sm font-semibold text-slate-700">
                {label}
                {' '}
                <span className="font-normal text-slate-500">(auto {formatCurrency(auto)})</span>
              </Label>
              <Input
                type="number"
                min={0}
                placeholder={`Auto ${formatCurrency(auto)}`}
                value={grossInputs[parent][field] ?? ''}
                onChange={(e) => handleOverrideChange(parent, field, e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">{helper}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {deductionFields.map(({ field, label, helper }) => (
            <div key={field}>
              <Label className="text-sm font-semibold text-slate-700">{label}</Label>
              <Input
                type="number"
                min={0}
                value={inputs[field]}
                onChange={(e) => handleGrossFieldChange(parent, field, e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">{helper}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <div className="flex flex-col gap-1">
            <p className="font-semibold">Monthly summary</p>
            <p>Base wages: {formatCurrency(summary.baseIncome)}</p>
            <p>Additional income: {formatCurrency(summary.additionalIncome)}</p>
            <p className="pt-2">Estimated federal tax: {formatCurrency(summary.federal)}</p>
            <p>Estimated state tax: {formatCurrency(summary.state)}</p>
            <p>FICA: {formatCurrency(summary.fica)}</p>
            <p>Other deductions: {formatCurrency(summary.otherDeductions)}</p>
            <p className="pt-2 font-semibold">Net disposable income: {formatCurrency(summary.netDisposable)}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="shadow-sm border-blue-100">
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">Child Support Estimator</p>
          <CardTitle className="text-2xl text-slate-900">Model California guideline support</CardTitle>
          <p className="text-sm text-slate-500">Toggle between quick net-income entry or the advanced gross-income workflow. The outputs mirror the statewide guideline formula.</p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <Label className="text-slate-500">County (for notes & add-ons)</Label>
          <select
            value={countyId}
            onChange={(e) => setCountyId(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            {counties.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <Tabs value={mode} onValueChange={(value) => setMode(value as 'quick' | 'advanced')} className="w-full space-y-4">
            {/* Custom Mode Selector Buttons */}
            <div className="grid w-full grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('quick')}
                className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                  mode === 'quick'
                    ? 'border-emerald-500 bg-emerald-50 shadow-md'
                    : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50'
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  mode === 'quick' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  <Zap className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <p className={`font-semibold ${mode === 'quick' ? 'text-emerald-900' : 'text-slate-700'}`}>
                    Quick Estimate
                  </p>
                  <p className={`text-xs mt-1 ${mode === 'quick' ? 'text-emerald-700' : 'text-slate-500'}`}>
                    Net Income Mode
                  </p>
                  <p className={`text-xs mt-1 ${mode === 'quick' ? 'text-emerald-600' : 'text-slate-400'}`}>
                    Simple & Fast
                  </p>
                </div>
                {mode === 'quick' && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-emerald-500 text-white border-0">Active</Badge>
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMode('advanced')}
                className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                  mode === 'advanced'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  mode === 'advanced' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'
                }`}>
                  <Settings2 className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <p className={`font-semibold ${mode === 'advanced' ? 'text-blue-900' : 'text-slate-700'}`}>
                    Advanced Calculation
                  </p>
                  <p className={`text-xs mt-1 ${mode === 'advanced' ? 'text-blue-700' : 'text-slate-500'}`}>
                    Gross Income Mode
                  </p>
                  <p className={`text-xs mt-1 ${mode === 'advanced' ? 'text-blue-600' : 'text-slate-400'}`}>
                    Detailed & Precise
                  </p>
                </div>
                {mode === 'advanced' && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-blue-500 text-white border-0">Active</Badge>
                  </div>
                )}
              </button>
            </div>

            <TabsContent value="quick">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-slate-700">Parent A net monthly income</Label>
                  <Input
                    type="number"
                    min={0}
                    value={parentAIncome}
                    onChange={(e) => setParentAIncome(Math.max(0, Number(e.target.value) || 0))}
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-slate-700">Parent B net monthly income</Label>
                  <Input
                    type="number"
                    min={0}
                    value={parentBIncome}
                    onChange={(e) => setParentBIncome(Math.max(0, Number(e.target.value) || 0))}
                  />
                </div>
                <p className="text-xs text-slate-500">Use this mode if you already know each parent's net disposable income (e.g., from DissoMaster).</p>
              </div>
            </TabsContent>
            <TabsContent value="advanced">
              <div className="space-y-5">
                {renderAdvancedForm('parentA')}
                {renderAdvancedForm('parentB')}
                <Alert className="border-amber-200 bg-amber-50 text-amber-900">
                  <AlertTitle>Approximation only</AlertTitle>
                  <AlertDescription>
                    Federal/state taxes assume a single filer using the 2024 brackets with a standard deduction and no itemized adjustments.
                    Override any line if you have precise numbers from pay stubs or the official DCSS calculator.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-slate-700">Parent A parenting time</Label>
                <span className="text-sm text-slate-500">{parentATimeShare}%</span>
              </div>
              <Slider
                value={[parentATimeShare]}
                onValueChange={([value]) => setParentATimeShare(value)}
                min={0}
                max={100}
                step={1}
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Parent A primary</span>
                <span>Equal</span>
                <span>Parent B primary</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold text-slate-700">Number of children covered</Label>
              <Input
                type="number"
                min={1}
                max={6}
                value={childrenCount}
                onChange={(e) => setChildrenCount(Math.max(1, Number(e.target.value) || 1))}
              />
              <p className="text-xs text-slate-500 mt-1">Applies the statewide multi-child factor (1 child = 1.0, 2 = 1.6, 3 = 2.1, 4 = 2.5, 5 = 2.7, 6 = 2.9).</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold text-slate-700">Monthly child care add-on</Label>
                <Input
                  type="number"
                  min={0}
                  value={childcare}
                  onChange={(e) => setChildcare(Math.max(0, Number(e.target.value) || 0))}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-slate-700">Uninsured medical add-on</Label>
                <Input
                  type="number"
                  min={0}
                  value={medical}
                  onChange={(e) => setMedical(Math.max(0, Number(e.target.value) || 0))}
                />
              </div>
            </div>
            <div className="text-xs text-slate-500 flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5" /> California guideline: CS = K × [HN − (H% × TN)] × (multi-child factor). Run DissoMaster or the official DCSS calculator for the court-certified figure.
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white">
            <div className="flex items-center justify-between text-sm font-semibold text-blue-700 mb-2">
              <span className="flex items-center gap-2">
                <Calculator className="h-4 w-4" /> Guideline estimate
              </span>
              <Badge variant="outline">{mode === 'advanced' ? 'Advanced gross mode' : 'Quick net mode'}</Badge>
            </div>
            <p className="text-4xl font-bold text-blue-900">{formatCurrency(estimate.guideline)}</p>
            <p className="text-sm text-blue-600">{estimate.payer} would pay this amount each month (before arrears or credits).</p>
            <div className="mt-4 text-sm text-slate-600 space-y-1">
              <p>Base support (w/ factor): {formatCurrency(estimate.baseSupport)}</p>
              <p>Raw base (1 child): {formatCurrency(estimate.rawBase)}</p>
              <p>Multi-child factor: ×{estimate.childFactor.toFixed(2)}</p>
              <p>Add-ons (childcare + medical ÷ 2): {formatCurrency(estimate.addOns / 2)}</p>
              <p>Parent A time share: {estimate.parentATimeShare}% | Parent B: {estimate.parentBTimeShare}%</p>
              <p>K factor: {estimate.kFactor.toFixed(3)} (parenting {estimate.parentingFactor.toFixed(2)} × income fraction {estimate.incomeFraction.toFixed(3)})</p>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Badge variant="outline">County note</Badge>
              {counties.find((c) => c.id === countyId)?.name}
            </div>
            <p className="text-sm text-slate-600">
              Use this number for settlement talks. When you're ready to file, attach FL-342 plus county-specific add-ons (child care receipts, health insurance proof). Essential+ members can save scenarios and auto-fill the forms.
            </p>
          </div>
          <div className="p-5 rounded-2xl border border-rose-100 bg-rose-50/70 space-y-4">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-rose-900">Spousal support snapshot</p>
                <p className="text-xs text-rose-700">Quick 40/50 guideline estimate (short-term marriages).</p>
              </div>
              <Button variant="secondary" size="sm" onClick={syncSpousalFromGuideline}>
                Sync from child support
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-semibold text-slate-700">Higher earner net income</Label>
                <Input
                  type="number"
                  min={0}
                  value={spousalInputs.higherNet}
                  onChange={(e) => setSpousalInputs((prev) => ({ ...prev, higherNet: Math.max(0, Number(e.target.value) || 0) }))}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-slate-700">Lower earner net income</Label>
                <Input
                  type="number"
                  min={0}
                  value={spousalInputs.lowerNet}
                  onChange={(e) => setSpousalInputs((prev) => ({ ...prev, lowerNet: Math.max(0, Number(e.target.value) || 0) }))}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-slate-700">Child support paid by higher earner</Label>
                <Input
                  type="number"
                  min={0}
                  value={spousalInputs.childSupportPaid}
                  onChange={(e) => setSpousalInputs((prev) => ({ ...prev, childSupportPaid: Math.max(0, Number(e.target.value) || 0) }))}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-slate-700">Health insurance premiums (spouse)</Label>
                <Input
                  type="number"
                  min={0}
                  value={spousalInputs.healthPremiums}
                  onChange={(e) => setSpousalInputs((prev) => ({ ...prev, healthPremiums: Math.max(0, Number(e.target.value) || 0) }))}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-slate-700">Filing status</Label>
                <select
                  value={spousalInputs.filingStatus}
                  onChange={(e) => setSpousalInputs((prev) => ({ ...prev, filingStatus: e.target.value as FilingStatus }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="single">Single / Head of Household</option>
                  <option value="married-joint">Married filing jointly</option>
                  <option value="married-separate">Married filing separately</option>
                </select>
              </div>
              <div>
                <Label className="text-sm font-semibold text-slate-700">Dependents claimed</Label>
                <Input
                  type="number"
                  min={0}
                  value={spousalInputs.dependentCount}
                  onChange={(e) => setSpousalInputs((prev) => ({ ...prev, dependentCount: Math.max(0, Number(e.target.value) || 0) }))}
                />
              </div>
            </div>
            <div className="rounded-xl border border-white/60 bg-white p-4 text-sm text-slate-700 space-y-1">
              <p className="text-xs uppercase tracking-wide text-rose-600 font-semibold">Guideline heuristic</p>
              <p className="text-2xl font-bold text-rose-900">{formatCurrency(spousalEstimate.amount)}</p>
              <p className="text-xs text-slate-500">Range: {formatCurrency(spousalEstimate.range.low)} – {formatCurrency(spousalEstimate.range.high)}</p>
              <p className="text-xs text-slate-500">{spousalEstimate.note}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              ATRO reminder: Neither spouse can cancel insurance, sell or borrow against property, or move children out of California without written consent or a court order.
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Email a quick summary (optional)</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                />
                <Button type="button" variant="outline" onClick={handleShareSummary}>
                  Send summary
                </Button>
              </div>
              {shareMessage && <p className="text-xs text-slate-500">{shareMessage}</p>}
            </div>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-800">
            Want to keep a negotiation history or let Maria reference this estimator? Upgrade to Basic to save scenarios and Essential/Plus to link them directly into your filings.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
