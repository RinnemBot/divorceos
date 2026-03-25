import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
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

  if (!currentUser) {
    return null;
  }

  const planInfo = SUBSCRIPTION_LIMITS[currentUser.subscription];
  const remainingChats = planInfo.maxChats === Infinity 
    ? 'Unlimited' 
    : Math.max(0, planInfo.maxChats - currentUser.chatCount);

  return (
    <div className="min-h-screen bg-slate-50 py-12">
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
            Manage your account and divorce case information
          </p>
        </div>

        {/* Account Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-blue-600" />
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
                  <Sparkles className="h-4 w-4 text-blue-500" />
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
              <Save className="h-5 w-5 text-blue-600" />
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
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
          <Card className="mt-6 bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Upgrade Your Plan</h3>
                  <p className="text-blue-100 text-sm mt-1">
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
      </div>
    </div>
  );
}
