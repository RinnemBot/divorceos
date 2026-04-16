import { Link } from 'react-router-dom';
import { AlertTriangle, BellRing, CalendarClock, ChevronRight, Clock3, Heart, MapPinned } from 'lucide-react';
import { COUNTY_GUIDES } from '@/data/countyGuides';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { User, UserProfile } from '@/services/auth';

type ReminderTone = 'urgent' | 'upcoming' | 'planning';

interface ReminderItem {
  id: string;
  tone: ReminderTone;
  title: string;
  detail: string;
  dueLabel?: string;
  forms: string[];
  actionTab?: 'documents' | 'county' | 'service';
  actionLabel?: string;
}

interface CaseRemindersPanelProps {
  currentUser: User;
  onJumpToTab?: (tab: 'documents' | 'county' | 'service') => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDateInput(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysUntil(date: Date) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  return Math.round((target - start) / DAY_MS);
}

function formatDueLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function uniqueForms(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function buildResponseForms(profile?: UserProfile) {
  return uniqueForms([
    'FL-120',
    profile?.hasChildren ? 'FL-105/GC-120' : undefined,
    profile?.primaryGoals?.some((goal) => /support|spousal|child/i.test(goal)) ? 'FL-150' : undefined,
  ]);
}

function buildHearingForms(profile?: UserProfile) {
  return uniqueForms([
    'FL-300',
    profile?.primaryGoals?.some((goal) => /custody/i.test(goal)) ? 'FL-311' : undefined,
    profile?.primaryGoals?.some((goal) => /support|spousal|child/i.test(goal)) ? 'FL-150' : undefined,
  ]);
}

function buildReminderItems(user: User): ReminderItem[] {
  const profile = user.profile;
  const reminders: ReminderItem[] = [];

  if (!profile?.county) {
    reminders.push({
      id: 'pick-county',
      tone: 'planning',
      title: 'Pick and save your county',
      detail: 'Save at least one county so DivorceOS can keep the right filing path, clerk details, and local checklist front and center.',
      forms: [],
      actionTab: 'county',
      actionLabel: 'Save county',
    });
  }

  const filingDate = parseDateInput(profile?.filingDate);
  const serviceDate = parseDateInput(profile?.serviceDate);
  const hearingDate = parseDateInput(profile?.nextHearingDate);

  if (!filingDate) {
    reminders.push({
      id: 'initial-packet',
      tone: 'planning',
      title: 'Build the initial filing packet',
      detail: 'If the case has not been filed yet, prep the starter packet now so you are not scrambling when you are ready to file.',
      forms: uniqueForms(['FL-100', 'FL-110', profile?.hasChildren ? 'FL-105/GC-120' : undefined]),
      actionTab: 'documents',
      actionLabel: 'Open forms',
    });
  }

  if (filingDate && !serviceDate) {
    const serviceDueDate = new Date(filingDate.getTime() + 60 * DAY_MS);
    const remainingDays = daysUntil(serviceDueDate);
    reminders.push({
      id: 'service-deadline',
      tone: remainingDays <= 7 ? 'urgent' : 'upcoming',
      title: 'Service and proof-of-service follow-up',
      detail: remainingDays < 0
        ? 'Your filing-based service window looks overdue. Double-check whether service was completed and get FL-115 filed fast.'
        : `Service usually needs attention soon after filing. Keep the server lined up and file proof of service once it is done.` ,
      dueLabel: `${formatDueLabel(serviceDueDate)}${remainingDays >= 0 ? ` (${remainingDays} day${remainingDays === 1 ? '' : 's'} left)` : ' (past due)'}`,
      forms: ['FL-115'],
      actionTab: 'service',
      actionLabel: 'Open service checklist',
    });
  }

  if (serviceDate) {
    const responseDueDate = new Date(serviceDate.getTime() + 30 * DAY_MS);
    const remainingDays = daysUntil(responseDueDate);
    reminders.push({
      id: 'response-deadline',
      tone: remainingDays <= 7 ? 'urgent' : 'upcoming',
      title: 'Response deadline is coming up',
      detail: remainingDays < 0
        ? 'The 30-day response window may already be late. Maria should flag this and point the user to immediate response or recovery steps.'
        : 'California response timing gets tight fast after service. Keep the response packet ready before the last-minute crunch.',
      dueLabel: `${formatDueLabel(responseDueDate)}${remainingDays >= 0 ? ` (${remainingDays} day${remainingDays === 1 ? '' : 's'} left)` : ' (past due)'}`,
      forms: buildResponseForms(profile),
      actionTab: 'documents',
      actionLabel: 'Review response forms',
    });
  }

  if (hearingDate) {
    const remainingDays = daysUntil(hearingDate);
    reminders.push({
      id: 'hearing-prep',
      tone: remainingDays <= 14 ? 'urgent' : 'upcoming',
      title: 'Court date / hearing prep',
      detail: remainingDays < 0
        ? 'That hearing date looks like it has passed. Maria should help the user figure out what happened and what to do next.'
        : 'Keep declarations, attachments, and hearing-specific paperwork ready early so nothing slips close to court.',
      dueLabel: `${formatDueLabel(hearingDate)}${remainingDays >= 0 ? ` (${remainingDays} day${remainingDays === 1 ? '' : 's'} away)` : ' (date passed)'}`,
      forms: buildHearingForms(profile),
      actionTab: 'documents',
      actionLabel: 'Prep hearing forms',
    });
  }

  return reminders;
}

function toneClasses(tone: ReminderTone) {
  if (tone === 'urgent') {
    return {
      icon: AlertTriangle,
      badge: 'bg-rose-100 text-rose-700 border-rose-200',
      card: 'border-rose-200 bg-rose-50/70',
    };
  }
  if (tone === 'upcoming') {
    return {
      icon: CalendarClock,
      badge: 'bg-amber-100 text-amber-700 border-amber-200',
      card: 'border-amber-200 bg-amber-50/70',
    };
  }
  return {
    icon: BellRing,
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    card: 'border-emerald-200 bg-emerald-50/70',
  };
}

export function CaseRemindersPanel({ currentUser, onJumpToTab }: CaseRemindersPanelProps) {
  const reminders = buildReminderItems(currentUser);
  const favoriteCounties = COUNTY_GUIDES.filter((guide) => currentUser.profile?.favoriteCountyIds?.includes(guide.id));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-emerald-600" />
            Reminder center
          </CardTitle>
          <CardDescription>
            Use this as the first version of deadline nudges, next-form reminders, and county follow-through.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reminders.map((reminder) => {
            const tone = toneClasses(reminder.tone);
            const Icon = tone.icon;
            return (
              <div key={reminder.id} className={`rounded-2xl border p-4 ${tone.card}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge variant="outline" className={tone.badge}>
                      <Icon className="mr-1 h-3.5 w-3.5" />
                      {reminder.tone === 'urgent' ? 'Urgent' : reminder.tone === 'upcoming' ? 'Coming up' : 'Plan ahead'}
                    </Badge>
                    <p className="mt-3 font-semibold text-slate-900">{reminder.title}</p>
                  </div>
                  {reminder.dueLabel ? (
                    <div className="text-right text-xs text-slate-500">{reminder.dueLabel}</div>
                  ) : null}
                </div>
                <p className="mt-3 text-sm text-slate-600">{reminder.detail}</p>
                {reminder.forms.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {reminder.forms.map((form) => (
                      <Badge key={form} variant="secondary" className="bg-white/80 text-slate-700">
                        {form}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                {reminder.actionTab && reminder.actionLabel ? (
                  <Button variant="outline" className="mt-4 w-full justify-between" onClick={() => onJumpToTab?.(reminder.actionTab!)}>
                    {reminder.actionLabel}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-rose-500" />
            Saved counties
          </CardTitle>
          <CardDescription>
            Favorite counties live here so users can jump back into the right local roadmap fast.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {favoriteCounties.length ? (
            <div className="flex flex-wrap gap-3">
              {favoriteCounties.map((county) => (
                <Button key={county.id} asChild variant="outline" className="justify-start">
                  <Link to={`/concierge/${county.id}`}>
                    <MapPinned className="mr-2 h-4 w-4 text-emerald-600" />
                    {county.name}
                  </Link>
                </Button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No counties saved yet. Pick one in the County Filing tab and tap save.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-slate-500" />
            Reminder types we can keep adding
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
          <p>• response due in 30 days after service</p>
          <p>• proof of service / FL-115 follow-up</p>
          <p>• hearing coming up with next-form suggestions</p>
          <p>• county-specific packet nudges</p>
          <p>• filing prep if the user has not started yet</p>
          <p>• future email/SMS notifications once you want outbound alerts</p>
        </CardContent>
      </Card>
    </div>
  );
}
