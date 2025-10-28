import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Package, 
  BarChart3, 
  Receipt,
  Calendar,
  Download,
  Printer,
  FileDown,
  TrendingDown,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { 
  invoicesDB, 
  customersDB, 
  productsDB, 
  ledgerDB,
  expensesDB,
  paymentsDB,
  getStatistics,
  type Invoice,
  type Customer,
  type LedgerEntry,
  type Expense
} from '@/lib/database';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('sales');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [ledgers, setLedgers] = useState<LedgerEntry[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [statementDialogOpen, setStatementDialogOpen] = useState(false);
  const [selectedCustomerForStatement, setSelectedCustomerForStatement] = useState<Customer | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setInvoices(invoicesDB.getAll());
    setCustomers(customersDB.getAll());
    setProducts(productsDB.getAll());
    setLedgers(ledgerDB.getAll());
    setExpenses(expensesDB.getAll());
  };

  const getFilteredInvoices = () => {
    let filtered = invoices;
    const now = new Date();
    
    switch (dateRange) {
      case 'today':
        filtered = invoices.filter(inv => {
          const invDate = new Date(inv.createdAt);
          return invDate.toDateString() === now.toDateString();
        });
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = invoices.filter(inv => new Date(inv.createdAt) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = invoices.filter(inv => new Date(inv.createdAt) >= monthAgo);
        break;
    }
    
    return filtered;
  };

  const calculateRevenue = () => {
    const filtered = getFilteredInvoices();
    return filtered.reduce((sum, inv) => sum + inv.total, 0);
  };

  const calculateStats = () => {
    const filtered = getFilteredInvoices();
    return {
      totalSales: filtered.length,
      totalRevenue: calculateRevenue(),
      averageOrder: filtered.length > 0 ? calculateRevenue() / filtered.length : 0,
      topProduct: getTopProduct(filtered),
    };
  };

  const getTopProduct = (invoiceList: Invoice[]) => {
    const productMap = new Map<string, number>();
    
    invoiceList.forEach(inv => {
      inv.items.forEach(item => {
        const key = item.productName;
        productMap.set(key, (productMap.get(key) || 0) + item.quantity);
      });
    });
    
    let topProduct = { name: 'N/A', sales: 0 };
    productMap.forEach((sales, name) => {
      if (sales > topProduct.sales) {
        topProduct = { name, sales };
      }
    });
    
    return topProduct;
  };

  const calculateCustomerStats = () => {
    const filtered = getFilteredInvoices();
    const customerMap = new Map<string, { name: string; total: number; count: number }>();
    
    filtered.forEach(inv => {
      const key = inv.companyName;
      const existing = customerMap.get(key) || { name: key, total: 0, count: 0 };
      customerMap.set(key, {
        name: existing.name,
        total: existing.total + inv.total,
        count: existing.count + 1,
      });
    });
    
    return Array.from(customerMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  };

  const generateCustomerStatement = (customer: Customer) => {
    const entries = ledgerDB.getByCustomer(customer.id);
    
    let runningBalance = 0;
    const statement = entries.map(entry => {
      runningBalance += entry.type === 'credit' ? entry.amount : -entry.amount;
      return {
        ...entry,
        runningBalance,
      };
    });
    
    return statement;
  };

  const handleGenerateStatement = (customer: Customer) => {
    setSelectedCustomerForStatement(customer);
    setStatementDialogOpen(true);
  };

  const handleDownloadStatement = () => {
    if (!selectedCustomerForStatement) return;
    
    const statement = generateCustomerStatement(selectedCustomerForStatement);
    const statementData = {
      customer: selectedCustomerForStatement,
      statement: statement,
      generated: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(statementData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `statement-${selectedCustomerForStatement.name}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Statement downloaded successfully');
  };

  const handlePrintStatement = () => {
    window.print();
  };

  const stats = calculateStats();
  const customerStats = calculateCustomerStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Reports & Statements
          </h1>
          <p className="mt-2 text-muted-foreground">
            Generate detailed reports and customer statements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="sales">
            <TrendingUp className="mr-2 h-4 w-4" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="profit">
            <DollarSign className="mr-2 h-4 w-4" />
            Profit
          </TabsTrigger>
          <TabsTrigger value="pending">
            <AlertCircle className="mr-2 h-4 w-4" />
            Pending
          </TabsTrigger>
          <TabsTrigger value="stock">
            <Package className="mr-2 h-4 w-4" />
            Stock
          </TabsTrigger>
          <TabsTrigger value="expenses">
            <TrendingDown className="mr-2 h-4 w-4" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="customers">
            <Users className="mr-2 h-4 w-4" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="ledger">
            <Receipt className="mr-2 h-4 w-4" />
            Ledger
          </TabsTrigger>
          <TabsTrigger value="statements">
            <FileText className="mr-2 h-4 w-4" />
            Statements
          </TabsTrigger>
        </TabsList>

        {/* Sales Report */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <Receipt className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSales}</div>
                <p className="text-xs text-muted-foreground">invoices</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-5 w-5 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">AED {stats.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">total income</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Order</CardTitle>
                <BarChart3 className="h-5 w-5 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">AED {stats.averageOrder.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">per invoice</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Product</CardTitle>
                <Package className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.topProduct.name}</div>
                <p className="text-xs text-muted-foreground">{stats.topProduct.sales} units</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>
                Detailed revenue breakdown for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredInvoices().map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{new Date(invoice.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{invoice.companyName}</TableCell>
                        <TableCell>{invoice.items.length} items</TableCell>
                        <TableCell className="text-right font-semibold">
                          AED {invoice.total.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profit Report */}
        <TabsContent value="profit" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-5 w-5 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">AED {stats.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">from sales</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingDown className="h-5 w-5 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  AED {expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">{expenses.length} expenses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <DollarSign className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  AED {(stats.totalRevenue - expenses.reduce((sum, e) => sum + e.amount, 0)).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">revenue - expenses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                <BarChart3 className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalRevenue > 0 
                    ? ((1 - (expenses.reduce((sum, e) => sum + e.amount, 0) / stats.totalRevenue)) * 100).toFixed(1)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">profit percentage</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss Summary</CardTitle>
              <CardDescription>
                Revenue vs Expenses analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Total Revenue</span>
                    <span className="text-lg font-bold text-green-600">
                      +AED {stats.totalRevenue.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Total Expenses</span>
                    <span className="text-lg font-bold text-red-600">
                      -AED {expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-base font-bold">Net Profit</span>
                    <span className="text-2xl font-bold text-primary">
                      AED {(stats.totalRevenue - expenses.reduce((sum, e) => sum + e.amount, 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Report */}
        <TabsContent value="pending" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                <AlertCircle className="h-5 w-5 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  AED {invoices.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + inv.total, 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {invoices.filter(inv => inv.status === 'sent').length} unpaid invoices
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Balance</CardTitle>
                <AlertCircle className="h-5 w-5 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  AED {customers.reduce((sum, c) => sum + Math.max(c.balance, 0), 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {customers.filter(c => c.balance > 0).length} customers with balance
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
                <Package className="h-5 w-5 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {products.filter(p => p.currentStock < 10).length}
                </div>
                <p className="text-xs text-muted-foreground">items need restocking</p>
              </CardContent>
            </Card>
          </div>

          {/* Pending Invoices */}
          <Card>
            <CardHeader>
              <CardTitle>Unpaid Invoices</CardTitle>
              <CardDescription>
                Invoices waiting for payment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.filter(inv => inv.status === 'sent').length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
                  <h3 className="mt-4 text-lg font-semibold">All Clear!</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    No pending invoices
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.filter(inv => inv.status === 'sent').map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                          <TableCell>{invoice.companyName}</TableCell>
                          <TableCell>{new Date(invoice.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right font-semibold">
                            AED {invoice.total.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-warning border-warning">
                              {invoice.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Balances */}
          {customers.filter(c => c.balance > 0).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Customers with Outstanding Balance</CardTitle>
                <CardDescription>
                  Customers who owe money
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers
                        .filter(c => c.balance > 0)
                        .sort((a, b) => b.balance - a.balance)
                        .slice(0, 10)
                        .map((customer) => (
                          <TableRow key={customer.id}>
                            <TableCell className="font-medium">{customer.name}</TableCell>
                            <TableCell>{customer.phone}</TableCell>
                            <TableCell className="text-right font-semibold text-destructive">
                              AED {customer.balance.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Stock Report */}
        <TabsContent value="stock" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products.length}</div>
                <p className="text-xs text-muted-foreground">inventory items</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Stock</CardTitle>
                <CheckCircle2 className="h-5 w-5 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {products.filter(p => p.currentStock > 0).length}
                </div>
                <p className="text-xs text-muted-foreground">available items</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                <AlertCircle className="h-5 w-5 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {products.filter(p => p.currentStock > 0 && p.currentStock < 10).length}
                </div>
                <p className="text-xs text-muted-foreground">need restocking</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                <AlertCircle className="h-5 w-5 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {products.filter(p => p.currentStock === 0).length}
                </div>
                <p className="text-xs text-muted-foreground">empty items</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Stock Overview</CardTitle>
              <CardDescription>
                Current inventory levels by product
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Unit Type</TableHead>
                      <TableHead className="text-right">Current Stock</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.unitType}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {product.currentStock}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              product.currentStock === 0 
                                ? 'destructive' 
                                : product.currentStock < 10 
                                ? 'outline' 
                                : 'default'
                            }
                          >
                            {product.currentStock === 0 
                              ? 'Out of Stock' 
                              : product.currentStock < 10 
                              ? 'Low Stock' 
                              : 'In Stock'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Report */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingDown className="h-5 w-5 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  AED {expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">{expenses.length} transactions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Expenses</CardTitle>
                <Calendar className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  AED {expensesDB.getToday().reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">{expensesDB.getToday().length} expenses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <Calendar className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  AED {expensesDB.getThisMonth().reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">{expensesDB.getThisMonth().length} expenses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Expense</CardTitle>
                <DollarSign className="h-5 w-5 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  AED {expenses.length > 0 ? (expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length).toFixed(2) : '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">per transaction</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Expenses */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Expenses</CardTitle>
              <CardDescription>
                Latest expense transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="py-12 text-center">
                  <TrendingDown className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No expenses yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Add expenses to see them here
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.slice(0, 10).map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{expense.category}</Badge>
                          </TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell className="text-right font-semibold text-destructive">
                            AED {expense.amount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expense Categories Breakdown */}
          {(() => {
            const categoryStats = new Map<string, number>();
            expenses.forEach(expense => {
              categoryStats.set(expense.category, (categoryStats.get(expense.category) || 0) + expense.amount);
            });
            const categoryArray = Array.from(categoryStats.entries())
              .map(([category, total]) => ({ category, total }))
              .sort((a, b) => b.total - a.total);

            if (categoryArray.length === 0) return null;

            return (
              <Card>
                <CardHeader>
                  <CardTitle>Expense Breakdown by Category</CardTitle>
                  <CardDescription>
                    Top expense categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoryArray.slice(0, 10).map((stat) => (
                      <div key={stat.category} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex-1">
                          <div className="font-medium">{stat.category}</div>
                          <div className="text-sm text-muted-foreground">
                            {expenses.filter(e => e.category === stat.category).length} expenses
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-destructive">AED {stat.total.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </TabsContent>

        {/* Customer Reports */}
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers by Revenue</CardTitle>
              <CardDescription>
                Customers ranked by total purchase amount
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-center">Orders</TableHead>
                      <TableHead className="text-right">Total Revenue</TableHead>
                      <TableHead className="text-right">Avg Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerStats.map((customer, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell className="text-center">{customer.count}</TableCell>
                        <TableCell className="text-right font-semibold">
                          AED {customer.total.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          AED {(customer.total / customer.count).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Customers</CardTitle>
              <CardDescription>
                View all customers and their account balances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.phone}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={customer.balance > 0 ? 'destructive' : 'default'}>
                            AED {Math.abs(customer.balance).toFixed(2)}
                            {customer.balance > 0 ? ' (Owed)' : ' (Credit)'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateStatement(customer)}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Statement
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Reports */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Overview</CardTitle>
              <CardDescription>
                Current stock levels and product information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Unit Type</TableHead>
                      <TableHead className="text-right">Current Stock</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.unitType}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {product.currentStock}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              product.currentStock === 0 
                                ? 'destructive' 
                                : product.currentStock < 5 
                                ? 'outline' 
                                : 'default'
                            }
                          >
                            {product.currentStock === 0 
                              ? 'Out of Stock' 
                              : product.currentStock < 5 
                              ? 'Low Stock' 
                              : 'In Stock'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ledger Reports */}
        <TabsContent value="ledger" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Complete Ledger Statement</CardTitle>
              <CardDescription>
                View all ledger entries across all customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgers
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((entry) => {
                        const customer = customers.find(c => c.id === entry.customerId);
                        return (
                          <TableRow key={entry.id}>
                            <TableCell>{new Date(entry.createdAt).toLocaleString()}</TableCell>
                            <TableCell className="font-medium">
                              {customer?.name || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={entry.type === 'credit' ? 'destructive' : 'default'}>
                                {entry.type === 'credit' ? 'Credit' : 'Debit'}
                              </Badge>
                            </TableCell>
                            <TableCell>{entry.description}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {entry.type === 'credit' ? '+' : '-'}AED {entry.amount.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  AED {ledgers
                    .filter(e => e.type === 'credit')
                    .reduce((sum, e) => sum + e.amount, 0)
                    .toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Sales/Invoices</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Debits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  AED {ledgers
                    .filter(e => e.type === 'debit')
                    .reduce((sum, e) => sum + e.amount, 0)
                    .toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Payments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  AED {Math.abs(ledgers
                    .filter(e => e.type === 'credit')
                    .reduce((sum, e) => sum + e.amount, 0) -
                    ledgers
                      .filter(e => e.type === 'debit')
                      .reduce((sum, e) => sum + e.amount, 0)
                  ).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Outstanding</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Customer Ledger Summary</CardTitle>
              <CardDescription>
                View ledger entries grouped by customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customers.map((customer) => {
                  const customerLedgers = ledgerDB.getByCustomer(customer.id);
                  if (customerLedgers.length === 0) return null;

                  return (
                    <Card key={customer.id} className="border">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">{customer.name}</CardTitle>
                            <CardDescription>{customer.phone}</CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              AED {Math.abs(customer.balance).toFixed(2)}
                            </div>
                            <Badge variant={customer.balance > 0 ? 'destructive' : 'default'}>
                              {customer.balance > 0 ? 'Owed' : 'Credit'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {customerLedgers.slice(0, 5).map((entry) => (
                                <TableRow key={entry.id}>
                                  <TableCell className="text-sm">
                                    {new Date(entry.createdAt).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={entry.type === 'credit' ? 'destructive' : 'default'} className="text-xs">
                                      {entry.type === 'credit' ? 'Credit' : 'Debit'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm">{entry.description}</TableCell>
                                  <TableCell className="text-right text-sm font-semibold">
                                    {entry.type === 'credit' ? '+' : '-'}AED {entry.amount.toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        {customerLedgers.length > 5 && (
                          <p className="mt-2 text-xs text-muted-foreground text-center">
                            Showing 5 of {customerLedgers.length} transactions
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statements */}
        <TabsContent value="statements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Account Statements</CardTitle>
              <CardDescription>
                Generate and view detailed customer account statements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.phone}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={customer.balance > 0 ? 'destructive' : 'default'}>
                            AED {Math.abs(customer.balance).toFixed(2)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateStatement(customer)}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Generate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Customer Statement Dialog */}
      <Dialog open={statementDialogOpen} onOpenChange={setStatementDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Customer Statement</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDownloadStatement}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrintStatement}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription>
              {selectedCustomerForStatement && `Statement for ${selectedCustomerForStatement.name}`}
            </DialogDescription>
          </DialogHeader>
          {selectedCustomerForStatement && (
            <div className="space-y-4 print-container">
              {/* Statement Header */}
              <div className="border-b pb-4">
                <h2 className="text-2xl font-bold">MeatMaster Pro</h2>
                <p className="text-muted-foreground">Customer Statement</p>
                <div className="mt-2 space-y-1">
                  <p><strong>Customer:</strong> {selectedCustomerForStatement.name}</p>
                  <p><strong>Phone:</strong> {selectedCustomerForStatement.phone}</p>
                  <p><strong>Address:</strong> {selectedCustomerForStatement.address}</p>
                  <p><strong>Statement Date:</strong> {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Current Balance */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Current Balance:</span>
                  <span className="text-2xl font-bold">
                    AED {Math.abs(selectedCustomerForStatement.balance).toFixed(2)}
                    <Badge variant={selectedCustomerForStatement.balance > 0 ? 'destructive' : 'default'} className="ml-2">
                      {selectedCustomerForStatement.balance > 0 ? 'Amount Owed' : 'Credit Balance'}
                    </Badge>
                  </span>
                </div>
              </div>

              {/* Transaction History */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Transaction History</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {generateCustomerStatement(selectedCustomerForStatement).map((entry, index) => (
                        <TableRow key={entry.id}>
                          <TableCell>{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={entry.type === 'credit' ? 'destructive' : 'default'}>
                              {entry.type === 'credit' ? 'Credit' : 'Debit'}
                            </Badge>
                          </TableCell>
                          <TableCell>{entry.description}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {entry.type === 'credit' ? '+' : '-'}AED {entry.amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            AED {entry.runningBalance.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t pt-4 text-sm text-muted-foreground">
                <p>This is a detailed statement of account transactions and balances.</p>
                <p>Generated on {new Date().toLocaleString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
