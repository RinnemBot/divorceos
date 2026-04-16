import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, BellRing, CalendarClock, ChevronRight, Clock3, Heart, Loader2, Mail, MapPinned, Plus, Trash2 } from 'lucide-react';
import { COUNTY_GUIDES } from '@/data/countyGuides';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { authService, type CaseReminder, type User, type UserProfile } from '@/services/auth';

type ReminderTone = 'urgent' | 'upcoming' | 'planning';
type ReminderActionTab = 'documents' | 'county' | 'service';

interface ReminderItem {
  id: string;
  tone: ReminderTone;
  title: string;
  detail: string;
  dueLabel?: string;
  forms: string[];
  actionTab?: ReminderActionTab;
  actionLabel?: string;
}

interface CaseRemindersPanelProps {
  currentUser: User;
  onJumpToTab?: (tab: ReminderActionTab) => void;
}

interface ReminderFormState {
  title: string;
  description: string;
  dueAt: string;
  forms: string;
  actionTab: ReminderActionTab;
  emailEnabled: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const EMPTY_FORM: ReminderFormState = {
  title: '',
  description: '',
  dueAt: '',
  forms: '',
  actionTab: 'documents',
  emailEnabled: false,
};

function createReminderId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `reminder_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

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
        : 'Service usually needs attention soon after filing. Keep the server lined up and file proof of service once it is done.',
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

function formsStringToArray(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function CaseRemindersPanel({ currentUser, onJumpToTab }: CaseRemindersPanelProps) {
  const reminders = buildReminderItems(currentUser);
  const favoriteCounties = useMemo(
    () => COUNTY_GUIDES.filter((guide) => currentUser.profile?.favoriteCountyIds?.includes(guide.id)),
    [currentUser.profile?.favoriteCountyIds]
  );
  const [savedReminders, setSavedReminders] = useState<CaseReminder[]>([]);
  const [isLoadingSavedReminders, setIsLoadingSavedReminders] = useState(true);
  const [isSavingReminder, setIsSavingReminder] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [form, setForm] = useState<ReminderFormState>(EMPTY_FORM);

  useEffect(() => {
    let cancelled = false;

    const loadReminders = async () => {
      setIsLoadingSavedReminders(true);
      try {
        const nextReminders = await authService.getReminders();
        if (!cancelled) {
          setSavedReminders(nextReminders);
        }
      } catch (error) {
        console.error('Failed to load reminders', error);
        if (!cancelled) {
          setSavedReminders([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSavedReminders(false);
        }
      }
    };

    void loadReminders();

    return () => {
      cancelled = true;
    };
  }, [currentUser.id]);

  const handleCreateReminder = async () => {
    if (!form.title.trim() || !form.dueAt) return;

    setIsSavingReminder(true);
    try {
      const saved = await authService.saveReminder({
        id: createReminderId(),
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        dueAt: form.dueAt,
        forms: formsStringToArray(form.forms),
        actionTab: form.actionTab,
        emailEnabled: form.emailEnabled,
      });
      setSavedReminders((prev) => [...prev, saved].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()));
      setForm(EMPTY_FORM);
    } catch (error) {
      console.error('Failed to save reminder', error);
    } finally {
      setIsSavingReminder(false);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      await authService.deleteReminder(reminderId);
      setSavedReminders((prev) => prev.filter((reminder) => reminder.id !== reminderId));
    } catch (error) {
      console.error('Failed to delete reminder', error);
    }
  };

  const handleSendTestEmail = async (reminderId: string) => {
    setSendingReminderId(reminderId);
    try {
      await authService.sendReminderTestEmail(reminderId);
      const refreshed = await authService.getReminders();
      setSavedReminders(refreshed);
    } catch (error) {
      console.error('Failed to send reminder test email', error);
    } finally {
      setSendingReminderId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-emerald-600" />
            Reminder center
          </CardTitle>
          <CardDescription>
            This is the new reminder layer: automatic in-app deadline nudges, editable custom reminders, and optional email tests.
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
                  {reminder.dueLabel ? <div className="text-right text-xs text-slate-500">{reminder.dueLabel}</div> : null}
                </div>
                <p className="mt-3 text-sm text-slate-600">{reminder.detail}</p>
                {reminder.forms.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {reminder.forms.map((formNumber) => (
                      <Badge key={formNumber} variant="secondary" className="bg-white/80 text-slate-700">
                        {formNumber}
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
            <Plus className="h-4 w-4 text-emerald-600" />
            Add a custom reminder
          </CardTitle>
          <CardDescription>
            Save your own deadline, note the next forms, and optionally mark it for email reminders later.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="reminder-title">Reminder title</Label>
            <Input id="reminder-title" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="File response packet" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reminder-due">Due date / time</Label>
            <Input id="reminder-due" type="datetime-local" value={form.dueAt} onChange={(event) => setForm((prev) => ({ ...prev, dueAt: event.target.value }))} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="reminder-description">Details</Label>
            <Textarea id="reminder-description" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="What needs to happen, who it affects, or what to bring." rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reminder-forms">Forms to remember</Label>
            <Input id="reminder-forms" value={form.forms} onChange={(event) => setForm((prev) => ({ ...prev, forms: event.target.value }))} placeholder="FL-120, FL-150" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reminder-tab">Jump tab</Label>
            <select
              id="reminder-tab"
              value={form.actionTab}
              onChange={(event) => setForm((prev) => ({ ...prev, actionTab: event.target.value as ReminderActionTab }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="documents">Documents</option>
              <option value="county">County Filing</option>
              <option value="service">Service</option>
            </select>
          </div>
          <div className="md:col-span-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <Checkbox checked={form.emailEnabled} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, emailEnabled: Boolean(checked) }))} />
            <div>
              <p className="text-sm font-medium text-slate-900">Optional email reminder</p>
              <p className="text-xs text-slate-500">We can save this preference now and send test emails, while keeping automatic cron sends paused until go-live.</p>
            </div>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={() => void handleCreateReminder()} disabled={isSavingReminder || !form.title.trim() || !form.dueAt}>
              {isSavingReminder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Save reminder
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-blue-600" />
            Saved reminder queue
          </CardTitle>
          <CardDescription>
            Custom reminders live here. Email-enabled reminders can send a test email now, and the automatic send layer can stay paused until launch.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoadingSavedReminders ? (
            <div className="text-sm text-slate-500">Loading reminders…</div>
          ) : savedReminders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No custom reminders yet. Add one above to start testing editable reminders and optional email nudges.
            </div>
          ) : (
            savedReminders.map((reminder) => (
              <div key={reminder.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{reminder.title}</p>
                      {reminder.emailEnabled ? <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">Email enabled</Badge> : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">Due {new Date(reminder.dueAt).toLocaleString()}</p>
                    {reminder.description ? <p className="mt-2 text-sm text-slate-600">{reminder.description}</p> : null}
                    {reminder.forms.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {reminder.forms.map((formNumber) => (
                          <Badge key={formNumber} variant="secondary">{formNumber}</Badge>
                        ))}
                      </div>
                    ) : null}
                    {reminder.lastEmailedAt ? (
                      <p className="mt-2 text-xs text-slate-500">Last test email: {new Date(reminder.lastEmailedAt).toLocaleString()}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2 lg:w-52">
                    {reminder.actionTab ? (
                      <Button variant="outline" onClick={() => onJumpToTab?.(reminder.actionTab as ReminderActionTab)}>
                        Jump to {reminder.actionTab}
                      </Button>
                    ) : null}
                    {reminder.emailEnabled ? (
                      <Button variant="outline" onClick={() => void handleSendTestEmail(reminder.id)} disabled={sendingReminderId === reminder.id}>
                        {sendingReminderId === reminder.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                        Send test email
                      </Button>
                    ) : null}
                    <Button variant="ghost" className="text-rose-600 hover:text-rose-700" onClick={() => void handleDeleteReminder(reminder.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
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
          <p>• automatic email sends once the live cron is re-enabled</p>
        </CardContent>
      </Card>
    </div>
  );
}
