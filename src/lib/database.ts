// LocalStorage-based database service
// Stores all data in browser's localStorage for persistence

export interface Product {
  id: string;
  name: string;
  unitType: 'Carton' | 'Kg' | 'Piece';
  currentStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  balance: number; // Current balance (positive = customer owes, negative = overpaid)
  createdAt: string;
  updatedAt: string;
}

export interface LedgerEntry {
  id: string;
  customerId: string;
  type: 'credit' | 'debit'; // credit = money added (sale), debit = payment received
  amount: number;
  description: string;
  invoiceId?: string; // Link to invoice if applicable
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  customerId?: string;
  amount: number;
  paymentMethod: 'cash' | 'cheque' | 'online';
  transactionId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  receipt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  customerId?: string; // Link to customer
  customerName?: string; // Customer display name
  companyName: string;
  companyLogo?: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitType: string;
    price: number;
  }[];
  total: number;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'sent' | 'paid';
  invoiceNumber: string;
}

export interface User {
  id: string;
  email: string;
  password: string; // In production, this should be hashed
  name: string;
  role: 'admin' | 'staff';
  createdAt: string;
  updatedAt: string;
}

export interface CompanySettings {
  id: string;
  companyName: string;
  companyLogo?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  updatedAt: string;
}

// Storage keys
const STORAGE_KEYS = {
  PRODUCTS: 'meatmaster_products',
  CUSTOMERS: 'meatmaster_customers',
  LEDGERS: 'meatmaster_ledgers',
  INVOICES: 'meatmaster_invoices',
  PAYMENTS: 'meatmaster_payments',
  EXPENSES: 'meatmaster_expenses',
  USERS: 'meatmaster_users',
  SESSION: 'meatmaster_session',
  COMPANY_SETTINGS: 'meatmaster_company_settings',
} as const;

// Helper function to get data from localStorage
function getData<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

// Helper function to save data to localStorage
function saveData<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// PRODUCTS
export const productsDB = {
  // Get all products
  getAll(): Product[] {
    return getData<Product>(STORAGE_KEYS.PRODUCTS);
  },

  // Get product by ID
  getById(id: string): Product | undefined {
    const products = this.getAll();
    return products.find(p => p.id === id);
  },

  // Search products by name
  search(query: string): Product[] {
    const products = this.getAll();
    const lowerQuery = query.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lowerQuery)
    );
  },

  // Add a new product
  create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const products = this.getAll();
    const newProduct: Product = {
      ...product,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    products.push(newProduct);
    saveData(STORAGE_KEYS.PRODUCTS, products);
    return newProduct;
  },

  // Update an existing product
  update(id: string, updates: Partial<Product>): Product | null {
    const products = this.getAll();
    const index = products.findIndex(p => p.id === id);
    
    if (index === -1) return null;
    
    products[index] = {
      ...products[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    saveData(STORAGE_KEYS.PRODUCTS, products);
    return products[index];
  },

  // Add stock to existing product
  addStock(id: string, quantity: number): Product | null {
    const product = this.getById(id);
    if (!product) return null;
    
    return this.update(id, {
      currentStock: product.currentStock + quantity,
    });
  },

  // Delete a product
  delete(id: string): boolean {
    const products = this.getAll();
    const filtered = products.filter(p => p.id !== id);
    
    if (filtered.length === products.length) {
      return false; // Product not found
    }
    
    saveData(STORAGE_KEYS.PRODUCTS, filtered);
    return true;
  },
};

// CUSTOMERS
export const customersDB = {
  // Get all customers
  getAll(): Customer[] {
    const customers = getData<Customer>(STORAGE_KEYS.CUSTOMERS);
    // Ensure all customers have balance property (for backward compatibility)
    return customers.map(c => ({
      ...c,
      balance: c.balance ?? 0,
    }));
  },

  // Get customer by ID
  getById(id: string): Customer | undefined {
    const customers = this.getAll();
    return customers.find(c => c.id === id);
  },

  // Search customers by name
  search(query: string): Customer[] {
    const customers = this.getAll();
    const lowerQuery = query.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) ||
      c.phone.includes(query)
    );
  },

  // Add a new customer
  create(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'balance'> & { balance?: number }): Customer {
    const customers = this.getAll();
    const newCustomer: Customer = {
      ...customer,
      balance: customer.balance || 0,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    customers.push(newCustomer);
    saveData(STORAGE_KEYS.CUSTOMERS, customers);
    return newCustomer;
  },

  // Update an existing customer
  update(id: string, updates: Partial<Customer>): Customer | null {
    const customers = this.getAll();
    const index = customers.findIndex(c => c.id === id);
    
    if (index === -1) return null;
    
    customers[index] = {
      ...customers[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    saveData(STORAGE_KEYS.CUSTOMERS, customers);
    return customers[index];
  },

  // Delete a customer
  delete(id: string): boolean {
    const customers = this.getAll();
    const filtered = customers.filter(c => c.id !== id);
    
    if (filtered.length === customers.length) {
      return false; // Customer not found
    }
    
    saveData(STORAGE_KEYS.CUSTOMERS, filtered);
    return true;
  },
};

// LEDGER
export const ledgerDB = {
  // Get all ledger entries
  getAll(): LedgerEntry[] {
    return getData<LedgerEntry>(STORAGE_KEYS.LEDGERS);
  },

  // Get ledger entries by customer
  getByCustomer(customerId: string): LedgerEntry[] {
    const ledgers = this.getAll();
    return ledgers.filter(l => l.customerId === customerId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  // Get ledger entry by ID
  getById(id: string): LedgerEntry | undefined {
    const ledgers = this.getAll();
    return ledgers.find(l => l.id === id);
  },

  // Add a new ledger entry and update customer balance
  create(entry: Omit<LedgerEntry, 'id' | 'createdAt' | 'updatedAt'>): LedgerEntry {
    const ledgers = this.getAll();
    const newEntry: LedgerEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    ledgers.push(newEntry);
    saveData(STORAGE_KEYS.LEDGERS, ledgers);

    // Update customer balance
    const customer = customersDB.getById(entry.customerId);
    if (customer) {
      const balanceChange = entry.type === 'credit' ? entry.amount : -entry.amount;
      customersDB.update(entry.customerId, {
        balance: customer.balance + balanceChange,
      });
    }

    return newEntry;
  },

  // Update ledger entry
  update(id: string, updates: Partial<LedgerEntry>): LedgerEntry | null {
    const ledgers = this.getAll();
    const index = ledgers.findIndex(l => l.id === id);
    
    if (index === -1) return null;
    
    const oldEntry = ledgers[index];
    ledgers[index] = {
      ...ledgers[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    saveData(STORAGE_KEYS.LEDGERS, ledgers);

    // Recalculate customer balance if amount or type changed
    if (updates.amount !== undefined || updates.type !== undefined) {
      const customer = customersDB.getById(ledgers[index].customerId);
      if (customer) {
        const oldBalanceChange = oldEntry.type === 'credit' ? oldEntry.amount : -oldEntry.amount;
        const newBalanceChange = ledgers[index].type === 'credit' ? ledgers[index].amount : -ledgers[index].amount;
        const balanceAdjustment = newBalanceChange - oldBalanceChange;
        
        customersDB.update(customer.id, {
          balance: customer.balance + balanceAdjustment,
        });
      }
    }
    
    return ledgers[index];
  },

  // Delete a ledger entry and update customer balance
  delete(id: string): boolean {
    const ledgers = this.getAll();
    const entry = ledgers.find(l => l.id === id);
    
    if (!entry) return false;
    
    const filtered = ledgers.filter(l => l.id !== id);
    saveData(STORAGE_KEYS.LEDGERS, filtered);

    // Update customer balance
    const customer = customersDB.getById(entry.customerId);
    if (customer) {
      const balanceChange = entry.type === 'credit' ? -entry.amount : entry.amount;
      customersDB.update(entry.customerId, {
        balance: customer.balance + balanceChange,
      });
    }
    
    return true;
  },
};

// INVOICES
export const invoicesDB = {
  // Get all invoices
  getAll(): Invoice[] {
    return getData<Invoice>(STORAGE_KEYS.INVOICES);
  },

  // Get invoice by ID
  getById(id: string): Invoice | undefined {
    const invoices = this.getAll();
    return invoices.find(i => i.id === id);
  },

  // Get invoices by company
  getByCompany(companyName: string): Invoice[] {
    const invoices = this.getAll();
    return invoices.filter(i => i.companyName === companyName);
  },

  // Get invoices by customer ID
  getByCustomerId(customerId: string): Invoice[] {
    const invoices = this.getAll();
    return invoices.filter(i => i.customerId === customerId);
  },

  // Add a new invoice
  create(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Invoice {
    const invoices = this.getAll();
    const newInvoice: Invoice = {
      ...invoice,
      invoiceNumber: invoice.invoiceNumber || `INV-${new Date().getTime()}`,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    invoices.push(newInvoice);
    saveData(STORAGE_KEYS.INVOICES, invoices);
    return newInvoice;
  },

  // Update an existing invoice
  update(id: string, updates: Partial<Invoice>): Invoice | null {
    const invoices = this.getAll();
    const index = invoices.findIndex(i => i.id === id);
    
    if (index === -1) return null;
    
    invoices[index] = {
      ...invoices[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    saveData(STORAGE_KEYS.INVOICES, invoices);
    return invoices[index];
  },

  // Delete an invoice
  delete(id: string): boolean {
    const invoices = this.getAll();
    const filtered = invoices.filter(i => i.id !== id);
    
    if (filtered.length === invoices.length) {
      return false; // Invoice not found
    }
    
    saveData(STORAGE_KEYS.INVOICES, filtered);
    return true;
  },
};

// PAYMENTS
export const paymentsDB = {
  // Get all payments
  getAll(): PaymentRecord[] {
    return getData<PaymentRecord>(STORAGE_KEYS.PAYMENTS);
  },

  // Get payment by ID
  getById(id: string): PaymentRecord | undefined {
    const payments = this.getAll();
    return payments.find(p => p.id === id);
  },

  // Get payments by invoice
  getByInvoice(invoiceId: string): PaymentRecord[] {
    const payments = this.getAll();
    return payments.filter(p => p.invoiceId === invoiceId);
  },

  // Get payments by customer
  getByCustomer(customerId: string): PaymentRecord[] {
    const payments = this.getAll();
    return payments.filter(p => p.customerId === customerId);
  },

  // Add a new payment
  create(payment: Omit<PaymentRecord, 'id' | 'createdAt' | 'updatedAt'>): PaymentRecord {
    const payments = this.getAll();
    const newPayment: PaymentRecord = {
      ...payment,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    payments.push(newPayment);
    saveData(STORAGE_KEYS.PAYMENTS, payments);

    // Update invoice status to 'paid'
    const invoice = invoicesDB.getById(payment.invoiceId);
    if (invoice) {
      invoicesDB.update(invoice.id, { status: 'paid' });
    }

    // Add to ledger as debit entry (payment received)
    if (payment.customerId) {
      ledgerDB.create({
        customerId: payment.customerId,
        type: 'debit',
        amount: payment.amount,
        description: `Payment received via ${payment.paymentMethod}${payment.notes ? ` - ${payment.notes}` : ''}`,
        invoiceId: payment.invoiceId,
      });
    }

    return newPayment;
  },

  // Update a payment
  update(id: string, updates: Partial<PaymentRecord>): PaymentRecord | null {
    const payments = this.getAll();
    const index = payments.findIndex(p => p.id === id);
    
    if (index === -1) return null;
    
    payments[index] = {
      ...payments[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    saveData(STORAGE_KEYS.PAYMENTS, payments);
    return payments[index];
  },

  // Delete a payment
  delete(id: string): boolean {
    const payments = this.getAll();
    const payment = payments.find(p => p.id === id);
    
    if (!payment) return false;
    
    const filtered = payments.filter(p => p.id !== id);
    saveData(STORAGE_KEYS.PAYMENTS, filtered);

    // Update invoice status back to 'sent'
    const invoice = invoicesDB.getById(payment.invoiceId);
    if (invoice) {
      invoicesDB.update(invoice.id, { status: 'sent' });
    }

    return true;
  },
};

// EXPENSES
export const expensesDB = {
  // Get all expenses
  getAll(): Expense[] {
    return getData<Expense>(STORAGE_KEYS.EXPENSES);
  },

  // Get expense by ID
  getById(id: string): Expense | undefined {
    const expenses = this.getAll();
    return expenses.find(e => e.id === id);
  },

  // Get expenses by category
  getByCategory(category: string): Expense[] {
    const expenses = this.getAll();
    return expenses.filter(e => e.category === category);
  },

  // Get expenses by date range
  getByDateRange(startDate: string, endDate: string): Expense[] {
    const expenses = this.getAll();
    return expenses.filter(e => {
      const expenseDate = new Date(e.date).getTime();
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      return expenseDate >= start && expenseDate <= end;
    });
  },

  // Get today's expenses
  getToday(): Expense[] {
    const today = new Date().toISOString().split('T')[0];
    return this.getByDateRange(today, today);
  },

  // Get this month's expenses
  getThisMonth(): Expense[] {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    return this.getByDateRange(startDate, endDate);
  },

  // Add a new expense
  create(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Expense {
    const expenses = this.getAll();
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expenses.push(newExpense);
    saveData(STORAGE_KEYS.EXPENSES, expenses);
    return newExpense;
  },

  // Update an expense
  update(id: string, updates: Partial<Expense>): Expense | null {
    const expenses = this.getAll();
    const index = expenses.findIndex(e => e.id === id);
    
    if (index === -1) return null;
    
    expenses[index] = {
      ...expenses[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    saveData(STORAGE_KEYS.EXPENSES, expenses);
    return expenses[index];
  },

  // Delete an expense
  delete(id: string): boolean {
    const expenses = this.getAll();
    const filtered = expenses.filter(e => e.id !== id);
    
    if (filtered.length === expenses.length) {
      return false;
    }
    
    saveData(STORAGE_KEYS.EXPENSES, filtered);
    return true;
  },
};

// USERS
export const usersDB = {
  // Get all users
  getAll(): User[] {
    return getData<User>(STORAGE_KEYS.USERS);
  },

  // Get user by ID
  getById(id: string): User | undefined {
    const users = this.getAll();
    return users.find(u => u.id === id);
  },

  // Get user by email
  getByEmail(email: string): User | undefined {
    const users = this.getAll();
    return users.find(u => u.email === email);
  },

  // Verify credentials
  verify(email: string, password: string): User | null {
    const user = this.getByEmail(email);
    if (!user || user.password !== password) {
      return null;
    }
    return user;
  },

  // Add a new user
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const users = this.getAll();
    
    // Check if email already exists
    if (this.getByEmail(user.email)) {
      throw new Error('Email already exists');
    }
    
    const newUser: User = {
      ...user,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.push(newUser);
    saveData(STORAGE_KEYS.USERS, users);
    return newUser;
  },

  // Update an existing user
  update(id: string, updates: Partial<User>): User | null {
    const users = this.getAll();
    const index = users.findIndex(u => u.id === id);
    
    if (index === -1) return null;
    
    users[index] = {
      ...users[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    saveData(STORAGE_KEYS.USERS, users);
    return users[index];
  },

  // Delete a user
  delete(id: string): boolean {
    const users = this.getAll();
    const filtered = users.filter(u => u.id !== id);
    
    if (filtered.length === users.length) {
      return false;
    }
    
    saveData(STORAGE_KEYS.USERS, filtered);
    return true;
  },
};

// COMPANY SETTINGS
export const companySettingsDB = {
  // Get company settings (single record)
  get(): CompanySettings | null {
    const settings = getData<CompanySettings>(STORAGE_KEYS.COMPANY_SETTINGS);
    return settings.length > 0 ? settings[0] : null;
  },

  // Initialize or update company settings
  set(settings: Omit<CompanySettings, 'id' | 'updatedAt'>): CompanySettings {
    const existingSettings = this.get();
    
    if (existingSettings) {
      // Update existing
      const updated: CompanySettings = {
        ...existingSettings,
        ...settings,
        updatedAt: new Date().toISOString(),
      };
      saveData(STORAGE_KEYS.COMPANY_SETTINGS, [updated]);
      return updated;
    } else {
      // Create new
      const newSettings: CompanySettings = {
        ...settings,
        id: crypto.randomUUID(),
        updatedAt: new Date().toISOString(),
      };
      saveData(STORAGE_KEYS.COMPANY_SETTINGS, [newSettings]);
      return newSettings;
    }
  },

  // Update specific fields
  update(updates: Partial<Omit<CompanySettings, 'id' | 'updatedAt'>>): CompanySettings | null {
    const existingSettings = this.get();
    
    if (!existingSettings) {
      return null;
    }
    
    const updated: CompanySettings = {
      ...existingSettings,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    saveData(STORAGE_KEYS.COMPANY_SETTINGS, [updated]);
    return updated;
  },

  // Clear all settings
  clear(): void {
    saveData(STORAGE_KEYS.COMPANY_SETTINGS, []);
  },
};

// SESSION MANAGEMENT
export const sessionDB = {
  get(): User | null {
    const session = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!session) return null;
    try {
      return JSON.parse(session);
    } catch {
      return null;
    }
  },

  set(user: User): void {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
  },

  clear(): void {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },

  isAuthenticated(): boolean {
    return this.get() !== null;
  },
};

// STATISTICS
export const getStatistics = () => {
  const products = productsDB.getAll();
  const customers = customersDB.getAll();
  const invoices = invoicesDB.getAll();
  
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
  
  return {
    totalProducts: products.length,
    totalCustomers: customers.length,
    totalInvoices: invoices.length,
    totalRevenue,
    // Auto-backup notice
    lastBackup: new Date().toISOString(),
  };
};

