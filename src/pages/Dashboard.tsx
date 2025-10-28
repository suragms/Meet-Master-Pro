import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Users, FileText, TrendingUp, AlertTriangle, Plus, ArrowRight } from 'lucide-react';
import { productsDB, customersDB, invoicesDB, getStatistics } from '@/lib/database';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCustomers: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    const statistics = getStatistics();
    const products = productsDB.getAll();
    
    const lowStockCount = products.filter(p => p.currentStock > 0 && p.currentStock < 5).length;
    const outOfStockCount = products.filter(p => p.currentStock === 0).length;
    
    setStats({
      ...statistics,
      lowStockCount,
      outOfStockCount,
    });
  };

  const dashboardStats = [
    {
      title: 'Total Products',
      value: stats.totalProducts.toString(),
      icon: Package,
      description: 'Items in inventory',
      color: 'text-primary',
    },
    {
      title: 'Total Staff',
      value: stats.totalCustomers.toString(),
      icon: Users,
      description: 'Active staff members',
      color: 'text-accent',
    },
    {
      title: 'Total Invoices',
      value: stats.totalInvoices.toString(),
      icon: FileText,
      description: 'Invoices created',
      color: 'text-warning',
    },
    {
      title: 'Revenue',
      value: `AED ${stats.totalRevenue.toFixed(2)}`,
      icon: TrendingUp,
      description: 'Total sales',
      color: 'text-success',
    },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome to MeatMaster Pro - Your complete business management solution
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat) => (
          <Card key={stat.title} className="transition-base hover:shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stock Alerts */}
      {(stats.lowStockCount > 0 || stats.outOfStockCount > 0) && (
        <Card className="border-warning bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {stats.outOfStockCount > 0 && (
                <Badge variant="destructive" className="gap-2 p-3">
                  <AlertTriangle className="h-4 w-4" />
                  {stats.outOfStockCount} Product{stats.outOfStockCount > 1 ? 's' : ''} Out of Stock
                </Badge>
              )}
              {stats.lowStockCount > 0 && (
                <Badge variant="outline" className="gap-2 border-warning text-warning p-3">
                  <AlertTriangle className="h-4 w-4" />
                  {stats.lowStockCount} Product{stats.lowStockCount > 1 ? 's' : ''} Low Stock
                </Badge>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/products')}
                className="ml-auto"
              >
                View Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Quick Start Card */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <h3 className="mb-2 font-semibold">🎯 Getting Started</h3>
              <ol className="ml-4 list-decimal space-y-2 text-sm text-muted-foreground">
                <li>Add your first products in the Products section</li>
                <li>Create customer records in the Customers section</li>
                <li>Start creating invoices to track sales</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={() => navigate('/products')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Product
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={() => navigate('/customers')}
            >
              <Users className="mr-2 h-4 w-4" />
              Add New Customer
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={() => navigate('/invoices')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
