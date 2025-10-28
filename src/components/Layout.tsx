import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  FileText, 
  LogOut,
  Beef,
  TrendingUp,
  UserCircle,
  BarChart3,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const getNavigation = (userRole: 'admin' | 'staff') => {
  const baseNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Invoices', href: '/invoices', icon: FileText },
    { name: 'Expenses', href: '/expenses', icon: DollarSign },
    { name: 'Sales', href: '/sales', icon: TrendingUp },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
  ];

  // Only admins can see Staff management
  if (userRole === 'admin') {
    baseNavigation.push({ name: 'Staff', href: '/staff', icon: Users });
  }

  baseNavigation.push({ name: 'Profile', href: '/profile', icon: UserCircle });

  return baseNavigation;
};

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { sessionDB } = await import('@/lib/database');
      const currentUser = sessionDB.get();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    const { sessionDB } = await import('@/lib/database');
    sessionDB.clear();
    toast.success('Logged out');
    navigate('/');
  };

  const navigation = user ? getNavigation(user.role) : [];

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-sidebar-border bg-sidebar">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
            <Beef className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-sidebar-foreground">MeatMaster Pro</span>
        </div>

        {/* User Info */}
        {user && (
          <div className="border-b border-sidebar-border px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <UserCircle className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate">
                  {user.name}
                </p>
                <Badge 
                  variant={user.role === 'admin' ? 'default' : 'secondary'} 
                  className="text-xs"
                >
                  {user.role}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-base ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-sidebar-border p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
};
