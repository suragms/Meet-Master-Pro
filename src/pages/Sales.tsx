import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Eye, Receipt } from 'lucide-react';
import { invoicesDB, productsDB, getStatistics } from '@/lib/database';

export default function Sales() {
  const [invoices, setInvoices] = useState(invoicesDB.getAll());
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalItems: 0,
    averageOrder: 0,
  });

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = () => {
    const allInvoices = invoicesDB.getAll();
    setInvoices(allInvoices);
    
    const statistics = getStatistics();
    const totalItems = allInvoices.reduce((sum, inv) => sum + inv.items.length, 0);
    const averageOrder = allInvoices.length > 0 ? statistics.totalRevenue / allInvoices.length : 0;
    
    setStats({
      totalSales: allInvoices.length,
      totalRevenue: statistics.totalRevenue,
      totalItems,
      averageOrder,
    });
  };

  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setViewDialogOpen(true);
  };

  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-primary" />
          Sales Report
        </h1>
        <p className="mt-2 text-muted-foreground">
          Track your sales performance and transaction history
        </p>
      </div>

      {/* Sales Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <Receipt className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
            <p className="text-xs text-muted-foreground">invoices created</p>
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
            <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">total items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AED {stats.averageOrder.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">per invoice</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>
            Latest invoice transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentInvoices.length === 0 ? (
            <div className="py-12 text-center">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No sales yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Start creating invoices to see sales data
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                  <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        {invoice.invoiceNumber || invoice.id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="font-medium">{invoice.companyName}</TableCell>
                      <TableCell className="text-right">{invoice.items.length}</TableCell>
                      <TableCell className="text-right font-semibold">
                        AED {invoice.total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'outline'}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleViewInvoice(invoice)}
                          className="h-8 w-8"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Invoice Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              Invoice #{selectedInvoice?.invoiceNumber || selectedInvoice?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Invoice #</p>
                  <p className="font-semibold">{selectedInvoice.invoiceNumber || selectedInvoice.id.slice(0, 8)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="font-semibold">{selectedInvoice.companyName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge>{selectedInvoice.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p>{new Date(selectedInvoice.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="rounded-lg border">
                <div className="border-b p-3 font-semibold">Items</div>
                <div className="divide-y">
                  {selectedInvoice.items.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} {item.unitType} × AED {item.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-semibold">
                        AED {(item.quantity * item.price).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="border-t p-3 text-right font-bold text-lg">
                  Total: AED {selectedInvoice.total.toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
