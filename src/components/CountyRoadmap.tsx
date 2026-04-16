import { useState, useEffect } from 'react';
import { COUNTY_GUIDES } from '@/data/countyGuides';
import type { CountyGuide } from '@/data/countyGuides';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { authService, type User } from '@/services/auth';
import { MapPin, Clock, FileCheck2, Heart, Info, Loader2 } from 'lucide-react';

interface CountyRoadmapProps {
  initialCountyId?: string;
  onCountyChange?: (countyId: string) => void;
  currentUser?: User | null;
  onProfileUpdated?: (user: User) => void;
}

export function CountyRoadmap({ initialCountyId, onCountyChange, currentUser, onProfileUpdated }: CountyRoadmapProps) {
  const [selectedCountyId, setSelectedCountyId] = useState(initialCountyId ?? '');
  const [isSavingCounty, setIsSavingCounty] = useState(false);
  const county = COUNTY_GUIDES.find((c) => c.id === selectedCountyId) as CountyGuide | undefined;
  const savedCountyIds = currentUser?.profile?.favoriteCountyIds || [];
  const isSavedCounty = county ? savedCountyIds.includes(county.id) : false;

  useEffect(() => {
    if (initialCountyId) {
      setSelectedCountyId(initialCountyId);
    }
  }, [initialCountyId]);

  const handleCountySelect = (value: string) => {
    setSelectedCountyId(value);
    onCountyChange?.(value);
  };

  const handleToggleFavoriteCounty = async () => {
    if (!currentUser || !county || isSavingCounty) return;

    setIsSavingCounty(true);

    try {
      const nextFavoriteCountyIds = isSavedCounty
        ? savedCountyIds.filter((id) => id !== county.id)
        : [...new Set([...savedCountyIds, county.id])];

      await authService.updateProfile(currentUser.id, {
        ...currentUser.profile,
        county: county.name,
        favoriteCountyIds: nextFavoriteCountyIds,
      });

      const refreshedUser = authService.getCurrentUser();
      if (refreshedUser) {
        onProfileUpdated?.(refreshedUser);
      }
    } catch (error) {
      console.error('Failed to save county preference', error);
    } finally {
      setIsSavingCounty(false);
    }
  };

  return (
    <Card className="border-emerald-100 shadow-sm">
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-emerald-600 font-semibold">County Filing Concierge</p>
          <CardTitle className="text-2xl text-slate-900">Customized roadmap for your courthouse</CardTitle>
          <p className="text-sm text-slate-500">Choose your county and we’ll lay out the filing method, addresses, fees, and next steps.</p>
        </div>
        <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
          <Select value={selectedCountyId || undefined} onValueChange={handleCountySelect}>
            <SelectTrigger className="w-full lg:w-64">
              <SelectValue placeholder="Select county" />
            </SelectTrigger>
            <SelectContent>
              {COUNTY_GUIDES.map((guide) => (
                <SelectItem key={guide.id} value={guide.id}>
                  {guide.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {county && currentUser ? (
            <Button variant={isSavedCounty ? 'default' : 'outline'} onClick={() => void handleToggleFavoriteCounty()} disabled={isSavingCounty}>
              {isSavingCounty ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Heart className="mr-2 h-4 w-4" />}
              {isSavedCounty ? 'Saved county' : 'Save county'}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      {county ? (
        <CardContent className="grid gap-8 lg:grid-cols-[300px,1fr]">
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-100">
              <p className="text-xs uppercase tracking-wide font-semibold">Filing Method</p>
              <p className="font-medium text-base">{county.filingMethod}</p>
              <p className="text-sm mt-2 text-emerald-800">Fees: {county.filingFee}</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <MapPin className="h-4 w-4" /> Clerk of Court
              </div>
              <p className="font-semibold">{county.clerk.courthouse}</p>
              <p className="text-sm text-slate-600">{county.clerk.address}</p>
              <p className="text-sm text-slate-600">{county.clerk.hours}</p>
              <p className="text-sm text-slate-600">{county.clerk.phone}</p>
              {county.clerk.efilePortal && (
                <Button asChild variant="link" className="px-0 text-emerald-600">
                  <a href={county.clerk.efilePortal} target="_blank" rel="noopener noreferrer">
                    Launch e-filing portal
                  </a>
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="h-4 w-4" /> {county.processingTime}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <FileCheck2 className="h-4 w-4" /> {county.serviceNotes}
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Pro tips</p>
              <ul className="space-y-1 text-sm text-slate-600">
                {county.proTips.map((tip) => (
                  <li key={tip}>• {tip}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="space-y-5">
            {county.steps.map((step, index) => (
              <div key={step.title} className="p-4 border border-slate-200 rounded-xl bg-white">
                <Badge variant="outline" className="mb-2">Step {index + 1}</Badge>
                <p className="font-semibold text-slate-900">{step.title}</p>
                <p className="text-sm text-slate-600 mt-1">{step.description}</p>
              </div>
            ))}
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
              <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                Upgrade to Basic for saved roadmaps + checklist reminders, or Essential+ to sync deadlines with SMS/email alerts.
              </div>
            </div>
          </div>
        </CardContent>
      ) : (
        <CardContent className="py-12">
          <div className="text-center space-y-3 text-slate-500">
            <p className="text-lg font-semibold text-slate-700">Choose a county to load the concierge roadmap.</p>
            <p className="text-sm">We’ll show filing methods, clerk details, packet steps, and local tips as soon as you pick a county above.</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
