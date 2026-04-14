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
  Sparkles
} from 'lucide-react';
import { authService, SUBSCRIPTION_LIMITS, type UserProfile, type User } from '@/services/auth';

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

const CASE_STAGES = [
  'Pre-filing',
  'Filed, not served',
  'Served',
  'Response filed',
  'Temporary orders pending',
  'Judgment / settlement phase',
];

const REPRESENTATION_OPTIONS = [
  'I am self-represented',
  'I have an attorney',
  'The other side is self-represented',
  'The other side has an attorney',
  'Both sides have attorneys',
];

const PRIMARY_GOALS = [
  'Move the case forward',
  'Custody / parenting plan',
  'Child support',
  'Spousal support',
  'Property division',
  'Finalize judgment',
];

export function ProfilePage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [county, setCounty] = useState('');
  const [marriageDate, setMarriageDate] = useState('');
  const [separationDate, setSeparationDate] = useState('');
  const [hasChildren, setHasChildren] = useState(false);
  const [childrenCount, setChildrenCount] = useState(0);
  const [childrenAges, setChildrenAges] = useState('');
  const [caseStage, setCaseStage] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [filingDate, setFilingDate] = useState('');
  const [serviceDate, setServiceDate] = useState('');
  const [nextHearingDate, setNextHearingDate] = useState('');
  const [representationStatus, setRepresentationStatus] = useState('');
  const [primaryGoals, setPrimaryGoals] = useState<string[]>([]);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      navigate('/');
      return;
    }
    setCurrentUser(user);
    
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
      setCaseStage(user.profile.caseStage || '');
      setCaseNumber(user.profile.caseNumber || '');
      setFilingDate(user.profile.filingDate || '');
      setServiceDate(user.profile.serviceDate || '');
      setNextHearingDate(user.profile.nextHearingDate || '');
      setRepresentationStatus(user.profile.representationStatus || '');
      setPrimaryGoals(user.profile.primaryGoals || []);
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
      caseStage: caseStage || undefined,
      caseNumber: caseNumber || undefined,
      filingDate: filingDate || undefined,
      serviceDate: serviceDate || undefined,
      nextHearingDate: nextHearingDate || undefined,
      representationStatus: representationStatus || undefined,
      primaryGoals: primaryGoals.length ? primaryGoals : undefined,
    };
    
    await authService.updateProfile(currentUser.id, profile);
    
    // Update local user state
    const updatedUser = authService.getCurrentUser();
    setCurrentUser(updatedUser);
    
    setIsLoading(false);
    setSuccessMessage('Profile saved successfully!');
    
    setTimeout(() => setSuccessMessage(''), 3000);
  };


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
            Manage your account details and saved preferences
          </p>
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-1 rounded-xl border border-white/80 bg-white/72 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <TabsTrigger value="profile" className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white">
              <UserIcon className="h-4 w-4 mr-2" />
              Profile
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

                  {/* Case Information */}
                  <div className="space-y-4 border-t border-slate-200 pt-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">Case information</h3>
                      <p className="text-sm text-slate-500">Only the details that help Maria give better case-specific guidance.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="caseStage">Case Stage</Label>
                        <select
                          id="caseStage"
                          value={caseStage}
                          onChange={(e) => setCaseStage(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="">Select case stage</option>
                          {CASE_STAGES.map((stage) => (
                            <option key={stage} value={stage}>{stage}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="caseNumber">Case Number</Label>
                        <Input
                          id="caseNumber"
                          value={caseNumber}
                          onChange={(e) => setCaseNumber(e.target.value)}
                          placeholder="e.g., 24FL000123"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="filingDate">Filing Date</Label>
                        <Input id="filingDate" type="date" value={filingDate} onChange={(e) => setFilingDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="serviceDate">Service Date</Label>
                        <Input id="serviceDate" type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nextHearingDate">Next Hearing Date</Label>
                        <Input id="nextHearingDate" type="date" value={nextHearingDate} onChange={(e) => setNextHearingDate(e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="representationStatus">Representation Status</Label>
                      <select
                        id="representationStatus"
                        value={representationStatus}
                        onChange={(e) => setRepresentationStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select representation status</option>
                        {REPRESENTATION_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Top Goals</Label>
                      <div className="grid gap-2 md:grid-cols-2">
                        {PRIMARY_GOALS.map((goal) => {
                          const checked = primaryGoals.includes(goal);
                          return (
                            <label key={goal} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setPrimaryGoals((prev) =>
                                    checked ? prev.filter((item) => item !== goal) : [...prev, goal]
                                  )
                                }
                              />
                              <span>{goal}</span>
                            </label>
                          );
                        })}
                      </div>
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
        </Tabs>
      </div>
    </div>
  );
}
