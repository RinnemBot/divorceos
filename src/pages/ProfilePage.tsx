import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User as UserIcon, 
  Mail, 
  MapPin, 
  Calendar, 
  Users, 
  Save, 
  Loader2, 
  CheckCircle,
  ArrowLeft,
  Sparkles,
  Gift,
  Star,
  Printer,
  Trash2,
  FileText
} from 'lucide-react';
import { authService, SUBSCRIPTION_LIMITS, type UserProfile, type User } from '@/services/auth';
import { getSupportScenarios, deleteSupportScenario, type SupportScenario } from '@/services/savedFiles';
import { ReferralProgram } from '@/components/ReferralProgram';
import { ReviewSystem } from '@/components/ReviewSystem';

const CALIFORNIA_COUNTIES = [
  'Alameda', 'Alpine', 'Amador', 'Butte', 'Calaveras', 'Colusa', 'Contra Costa',
  'Del Norte', 'El Dorado', 'Fresno', 'Glenn', 'Humboldt', 'Imperial', 'Inyo',
  'Kern', 'Kings', 'Lake', 'Lassen', 'Los Angeles', 'Madera', 'Marin', 'Mariposa',
  'Mendocino', 'Merced', 'Modoc', 'Mono', 'Monterey', 'Napa', 'Nevada', 'Orange',
  'Placer', 'Plumas', 'Riverside', 'Sacramento', 'San Benito', 'San Bernardino',
  'San Diego', 'San Francisco', 'San Joaquin', 'San Luis Obispo', 'San Mateo',
  'Santa Barbara', 'Santa Clara', 'Santa Cruz', 'Shasta', 'Sierra', 'Siskiyou',
  'Solano', 'Sonoma', 'Stanislaus', 'Sutter', 'Tehama', 'Trinity', 'Tulare',
  'Tuolumne', 'Ventura', 'Yolo', 'Yuba'
];

export function ProfilePage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [savedScenarios, setSavedScenarios] = useState<SupportScenario[]>([]);
  
  // Profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [county, setCounty] = useState('');
  const [marriageDate, setMarriageDate] = useState('');
  const [separationDate, setSeparationDate] = useState('');
  const [hasChildren, setHasChildren] = useState(false);
  const [childrenCount, setChildrenCount] = useState(0);
  const [childrenAges, setChildrenAges] = useState('');

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      navigate('/');
      return;
    }
    setCurrentUser(user);
    setSavedScenarios(getSupportScenarios(user.id));
    
    // Load existing profile data
    if (user.profile) {
      setFirstName(user.profile.firstName || '');
      setLastName(user.profile.lastName || '');
      setCounty(user.profile.county || '');
      setMarriageDate(user.profile.marriageDate || '');
      setSeparationDate(user.profile.separationDate || '');
      setHasChildren(user.profile.hasChildren || false);
      setChildrenCount(user.profile.childrenCount || 0);
      setChildrenAges(user.profile.childrenAges?.join(', ') || '');
    }
  }, [navigate]);

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    setSuccessMessage('');
    
    const profile: UserProfile = {
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      county: county || undefined,
      marriageDate: marriageDate || undefined,
      separationDate: separationDate || undefined,
      hasChildren: hasChildren || undefined,
      childrenCount: hasChildren ? childrenCount : undefined,
      childrenAges: hasChildren && childrenAges 
        ? childrenAges.split(',').map(age => parseInt(age.trim())).filter(n => !isNaN(n))
        : undefined,
    };
    
    authService.updateProfile(currentUser.id, profile);
    
    // Update local user state
    const updatedUser = authService.getCurrentUser();
    setCurrentUser(updatedUser);
    
    setIsLoading(false);
    setSuccessMessage('Profile saved successfully!');
    
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const refreshSavedScenarios = () => {
    if (!currentUser) return;
    setSavedScenarios(getSupportScenarios(currentUser.id));
  };

  const handleDeleteScenario = (scenarioId: string) => {
    if (!currentUser) return;
    const confirmDelete = window.confirm('Delete this saved file? This cannot be undone.');
    if (!confirmDelete) return;
    deleteSupportScenario(currentUser.id, scenarioId);
    refreshSavedScenarios();
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

  const displayCurrency = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  if (!currentUser) {
    return null;
  }

  const planInfo = SUBSCRIPTION_LIMITS[currentUser.subscription];
  const remainingChats = planInfo.maxChats === Infinity 
    ? 'Unlimited' 
    : Math.max(0, planInfo.maxChats - currentUser.chatCount);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_14%_0%,rgba(16,185,129,0.16),transparent_24%),radial-gradient(circle_at_86%_8%,rgba(34,211,238,0.14),transparent_20%),linear-gradient(180deg,#f3fff8_0%,#eefcf8_44%,#f8fafc_100%)] py-12 dark:bg-[radial-gradient(circle_at_16%_0%,rgba(16,185,129,0.24),transparent_24%),radial-gradient(circle_at_84%_10%,rgba(34,211,238,0.16),transparent_20%),linear-gradient(180deg,#020617_0%,#03111f_50%,#020617_100%)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Home
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Your Profile</h1>
          <p className="text-slate-600 mt-1">
            Manage your account, referrals, and reviews
          </p>
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 rounded-xl border border-white/80 bg-white/72 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <TabsTrigger value="profile" className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white">
              <UserIcon className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="referrals" className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white">
              <Gift className="h-4 w-4 mr-2" />
              Referrals
            </TabsTrigger>
            <TabsTrigger value="saved" className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white">
              <FileText className="h-4 w-4 mr-2" />
              Saved Files
            </TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white">
              <Star className="h-4 w-4 mr-2" />
              Reviews
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* Account Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-emerald-700" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-500">Email</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">{currentUser.email}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-500">Current Plan</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Sparkles className="h-4 w-4 text-emerald-500" />
                      <Badge variant="secondary">{planInfo.name}</Badge>
                    </div>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-500">Chats Remaining Today</Label>
                    <p className="font-medium mt-1">{remainingChats}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500">Member Since</Label>
                    <p className="font-medium mt-1">
                      {new Date(currentUser.chatCountResetDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Form Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Save className="h-5 w-5 text-emerald-700" />
                  Case Information (Optional)
                </CardTitle>
                <CardDescription>
                  This information helps Maria provide more personalized guidance. 
                  All fields are optional.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {successMessage && (
                  <Alert className="mb-6 bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                      {successMessage}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-6">
                  {/* Name Section */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Your first name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Your last name"
                      />
                    </div>
                  </div>

                  {/* County */}
                  <div className="space-y-2">
                    <Label htmlFor="county" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      California County
                    </Label>
                    <select
                      id="county"
                      value={county}
                      onChange={(e) => setCounty(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select your county</option>
                      {CALIFORNIA_COUNTIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500">
                      This helps Maria provide county-specific information.
                    </p>
                  </div>

                  {/* Dates */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="marriageDate" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        Date of Marriage
                      </Label>
                      <Input
                        id="marriageDate"
                        type="date"
                        value={marriageDate}
                        onChange={(e) => setMarriageDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="separationDate" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        Date of Separation (if applicable)
                      </Label>
                      <Input
                        id="separationDate"
                        type="date"
                        value={separationDate}
                        onChange={(e) => setSeparationDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Children */}
                  <div className="space-y-4 border-t border-slate-200 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-400" />
                        <Label htmlFor="hasChildren">Do you have children?</Label>
                      </div>
                      <Switch
                        id="hasChildren"
                        checked={hasChildren}
                        onCheckedChange={setHasChildren}
                      />
                    </div>

                    {hasChildren && (
                      <div className="grid md:grid-cols-2 gap-4 pl-6">
                        <div className="space-y-2">
                          <Label htmlFor="childrenCount">Number of Children</Label>
                          <Input
                            id="childrenCount"
                            type="number"
                            min={1}
                            max={20}
                            value={childrenCount}
                            onChange={(e) => setChildrenCount(parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="childrenAges">Children&apos;s Ages (comma separated)</Label>
                          <Input
                            id="childrenAges"
                            value={childrenAges}
                            onChange={(e) => setChildrenAges(e.target.value)}
                            placeholder="e.g., 5, 8, 12"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Save Button */}
                  <div className="pt-4">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isLoading}
                      className="w-full md:w-auto bg-emerald-700 hover:bg-emerald-800"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Profile
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upgrade Card for Free Users */}
            {currentUser.subscription === 'free' && (
              <Card className="bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.28),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.18),transparent_22%),linear-gradient(135deg,#064e3b_0%,#065f46_42%,#083344_100%)] text-white">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">Upgrade Your Plan</h3>
                      <p className="text-emerald-100 text-sm mt-1">
                        Get more AI chats and premium features with our paid plans.
                      </p>
                    </div>
                    <Button 
                      variant="secondary" 
                      onClick={() => navigate('/pricing')}
                    >
                      View Pricing
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals">
            <ReferralProgram user={currentUser} />
          </TabsContent>

          {/* Saved Files Tab */}
          <TabsContent value="saved">
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
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <ReviewSystem user={currentUser} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
