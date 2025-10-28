import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Users, Plus, Edit, Trash2, DollarSign, Receipt, ChevronDown, ChevronUp, FileText, Eye, Download } from 'lucide-react';
import { customersDB, ledgerDB, invoicesDB, type Customer, type LedgerEntry, type Invoice } from '@/lib/database';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [selectedCustomerForLedger, setSelectedCustomerForLedger] = useState<Customer | null>(null);
  
  // Add dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Ledger entry dialog state
  const [ledgerDialogOpen, setLedgerDialogOpen] = useState(false);
  const [entryType, setEntryType] = useState<'credit' | 'debit'>('credit');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryDescription, setEntryDescription] = useState('');

  // View ledger dialog state
  const [viewLedgerDialogOpen, setViewLedgerDialogOpen] = useState(false);
  const [viewingLedgerEntries, setViewingLedgerEntries] = useState<LedgerEntry[]>([]);

  // View invoices dialog state
  const [viewInvoicesDialogOpen, setViewInvoicesDialogOpen] = useState(false);
  const [selectedCustomerForInvoices, setSelectedCustomerForInvoices] = useState<Customer | null>(null);
  const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    loadCustomers();
    loadLedgerEntries();
  }, []);

  const loadCustomers = () => {
    const allCustomers = customersDB.getAll();
    setCustomers(allCustomers);
  };

  const loadLedgerEntries = () => {
    const allEntries = ledgerDB.getAll();
    setLedgerEntries(allEntries);
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !phone.trim() || !address.trim()) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);

    try {
      customersDB.create({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        balance: 0,
      });
      
      toast.success('Customer added successfully');
      loadCustomers();
      setAddDialogOpen(false);
      setName('');
      setPhone('');
      setAddress('');
    } catch (error) {
      toast.error('Failed to add customer');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditName(customer.name);
    setEditPhone(customer.phone);
    setEditAddress(customer.address);
    setEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingCustomer || !editName.trim() || !editPhone.trim() || !editAddress.trim()) {
      toast.error('Please fill all fields');
      return;
    }

    customersDB.update(editingCustomer.id, {
      name: editName.trim(),
      phone: editPhone.trim(),
      address: editAddress.trim(),
    });

    toast.success('Customer updated successfully');
    loadCustomers();
    setEditDialogOpen(false);
    setEditingCustomer(null);
  };

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (customerToDelete) {
      customersDB.delete(customerToDelete.id);
      toast.success('Customer deleted successfully');
      loadCustomers();
    }
    setDeleteDialogOpen(false);
    setCustomerToDelete(null);
  };

  const handleOpenLedgerDialog = (customer: Customer) => {
    setSelectedCustomerForLedger(customer);
    setEntryType('credit');
    setEntryAmount('');
    setEntryDescription('');
    setLedgerDialogOpen(true);
  };

  const handleAddLedgerEntry = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomerForLedger || !entryAmount || !entryDescription.trim()) {
      toast.error('Please fill all fields');
      return;
    }

    const amount = parseFloat(entryAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      ledgerDB.create({
        customerId: selectedCustomerForLedger.id,
        type: entryType,
        amount,
        description: entryDescription.trim(),
      });

      toast.success(`Ledger entry added successfully`);
      loadCustomers();
      loadLedgerEntries();
      setLedgerDialogOpen(false);
      setSelectedCustomerForLedger(null);
    } catch (error) {
      toast.error('Failed to add ledger entry');
    }
  };

  const handleViewLedger = (customer: Customer) => {
    const entries = ledgerDB.getByCustomer(customer.id);
    setViewingLedgerEntries(entries);
    setViewLedgerDialogOpen(true);
  };

  const handleViewInvoices = (customer: Customer) => {
    const invoices = invoicesDB.getByCustomerId(customer.id);
    setCustomerInvoices(invoices);
    setSelectedCustomerForInvoices(customer);
    setViewInvoicesDialogOpen(true);
  };

  const handleDeleteLedgerEntry = (entry: LedgerEntry) => {
    ledgerDB.delete(entry.id);
    toast.success('Ledger entry deleted successfully');
    loadCustomers();
    loadLedgerEntries();
    
    // Update the viewing entries if dialog is open
    if (viewingLedgerEntries.length > 0 && viewingLedgerEntries[0].customerId === entry.customerId) {
      const updated = ledgerDB.getByCustomer(entry.customerId);
      setViewingLedgerEntries(updated);
    }
  };

  const formatBalance = (balance: number) => {
    const formatted = Math.abs(balance).toFixed(2);
    if (balance >= 0) {
      return `AED ${formatted}`;
    } else {
      return `-AED ${formatted}`;
    }
  };

  const getBalanceBadgeVariant = (balance: number) => {
    if (balance > 0) return 'destructive';
    if (balance < 0) return 'default';
    return 'secondary';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Customers & Ledger
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage customers, balances, and statements
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Customers Table */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>
            View and manage customer information and balances
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No customers yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Add your first customer using the button above
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.address}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={getBalanceBadgeVariant(customer.balance)}>
                          {formatBalance(customer.balance)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewLedger(customer)}
                            title="View Ledger"
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Ledger
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenLedgerDialog(customer)}
                            title="Add Transaction"
                          >
                            <DollarSign className="mr-2 h-4 w-4" />
                            Transaction
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewInvoices(customer)}
                            title="View Billing Copies"
                          >
                            <Receipt className="mr-2 h-4 w-4" />
                            Billing
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(customer)}
                            className="h-8 w-8"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteClick(customer)}
                            className="h-8 w-8"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Customer Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
            <DialogDescription>
              Add a new customer to your database
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCustomer} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+971 50 123 4567"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main Street, Dubai"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Customer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update customer information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Name</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPhone">Phone</Label>
              <Input
                id="editPhone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+971 50 123 4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAddress">Address</Label>
              <Input
                id="editAddress"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                placeholder="123 Main Street, Dubai"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Ledger Entry Dialog */}
      <Dialog open={ledgerDialogOpen} onOpenChange={setLedgerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Ledger Entry</DialogTitle>
            <DialogDescription>
              {selectedCustomerForLedger && (
                <>Record a transaction for <strong>{selectedCustomerForLedger.name}</strong></>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddLedgerEntry} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="entryType">Transaction Type</Label>
              <Select value={entryType} onValueChange={(value: 'credit' | 'debit') => setEntryType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Credit (Sale/Invoice)</SelectItem>
                  <SelectItem value="debit">Debit (Payment)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {entryType === 'credit' 
                  ? 'Credit increases what the customer owes (adds to balance)'
                  : 'Debit decreases what the customer owes (subtracts from balance)'}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="entryAmount">Amount (AED)</Label>
              <Input
                id="entryAmount"
                type="number"
                step="0.01"
                min="0.01"
                value={entryAmount}
                onChange={(e) => setEntryAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entryDescription">Description</Label>
              <Textarea
                id="entryDescription"
                value={entryDescription}
                onChange={(e) => setEntryDescription(e.target.value)}
                placeholder="Enter transaction description..."
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLedgerDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add Entry
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Ledger Dialog */}
      <Dialog open={viewLedgerDialogOpen} onOpenChange={setViewLedgerDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Ledger Statement</DialogTitle>
            <DialogDescription>
              View all transactions and balance history
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {viewingLedgerEntries.length === 0 ? (
              <div className="py-12 text-center">
                <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No transactions yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Start adding transactions to build the ledger history
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewingLedgerEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{new Date(entry.createdAt).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={entry.type === 'credit' ? 'destructive' : 'default'}>
                            {entry.type === 'credit' ? 'Credit' : 'Debit'}
                          </Badge>
                        </TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {entry.type === 'credit' ? '+' : '-'}AED {entry.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteLedgerEntry(entry)}
                            className="h-8 w-8"
                            title="Delete Entry"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* View Invoices Dialog */}
      <Dialog open={viewInvoicesDialogOpen} onOpenChange={setViewInvoicesDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Billing Copies</DialogTitle>
            <DialogDescription>
              {selectedCustomerForInvoices && `All invoices for ${selectedCustomerForInvoices.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {customerInvoices.length === 0 ? (
              <div className="py-12 text-center">
                <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No invoices yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  This customer has no billing records
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{new Date(invoice.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{invoice.items.length} item(s)</TableCell>
                        <TableCell className="text-right font-semibold">
                          AED {invoice.total.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={invoice.status === 'paid' ? 'default' : 'outline'}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{customerToDelete?.name}</strong> from your database.
              This action cannot be undone.
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
    </div>
  );
}