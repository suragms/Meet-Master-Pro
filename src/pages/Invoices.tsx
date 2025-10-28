import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FileText, Plus, Trash2, Eye, Receipt, Download, Printer, Beef, FileDown, CreditCard, CheckCircle } from 'lucide-react';
import { invoicesDB, productsDB, customersDB, paymentsDB, companySettingsDB, type Invoice, type Product, type Customer, type PaymentRecord } from '@/lib/database';

interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitType: string;
  price: number;
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  
  // Filter state
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  
  // Create invoice state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('none');
  const [companyName, setCompanyName] = useState('MeatMaster Pro');
  const [companyLogo, setCompanyLogo] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');

  // View invoice state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  // Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'cheque' | 'online'>('cash');
  const [transactionId, setTransactionId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  
  // Payment success dialog state
  const [paymentSuccessDialogOpen, setPaymentSuccessDialogOpen] = useState(false);
  const [paidInvoiceId, setPaidInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    generateInvoiceNumber();
    loadCompanySettings();
  }, []);

  const loadData = () => {
    setInvoices(invoicesDB.getAll());
    setProducts(productsDB.getAll());
    setCustomers(customersDB.getAll());
  };

  const loadCompanySettings = () => {
    const settings = companySettingsDB.get();
    if (settings) {
      setCompanyName(settings.companyName);
      setCompanyLogo(settings.companyLogo || '');
    }
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setInvoiceNumber(`INV-${year}${month}${day}-${random}`);
  };

  const handleAddItem = () => {
    if (!selectedProduct || !quantity || !price) {
      toast.error('Please fill all fields');
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const qty = parseFloat(quantity);
    
    // Check if there's enough stock
    if (product.currentStock < qty) {
      toast.error(`Insufficient stock! Available: ${product.currentStock} ${product.unitType}`);
      return;
    }

    const newItem: InvoiceItem = {
      productId: product.id,
      productName: product.name,
      quantity: qty,
      unitType: product.unitType,
      price: parseFloat(price),
    };

    setInvoiceItems([...invoiceItems, newItem]);
    toast.success(`Added ${qty} ${product.unitType} of ${product.name} (Stock remaining: ${product.currentStock - qty})`);
    setSelectedProduct('');
    setQuantity('');
    setPrice('');
  };

  const handleRemoveItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim() || invoiceItems.length === 0) {
      toast.error('Please enter company name and add items');
      return;
    }

    const total = invoiceItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    setLoading(true);

    try {
      // Get customer info if selected (check if not "none")
      const customerId = selectedCustomer && selectedCustomer !== 'none' ? selectedCustomer : undefined;
      const selectedCustomerData = customerId ? customersDB.getById(customerId) : null;
      
      // Create invoice with 'sent' status initially (will be 'paid' after payment)
      const newInvoice = invoicesDB.create({
        customerId: customerId,
        customerName: selectedCustomerData?.name || undefined,
        companyName: companyName.trim(),
        companyLogo: companyLogo.trim() || undefined,
        items: invoiceItems,
        total,
        status: 'sent',
        invoiceNumber,
      });

      // Deduct stock for each item sold
      const deductedItems: string[] = [];
      invoiceItems.forEach(item => {
        const product = productsDB.getById(item.productId);
        if (product) {
          const newStock = product.currentStock - item.quantity;
          if (newStock >= 0) {
            productsDB.update(product.id, { currentStock: newStock });
            deductedItems.push(`${product.name} (${item.quantity} ${product.unitType})`);
          } else {
            toast.warning(`${product.name} has insufficient stock (Available: ${product.currentStock})`);
          }
        }
      });

      if (deductedItems.length > 0) {
        toast.success(`Invoice created! Stock updated for ${deductedItems.length} item(s)`);
      } else {
        toast.success('Invoice created successfully');
      }
      
      loadData();
      setCreateDialogOpen(false);
      
      // Open payment dialog
      setCreatedInvoiceId(newInvoice.id);
      setPaymentDialogOpen(true);
    } catch (error) {
      toast.error('Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (invoice: Invoice) => {
    setViewingInvoice(invoice);
    setViewDialogOpen(true);
  };

  const handleDeleteClick = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (invoiceToDelete) {
      invoicesDB.delete(invoiceToDelete.id);
      toast.success('Invoice deleted successfully');
      loadData();
    }
    setDeleteDialogOpen(false);
    setInvoiceToDelete(null);
  };

  const handleRecordPayment = async () => {
    if (!createdInvoiceId) return;

    try {
      const invoice = invoicesDB.getById(createdInvoiceId);
      if (!invoice) {
        toast.error('Invoice not found');
        return;
      }

      // Record payment
      paymentsDB.create({
        invoiceId: createdInvoiceId,
        customerId: invoice.customerId,
        amount: invoice.total,
        paymentMethod: paymentMethod,
        transactionId: transactionId.trim() || undefined,
        notes: paymentNotes.trim() || undefined,
      });

      // Show success message
      toast.success(
        `Payment Done!`,
        {
          description: `AED ${invoice.total.toFixed(2)} received via ${paymentMethod.toUpperCase()}`,
          duration: 5000,
        }
      );
      
      loadData();
      setPaymentDialogOpen(false);
      setPaymentSuccessDialogOpen(true);
      setPaidInvoiceId(createdInvoiceId);
      setCreatedInvoiceId(null);
      setTransactionId('');
      setPaymentNotes('');
      setPaymentMethod('cash');
    } catch (error) {
      toast.error('Failed to record payment');
    }
  };

  const handlePrintInvoiceAfterPayment = async () => {
    if (!paidInvoiceId) return;
    const invoice = invoicesDB.getById(paidInvoiceId);
    if (!invoice) return;

    setViewingInvoice(invoice);
    setViewDialogOpen(true);
    
    // Wait for dialog to render, then print
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleDownloadInvoiceAfterPayment = async () => {
    if (!paidInvoiceId) return;
    const invoice = invoicesDB.getById(paidInvoiceId);
    if (!invoice) return;

    setViewingInvoice(invoice);
    setViewDialogOpen(true);
    
    // Wait for dialog to open, then generate PDF
    setTimeout(async () => {
      await handleDownloadPDF();
      setPaymentSuccessDialogOpen(false);
    }, 300);
  };

  const handleSharePDF = () => {
    const invoiceData = JSON.stringify(viewingInvoice, null, 2);
    const blob = new Blob([invoiceData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${viewingInvoice?.invoiceNumber || 'invoice'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Invoice backup downloaded');
  };

  const handleDownloadPDF = async () => {
    if (!viewingInvoice || !printRef.current) return;

    try {
      // Import html2pdf library dynamically
      const html2pdf = (await import('html2pdf.js')).default;
      
      // Get the invoice element
      const element = printRef.current;
      
      // Configure PDF options
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `invoice-${viewingInvoice.invoiceNumber || 'invoice'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' 
        }
      };

      // Generate and download PDF
      await html2pdf().set(opt).from(element).save();
      toast.success('Invoice PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    setViewingInvoice(invoice);
    setViewDialogOpen(true);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handlePrintReceipt = async (invoice: Invoice) => {
    setViewingInvoice(invoice);
    setViewDialogOpen(true);
    
    // Wait for dialog to render, then print
    setTimeout(async () => {
      // Try to use the browser's print dialog
      window.print();
    }, 300);
  };

  const getTotal = () => {
    return invoiceItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const getFilteredInvoices = () => {
    if (customerFilter === 'all') return invoices;
    if (customerFilter === 'no-customer') return invoices.filter(inv => !inv.customerId);
    return invoices.filter(inv => inv.customerId === customerFilter);
  };

  const filteredInvoices = getFilteredInvoices();

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form when closing
      setSelectedCustomer('none');
      setCompanyName('MeatMaster Pro');
      setInvoiceItems([]);
      setSelectedProduct('');
      setQuantity('');
      setPrice('');
      generateInvoiceNumber();
    }
    setCreateDialogOpen(open);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Billing & Invoices
          </h1>
          <p className="mt-2 text-muted-foreground">
            Create and manage your invoices
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      {/* Customer Summary Cards */}
      {customers.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
              <p className="text-xs text-muted-foreground">Active customers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Linked Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {invoices.filter(inv => inv.customerId).length}
              </div>
              <p className="text-xs text-muted-foreground">With customer assignment</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Generic Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {invoices.filter(inv => !inv.customerId).length}
              </div>
              <p className="text-xs text-muted-foreground">Without customer link</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invoices Table */}
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Invoices</CardTitle>
              <CardDescription>
                View and manage your invoices
              </CardDescription>
            </div>
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Invoices</SelectItem>
                <SelectItem value="no-customer">Generic Invoices</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="py-12 text-center">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No invoices found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {customerFilter === 'all' 
                  ? 'Create your first invoice to get started'
                  : 'No invoices match this filter'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Company/Name</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => {
                    const customer = invoice.customerId ? customers.find(c => c.id === invoice.customerId) : null;
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber || invoice.id.slice(0, 8)}</TableCell>
                        <TableCell>
                          {customer ? (
                            <div>
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-xs text-muted-foreground">{customer.phone}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Generic Invoice</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{invoice.companyName}</TableCell>
                        <TableCell>{invoice.items.length} item(s)</TableCell>
                        <TableCell className="text-right font-semibold">
                          AED {invoice.total.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {new Date(invoice.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={invoice.status === 'paid' ? 'default' : 'outline'}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleView(invoice)}
                              className="h-8 w-8"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={async () => {
                                setViewingInvoice(invoice);
                                setViewDialogOpen(true);
                                setTimeout(async () => {
                                  await handleDownloadPDF();
                                }, 300);
                              }}
                              className="h-8 w-8"
                              title="Download PDF"
                            >
                              <FileDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handlePrintReceipt(invoice)}
                              className="h-8 w-8"
                              title="Print Receipt"
                            >
                              <Receipt className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteClick(invoice)}
                              className="h-8 w-8"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Invoice Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>
              Add company details and items to create an invoice
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateInvoice} className="space-y-4 py-4">
            {customers.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="customerSelect">Select Customer (Optional)</Label>
                <Select value={selectedCustomer} onValueChange={(value) => {
                  setSelectedCustomer(value);
                  const customer = customers.find(c => c.id === value);
                  if (customer) {
                    setCompanyName(customer.name);
                  } else if (value === 'none') {
                    setCompanyName('MeatMaster Pro');
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Customer (Generic Invoice)</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Linking invoices to customers helps track billing copies
                </p>
              </div>
            )}
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="INV-20241201-001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Customer/Biller Name *</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Customer Name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyLogo">Company Logo (Default: MeatMaster Pro Logo)</Label>
              <div className="flex gap-3 items-end">
                <Input
                  id="companyLogo"
                  value={companyLogo}
                  onChange={(e) => setCompanyLogo(e.target.value)}
                  placeholder="https://example.com/logo.png or leave empty for default"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCompanyLogo('')}
                  className="mb-0"
                >
                  Reset to Default
                </Button>
              </div>
              {!companyLogo && (
                <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                    <Beef className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Default MeatMaster Pro Logo</p>
                    <p className="text-xs text-muted-foreground">Professional branding will be used</p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="mb-3 font-semibold">Add Items</h3>
              <div className="grid gap-3 md:grid-cols-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="product">Product (Stock Available)</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.unitType}) - Stock: {product.currentStock}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedProduct && products.find(p => p.id === selectedProduct) && (
                    <p className="text-xs text-muted-foreground">
                      Available stock: {products.find(p => p.id === selectedProduct)?.currentStock} {products.find(p => p.id === selectedProduct)?.unitType}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qty">Quantity</Label>
                  <Input
                    id="qty"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedProduct ? products.find(p => p.id === selectedProduct)?.currentStock : undefined}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0.00"
                  />
                  {selectedProduct && quantity && products.find(p => p.id === selectedProduct) && 
                    parseFloat(quantity) > (products.find(p => p.id === selectedProduct)?.currentStock || 0) && (
                    <p className="text-xs text-destructive">Quantity exceeds available stock!</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (AED)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="mt-3 w-full"
                onClick={handleAddItem}
              >
                Add Item
              </Button>
            </div>

            {invoiceItems.length > 0 && (
              <div className="rounded-lg border">
                <div className="border-b p-3 font-semibold">Invoice Items</div>
                <div className="divide-y">
                  {invoiceItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3">
                      <div className="flex-1">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} {item.unitType} × AED {item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="mr-4 font-semibold">
                        AED {(item.quantity * item.price).toFixed(2)}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="border-t p-3 text-right font-bold text-lg">
                  Total: AED {getTotal().toFixed(2)}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Invoice'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View/Print Invoice Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Invoice Details</span>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => window.print()}
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Print Receipt
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPDF}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSharePDF}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Backup
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          {viewingInvoice && (
            <div ref={printRef} className="receipt-container">
              {/* Professional Receipt Header */}
              <div className="receipt-header">
                {viewingInvoice.companyLogo ? (
                  <div className="logo-container">
                    <img 
                      src={viewingInvoice.companyLogo} 
                      alt="Company Logo" 
                      className="company-logo"
                    />
                  </div>
                ) : (
                  <div className="logo-container">
                    <div className="default-logo">
                      <Beef className="logo-icon" />
                    </div>
                  </div>
                )}
                <h1 className="company-name">{viewingInvoice.companyName}</h1>
                <div className="receipt-title">INVOICE</div>
                <div className="invoice-info">
                  <span className="invoice-label">Invoice #:</span>
                  <span className="invoice-value">{viewingInvoice.invoiceNumber}</span>
                </div>
              </div>

              {/* Receipt Details Section */}
              <div className="receipt-details">
                <div className="detail-row">
                  <div className="detail-item">
                    <span className="detail-label">Date</span>
                    <span className="detail-value">{new Date(viewingInvoice.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Time</span>
                    <span className="detail-value">{new Date(viewingInvoice.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                <div className="detail-row">
                  <div className="detail-item full-width">
                    <span className="detail-label">Status</span>
                    <span className="detail-value status-badge">{viewingInvoice.status.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div className="items-section">
                <div className="section-title">ITEMS</div>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th className="col-item">Description</th>
                      <th className="col-unit">Unit</th>
                      <th className="col-qty">Qty</th>
                      <th className="col-price">Price</th>
                      <th className="col-total">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingInvoice.items.map((item, index) => (
                      <tr key={index}>
                        <td className="col-item">{item.productName}</td>
                        <td className="col-unit">{item.unitType}</td>
                        <td className="col-qty">{item.quantity}</td>
                        <td className="col-price">AED {item.price.toFixed(2)}</td>
                        <td className="col-total">AED {(item.quantity * item.price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Section */}
              <div className="total-section">
                <div className="total-row">
                  <span className="total-label">SUBTOTAL</span>
                  <span className="total-value">AED {viewingInvoice.total.toFixed(2)}</span>
                </div>
                <div className="total-row">
                  <span className="total-label">TAX</span>
                  <span className="total-value">AED 0.00</span>
                </div>
                <div className="total-row final-total">
                  <span className="total-label">GRAND TOTAL</span>
                  <span className="total-value">AED {viewingInvoice.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="receipt-footer">
                <div className="footer-line">━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
                <p className="footer-thanks">Thank you for your business!</p>
                <div className="footer-meta">
                  <p>Generated: {new Date(viewingInvoice.createdAt).toLocaleString()}</p>
                  <p>This is an automated receipt from MeatMaster Pro</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Recording Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-primary" />
              Record Payment
            </DialogTitle>
            <DialogDescription>
              Record the payment received for the invoice
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {createdInvoiceId && (() => {
              const invoice = invoicesDB.getById(createdInvoiceId);
              if (!invoice) return null;
              
              return (
                <>
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Invoice Total</p>
                        <p className="text-3xl font-bold">AED {invoice.total.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground mt-1">Invoice #: {invoice.invoiceNumber}</p>
                      </div>
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <CheckCircle className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method *</Label>
                    <Select value={paymentMethod} onValueChange={(value: 'cash' | 'cheque' | 'online') => setPaymentMethod(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="online">Online Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {paymentMethod !== 'cash' && (
                    <div className="space-y-2">
                      <Label htmlFor="transactionId">Transaction/Reference Number</Label>
                      <Input
                        id="transactionId"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Enter transaction or cheque number"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="paymentNotes">Notes (Optional)</Label>
                    <Textarea
                      id="paymentNotes"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="Add any additional notes..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      This payment will be recorded and linked to the invoice. The invoice status will be updated to "Paid".
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setPaymentDialogOpen(false);
                setCreatedInvoiceId(null);
                toast.info('Payment recording cancelled. You can record it later from the invoice.');
              }}
            >
              Skip for Now
            </Button>
            <Button onClick={handleRecordPayment} className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Success Dialog */}
      <Dialog open={paymentSuccessDialogOpen} onOpenChange={setPaymentSuccessDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Payment Recorded Successfully!
            </DialogTitle>
            <DialogDescription>
              Your payment has been recorded. You can now print or share the invoice.
            </DialogDescription>
          </DialogHeader>
          
          {paidInvoiceId && (() => {
            const invoice = invoicesDB.getById(paidInvoiceId);
            if (!invoice) return null;
            
            return (
              <div className="space-y-4 py-4">
                <div className="rounded-lg border bg-green-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600">
                      <Receipt className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Invoice Details</p>
                      <p className="text-lg font-semibold">{invoice.invoiceNumber}</p>
                      <p className="text-2xl font-bold text-green-600">
                        AED {invoice.total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">What would you like to do next?</h3>
                  
                  <div className="grid gap-3">
                    <Button
                      onClick={handlePrintInvoiceAfterPayment}
                      variant="outline"
                      className="w-full justify-start h-auto py-3"
                    >
                      <Printer className="mr-2 h-5 w-5" />
                      <div className="text-left">
                        <div className="font-semibold">Print Invoice</div>
                        <div className="text-xs text-muted-foreground">Send to printer</div>
                      </div>
                    </Button>

                    <Button
                      onClick={handleDownloadInvoiceAfterPayment}
                      variant="outline"
                      className="w-full justify-start h-auto py-3"
                    >
                      <FileDown className="mr-2 h-5 w-5" />
                      <div className="text-left">
                        <div className="font-semibold">Download PDF</div>
                        <div className="text-xs text-muted-foreground">Save as PDF file</div>
                      </div>
                    </Button>

                    <Button
                      onClick={() => {
                        handleView(invoice);
                        setPaymentSuccessDialogOpen(false);
                      }}
                      variant="outline"
                      className="w-full justify-start h-auto py-3"
                    >
                      <Eye className="mr-2 h-5 w-5" />
                      <div className="text-left">
                        <div className="font-semibold">View Details</div>
                        <div className="text-xs text-muted-foreground">View full invoice</div>
                      </div>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPaymentSuccessDialogOpen(false);
                setPaidInvoiceId(null);
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this invoice. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style>{`
        /* Professional Receipt Container */
        .receipt-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px;
          background: white;
          font-family: 'Courier New', monospace;
        }

        /* Receipt Header */
        .receipt-header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #000;
        }

        .logo-container {
          margin-bottom: 15px;
        }

        .company-logo {
          height: 80px;
          margin: 0 auto;
        }

        .default-logo {
          width: 80px;
          height: 80px;
          margin: 0 auto;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .logo-icon {
          width: 48px;
          height: 48px;
          color: white;
        }

        .company-name {
          font-size: 28px;
          font-weight: bold;
          margin: 15px 0 10px 0;
          letter-spacing: 2px;
          color: #000;
        }

        .receipt-title {
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 3px;
          color: #666;
          margin-bottom: 10px;
        }

        .invoice-info {
          font-size: 14px;
          color: #333;
        }

        .invoice-label {
          font-weight: bold;
          margin-right: 5px;
        }

        .invoice-value {
          font-family: monospace;
        }

        /* Receipt Details */
        .receipt-details {
          margin: 25px 0;
          padding: 15px 0;
          border-top: 1px solid #ddd;
          border-bottom: 1px solid #ddd;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .detail-item {
          flex: 1;
        }

        .detail-item.full-width {
          flex: 1;
        }

        .detail-label {
          font-size: 12px;
          color: #666;
          display: block;
          margin-bottom: 3px;
          font-weight: 600;
        }

        .detail-value {
          font-size: 14px;
          color: #000;
          display: block;
          font-weight: bold;
        }

        .status-badge {
          background: #000;
          color: white;
          padding: 4px 12px;
          font-size: 12px;
          letter-spacing: 1px;
        }

        /* Items Section */
        .items-section {
          margin: 30px 0;
        }

        .section-title {
          font-size: 16px;
          font-weight: bold;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 15px;
          color: #333;
          border-bottom: 2px solid #000;
          padding-bottom: 5px;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }

        .items-table thead {
          background: #f8f9fa;
          border-bottom: 2px solid #000;
        }

        .items-table th {
          padding: 12px 8px;
          text-align: left;
          font-size: 12px;
          font-weight: bold;
          letter-spacing: 0.5px;
          color: #333;
        }

        .items-table td {
          padding: 10px 8px;
          border-bottom: 1px solid #e0e0e0;
          font-size: 13px;
          color: #000;
        }

        .col-item { width: 35%; }
        .col-unit { width: 15%; text-align: center; }
        .col-qty { width: 15%; text-align: right; }
        .col-price { width: 20%; text-align: right; }
        .col-total { width: 15%; text-align: right; font-weight: bold; }

        /* Total Section */
        .total-section {
          margin-top: 25px;
          padding-top: 20px;
          border-top: 3px solid #000;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
        }

        .total-label {
          font-weight: 600;
          color: #333;
        }

        .total-value {
          font-weight: bold;
          color: #000;
        }

        .final-total {
          font-size: 18px;
          padding: 15px 0;
          border-top: 2px solid #000;
          margin-top: 10px;
        }

        .final-total .total-label,
        .final-total .total-value {
          font-size: 20px;
          font-weight: bold;
        }

        /* Receipt Footer */
        .receipt-footer {
          margin-top: 40px;
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #ddd;
        }

        .footer-line {
          color: #ccc;
          font-family: monospace;
          margin-bottom: 15px;
        }

        .footer-thanks {
          font-size: 16px;
          font-weight: bold;
          margin: 20px 0 15px 0;
          color: #000;
        }

        .footer-meta {
          font-size: 11px;
          color: #666;
          line-height: 1.6;
        }

        /* Print Styles */
        @media print {
          @page {
            size: A4;
            margin: 0;
          }

          body * {
            visibility: hidden;
          }

          .receipt-container,
          .receipt-container * {
            visibility: visible;
          }

          .receipt-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20mm;
          }

          /* Ensure all colors print properly */
          * {
            color: #000 !important;
            background: white !important;
          }

          .default-logo {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          }

          .status-badge {
            background: #000 !important;
            color: white !important;
          }

          .items-table thead {
            background: #f8f9fa !important;
          }
        }

        /* Screen display adjustments */
        @media screen {
          .receipt-container {
            background: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
          }
        }
      `}</style>
    </div>
  );
}