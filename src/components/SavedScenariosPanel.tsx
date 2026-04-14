import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Printer, Trash2 } from 'lucide-react';
import { type User } from '@/services/auth';
import { deleteSupportScenario, getSupportScenarios, type SupportScenario } from '@/services/savedFiles';

interface SavedScenariosPanelProps {
  user: User;
}

export function SavedScenariosPanel({ user }: SavedScenariosPanelProps) {
  const [savedScenarios, setSavedScenarios] = useState<SupportScenario[]>([]);

  useEffect(() => {
    let cancelled = false;

    void getSupportScenarios(user.id)
      .then((scenarios) => {
        if (!cancelled) {
          setSavedScenarios(scenarios);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('Failed to load saved scenarios', error);
          setSavedScenarios([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user.id]);

  const refreshSavedScenarios = async () => {
    setSavedScenarios(await getSupportScenarios(user.id));
  };

  const handleDeleteScenario = async (scenarioId: string) => {
    const confirmDelete = window.confirm('Delete this saved file? This cannot be undone.');
    if (!confirmDelete) return;

    try {
      await deleteSupportScenario(user.id, scenarioId);
      await refreshSavedScenarios();
    } catch (error) {
      console.error('Failed to delete saved scenario', error);
    }
  };

  const handlePrintScenario = (scenario: SupportScenario) => {
    if (typeof window === 'undefined') return;
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;
    const snapshot = scenario.snapshot;
    printWindow.document.write(`<!doctype html>
<html><head><title>${scenario.title}</title><style>body{font-family:Inter,Arial,sans-serif;padding:32px;color:#0f172a;}h1{margin-bottom:4px;}table{width:100%;border-collapse:collapse;margin-top:24px;}td{padding:8px;border:1px solid #e2e8f0;}th{text-align:left;padding:8px;background:#f1f5f9;border:1px solid #e2e8f0;}small{color:#475569;}</style></head><body>`);
    printWindow.document.write(`<h1>${scenario.title}</h1>`);
    printWindow.document.write(`<p><small>Saved ${new Date(scenario.createdAt).toLocaleString()}</small></p>`);
    printWindow.document.write('<table>');
    printWindow.document.write(`<tr><th>Child support</th><td>${displayCurrency(scenario.childSupport)}</td></tr>`);
    printWindow.document.write(`<tr><th>Spousal support</th><td>${displayCurrency(scenario.spousalSupport)}</td></tr>`);
    printWindow.document.write(`<tr><th>Combined</th><td>${displayCurrency(scenario.combinedSupport)}</td></tr>`);
    printWindow.document.write(`<tr><th>Payer</th><td>${scenario.estimatePayer}</td></tr>`);
    printWindow.document.write(`<tr><th>County</th><td>${snapshot.countyName || snapshot.countyId || 'Not specified'}</td></tr>`);
    printWindow.document.write(`<tr><th>Parent A time</th><td>${snapshot.parentATimeShare}%</td></tr>`);
    printWindow.document.write(`<tr><th>Children covered</th><td>${snapshot.childrenCount}</td></tr>`);
    printWindow.document.write(`<tr><th>Child care add-on</th><td>${displayCurrency(snapshot.childcare)}</td></tr>`);
    printWindow.document.write(`<tr><th>Medical add-on</th><td>${displayCurrency(snapshot.medical)}</td></tr>`);
    printWindow.document.write(`<tr><th>Mode</th><td>${snapshot.mode === 'advanced' ? 'Advanced (gross capture)' : 'Quick net mode'}</td></tr>`);
    printWindow.document.write('</table>');
    printWindow.document.write('<p style="margin-top:24px;font-size:12px;color:#475569;">Use this sheet when discussing settlement, prepping FL-342/343, or sharing with Maria for context.</p>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-600" />
          My Saved Files
        </CardTitle>
        <CardDescription>Exports from the support estimator live here. Print or delete them anytime.</CardDescription>
      </CardHeader>
      <CardContent>
        {savedScenarios.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p className="font-medium">No saved files yet</p>
            <p className="text-sm">Run the Support Tools estimator and click "Save run" to capture a snapshot.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {savedScenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{scenario.title}</h3>
                    <p className="text-xs text-slate-500">Saved {new Date(scenario.createdAt).toLocaleString()}</p>
                    <p className="text-xs text-slate-400">County: {scenario.snapshot.countyName || scenario.snapshot.countyId || 'Not specified'}</p>
                    <p className="text-xs text-slate-400">Parent A time share: {scenario.snapshot.parentATimeShare}% | Children: {scenario.snapshot.childrenCount}</p>
                  </div>
                  <div className="text-sm text-slate-600 space-y-1 text-left md:text-right">
                    <p>Child support: <span className="font-semibold text-slate-900">{displayCurrency(scenario.childSupport)}</span></p>
                    <p>Spousal support: <span className="font-semibold text-slate-900">{displayCurrency(scenario.spousalSupport)}</span></p>
                    <p>Combined: <span className="font-semibold text-emerald-700">{displayCurrency(scenario.combinedSupport)}</span></p>
                    <p className="text-xs text-slate-400">Payer: {scenario.estimatePayer}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-4 sm:flex-row">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrintScenario(scenario)}
                    className="border-slate-300 text-slate-700"
                  >
                    <Printer className="h-4 w-4 mr-1" /> Print / Save PDF
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteScenario(scenario.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function displayCurrency(value: number) {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
