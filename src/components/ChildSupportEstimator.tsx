import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { COUNTY_GUIDES } from '@/data/countyGuides';
import { Slider } from '@/components/ui/slider';
import { Info, Calculator } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const counties = COUNTY_GUIDES.map((c) => ({ id: c.id, name: c.name }));

const MULTI_CHILD_FACTORS: Record<number, number> = {
  1: 1,
  2: 1.6,
  3: 2.1,
  4: 2.5,
  5: 2.7,
  6: 2.9,
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
    return 0.10 + 1499 / totalNet;
  }
  return 0.12 + 1200 / totalNet;
}

function formatCurrency(value: number) {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

type ComingSoonFieldProps = {
  label: string;
  helper: string;
};

function ComingSoonField({ label, helper }: ComingSoonFieldProps) {
  return (
    <div>
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      <Input
        disabled
        placeholder="Rolling out soon"
        className="mt-1 cursor-not-allowed border-dashed bg-slate-50 text-slate-400 placeholder:text-slate-400"
      />
      <p className="text-xs text-slate-500 mt-1">{helper}</p>
    </div>
  );
}

export function ChildSupportEstimator() {
  const [countyId, setCountyId] = useState(counties[0]?.id);
  const [parentAIncome, setParentAIncome] = useState(7500);
  const [parentBIncome, setParentBIncome] = useState(4500);
  const [parentATimeShare, setParentATimeShare] = useState(65);
  const [childrenCount, setChildrenCount] = useState(1);
  const [childcare, setChildcare] = useState(400);
  const [medical, setMedical] = useState(150);
  const [mode, setMode] = useState<'quick' | 'advanced'>('quick');

  const estimate = useMemo(() => {
    const aIncome = Number(parentAIncome) || 0;
    const bIncome = Number(parentBIncome) || 0;
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
    const netBase = isFinite(baseSupport) ? baseSupport : 0;
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
  }, [parentAIncome, parentBIncome, parentATimeShare, childcare, medical, childrenCount]);

  return (
    <Card className="shadow-sm border-blue-100">
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">Child Support Estimator</p>
          <CardTitle className="text-2xl text-slate-900">Model California guideline support</CardTitle>
          <p className="text-sm text-slate-500">Enter monthly net incomes, parenting time, and add-ons to preview guideline support. Use this to prep for mediation or filings.</p>
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
            <TabsList className="grid w-full grid-cols-2 bg-slate-100">
              <TabsTrigger value="quick">Quick (Net Income)</TabsTrigger>
              <TabsTrigger value="advanced">Advanced (Gross Income)</TabsTrigger>
            </TabsList>
            <TabsContent value="quick">
              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-semibold text-slate-700">Parent A net monthly income</Label>
                  <Input
                    type="number"
                    value={parentAIncome}
                    onChange={(e) => setParentAIncome(Number(e.target.value))}
                    min={0}
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-slate-700">Parent B net monthly income</Label>
                  <Input
                    type="number"
                    value={parentBIncome}
                    onChange={(e) => setParentBIncome(Number(e.target.value))}
                    min={0}
                  />
                </div>
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
                    onChange={(e) => setChildrenCount(Math.max(1, Number(e.target.value)))}
                  />
                  <p className="text-xs text-slate-500 mt-1">Applies the statewide multi-child factor (1 child = 1.0, 2 = 1.6, 3 = 2.1, 4 = 2.5, 5 = 2.7, 6 = 2.9).</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Monthly child care add-on</Label>
                    <Input
                      type="number"
                      value={childcare}
                      onChange={(e) => setChildcare(Number(e.target.value))}
                      min={0}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Uninsured medical add-on</Label>
                    <Input
                      type="number"
                      value={medical}
                      onChange={(e) => setMedical(Number(e.target.value))}
                      min={0}
                    />
                  </div>
                </div>
                <div className="text-xs text-slate-500 flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5" /> California guideline: CS = K × [HN − (H% × TN)] × (multi-child factor). This tool mirrors that structure, but run DissoMaster or the state calculator for official numbers.
                </div>
              </div>
            </TabsContent>
            <TabsContent value="advanced">
              <div className="space-y-6">
                <Alert className="border-amber-200 bg-amber-50 text-amber-900">
                  <AlertTitle>Gross income mode is in progress</AlertTitle>
                  <AlertDescription>We are wiring up the full DCSS gross-income and deduction workflow. Use this preview to plan what data you will need (pay stubs, benefit statements, deduction amounts) before the inputs unlock.</AlertDescription>
                </Alert>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Gross income capture</p>
                      <p className="text-xs text-slate-500">Wages, salary, and guaranteed pay per Family Code §4058.</p>
                    </div>
                    <Badge variant="secondary">Step 1</Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <ComingSoonField label="Parent A monthly wages" helper="Attach pay stubs or payroll reports for the last 2 months." />
                    <ComingSoonField label="Parent B monthly wages" helper="We will mirror the same capture for the other parent." />
                    <ComingSoonField label="Overtime / bonus" helper="Toggle on and add average overtime, bonus, or commission." />
                    <ComingSoonField label="Self-employment net" helper="Import Schedule C or bookkeeping exports." />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Deductions & adjustments</p>
                      <p className="text-xs text-slate-500">We will auto-estimate taxes, FICA, retirement, union dues, health premiums, and existing orders.</p>
                    </div>
                    <Badge variant="secondary">Step 2</Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <ComingSoonField label="Federal & state taxes" helper="Simplified brackets with manual override." />
                    <ComingSoonField label="FICA (Social Security + Medicare)" helper="Automatic caps + prompts for high earners." />
                    <ComingSoonField label="Health premiums for kids" helper="Track what each parent pays so we can split add-ons." />
                    <ComingSoonField label="Existing support orders" helper="Input monthly amounts actually being paid." />
                    <ComingSoonField label="Retirement / union dues" helper="Capture mandatory deductions per §4059." />
                    <ComingSoonField label="Extreme hardship" helper="Manual field + note for the judge." />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Badge variant="outline">Summary</Badge>
                    Net disposable preview (shared with quick mode)
                  </div>
                  <p className="text-sm text-slate-600">Parent A quick-mode net: {formatCurrency(Number(parentAIncome) || 0)}</p>
                  <p className="text-sm text-slate-600">Parent B quick-mode net: {formatCurrency(Number(parentBIncome) || 0)}</p>
                  <p className="text-xs text-slate-500">Advanced entry will feed the computed net disposable income straight into the same calculation shown on the right so you can compare modes instantly.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white">
            <div className="flex items-center justify-between text-sm font-semibold text-blue-700 mb-2">
              <span className="flex items-center gap-2">
                <Calculator className="h-4 w-4" /> Guideline estimate
              </span>
              <Badge variant="outline">{mode === 'quick' ? 'Quick mode' : 'Advanced preview'}</Badge>
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
              Use this number for settlement talks. When you’re ready to file, attach FL-342 plus county-specific add-ons (child care receipts, health insurance proof). Essential+ members can save scenarios and auto-fill the forms.
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-800">
            Want to keep a negotiation history or let Maria reference this estimator? Upgrade to Basic to save scenarios and Essential/Plus to link them directly into your filings.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
