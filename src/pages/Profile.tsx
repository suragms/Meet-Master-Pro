import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserCircle, Save, Upload, Building2 } from 'lucide-react';
import { usersDB, sessionDB, companySettingsDB, type User, type CompanySettings } from '@/lib/database';
import { Beef } from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Company settings state
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');

  useEffect(() => {
    loadProfile();
    loadCompanySettings();
  }, []);

  const loadProfile = () => {
    const currentUser = sessionDB.get();
    if (currentUser) {
      setUser(currentUser);
      setName(currentUser.name);
      setEmail(currentUser.email);
    }
  };

  const loadCompanySettings = () => {
    const settings = companySettingsDB.get();
    if (settings) {
      setCompanySettings(settings);
      setCompanyName(settings.companyName);
      setCompanyLogo(settings.companyLogo || '');
      setCompanyAddress(settings.companyAddress || '');
      setCompanyPhone(settings.companyPhone || '');
      setCompanyEmail(settings.companyEmail || '');
    } else {
      // Initialize with default values
      setCompanyName('MeatMaster Pro');
      setCompanyLogo('');
      setCompanyAddress('');
      setCompanyPhone('');
      setCompanyEmail('');
    }
  };

  const handleUpdateCompanySettings = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      const updatedSettings = companySettingsDB.set({
        companyName: companyName.trim(),
        companyLogo: companyLogo.trim() || undefined,
        companyAddress: companyAddress.trim() || undefined,
        companyPhone: companyPhone.trim() || undefined,
        companyEmail: companyEmail.trim() || undefined,
      });

      setCompanySettings(updatedSettings);
      toast.success('Company settings updated successfully');
    } catch (error) {
      toast.error('Failed to update company settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    setLoading(true);

    try {
      const updatedUser = usersDB.update(user.id, {
        name: name.trim(),
      });

      if (updatedUser) {
        sessionDB.set(updatedUser);
        toast.success('Profile updated successfully');
        loadProfile();
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill all password fields');
      return;
    }

    if (user.password !== currentPassword) {
      toast.error('Current password is incorrect');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const updatedUser = usersDB.update(user.id, {
        password: newPassword,
      });

      if (updatedUser) {
        sessionDB.set(updatedUser);
        toast.success('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error('Failed to change password');
      }
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2">
          <UserCircle className="h-8 w-8 text-primary" />
          Profile Settings
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage your account information
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <div>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Changing...' : 'Change Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Account Information */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your account details and statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="font-semibold">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-semibold">{new Date(user.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Settings */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Company Settings
          </CardTitle>
          <CardDescription>
            Manage your company information and branding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateCompanySettings} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your company name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyLogo">Company Logo URL</Label>
              <Input
                id="companyLogo"
                value={companyLogo}
                onChange={(e) => setCompanyLogo(e.target.value)}
                placeholder="https://example.com/logo.png"
                type="url"
              />
              <p className="text-xs text-muted-foreground">
                Enter a URL to your company logo image
              </p>
              {!companyLogo && (
                <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                    <Beef className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Default MeatMaster Pro Logo</p>
                    <p className="text-xs text-muted-foreground">Will be used if no logo is set</p>
                  </div>
                </div>
              )}
              {companyLogo && (
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground mb-2">Logo Preview:</p>
                  <img 
                    src={companyLogo} 
                    alt="Company Logo" 
                    className="h-16 w-auto object-contain rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      toast.error('Failed to load logo image');
                    }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyAddress">Company Address</Label>
              <Input
                id="companyAddress"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                placeholder="Your company address"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyPhone">Company Phone</Label>
                <Input
                  id="companyPhone"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  placeholder="+1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyEmail">Company Email</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  placeholder="contact@company.com"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Saving...' : 'Save Company Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
