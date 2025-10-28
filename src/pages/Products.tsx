import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Package, Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { productsDB, type Product } from '@/lib/database';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [productName, setProductName] = useState('');
  const [unitType, setUnitType] = useState<'Carton' | 'Kg' | 'Piece'>('Kg');
  const [quantity, setQuantity] = useState('');

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editUnitType, setEditUnitType] = useState<'Carton' | 'Kg' | 'Piece'>('Kg');
  const [editStock, setEditStock] = useState('');

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  useEffect(() => {
    // Load products from localStorage
    loadProducts();
  }, []);

  const loadProducts = () => {
    const allProducts = productsDB.getAll();
    setProducts(allProducts);
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productName.trim() || !quantity || parseFloat(quantity) <= 0) {
      toast.error('Please fill all fields with valid values');
      return;
    }

    setLoading(true);

    try {
      const qty = parseFloat(quantity);
      const existingProduct = products.find(
        (p) => p.name.trim().toLowerCase() === productName.trim().toLowerCase() && p.unitType === unitType
      );

      if (existingProduct) {
        // Product exists - add to stock
        productsDB.addStock(existingProduct.id, qty);
        toast.success(`Added ${quantity} ${unitType} to ${productName}`);
      } else {
        // New product - create
        productsDB.create({
          name: productName.trim(),
          unitType,
          currentStock: qty,
        });
        toast.success(`New product "${productName}" created`);
      }

      // Reload products from database
      loadProducts();

      // Reset form
      setProductName('');
      setQuantity('');
      setUnitType('Kg');
    } catch (error) {
      toast.error('Failed to add stock');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit click
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditUnitType(product.unitType);
    setEditStock(product.currentStock.toString());
    setEditDialogOpen(true);
  };

  // Handle update
  const handleUpdate = () => {
    if (!editingProduct || !editName.trim() || !editStock || parseFloat(editStock) < 0) {
      toast.error('Please fill all fields with valid values');
      return;
    }

    productsDB.update(editingProduct.id, {
      name: editName.trim(),
      unitType: editUnitType,
      currentStock: parseFloat(editStock),
    });

    toast.success('Product updated successfully');
    loadProducts();
    setEditDialogOpen(false);
    setEditingProduct(null);
  };

  // Handle delete click
  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDelete = () => {
    if (productToDelete) {
      productsDB.delete(productToDelete.id);
      toast.success('Product deleted successfully');
      loadProducts();
    }
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  // Handle out of stock
  const handleOutOfStock = (product: Product) => {
    productsDB.update(product.id, {
      currentStock: 0,
    });
    toast.success(`${product.name} marked as out of stock`);
    loadProducts();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2">
          <Package className="h-8 w-8 text-primary" />
          Products & Stock Management
        </h1>
        <p className="mt-2 text-muted-foreground">
          Add new purchases and track your inventory
        </p>
      </div>

      {/* Add Stock Form */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Purchase / Stock
          </CardTitle>
          <CardDescription>
            Enter product details to add stock. If the product exists, quantity will be added to current stock.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddStock} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  placeholder="e.g., Chicken Breast"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unitType">Unit Type</Label>
                <Select value={unitType} onValueChange={(value: any) => setUnitType(value)}>
                  <SelectTrigger id="unitType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="Carton">Carton</SelectItem>
                    <SelectItem value="Kg">Kg</SelectItem>
                    <SelectItem value="Piece">Piece</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? 'Adding...' : 'Add Stock'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Current Inventory</CardTitle>
          <CardDescription>
            All products in your stock with current quantities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No products yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Add your first product using the form above
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Unit Type</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.unitType}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {product.currentStock} {product.unitType}
                      </TableCell>
                      <TableCell>
                        {product.currentStock === 0 ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Out of Stock
                          </Badge>
                        ) : product.currentStock < 5 ? (
                          <Badge variant="outline" className="gap-1 border-warning text-warning">
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-success text-success">
                            In Stock
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(product)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {product.currentStock > 0 && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleOutOfStock(product)}
                              className="h-8 w-8"
                            >
                              <AlertTriangle className="h-4 w-4 text-warning" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteClick(product)}
                            className="h-8 w-8"
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

      {/* Edit Product Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Product Name</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g., Chicken Breast"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editUnitType">Unit Type</Label>
              <Select value={editUnitType} onValueChange={(value: any) => setEditUnitType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Carton">Carton</SelectItem>
                  <SelectItem value="Kg">Kg</SelectItem>
                  <SelectItem value="Piece">Piece</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editStock">Current Stock</Label>
              <Input
                id="editStock"
                type="number"
                step="0.01"
                min="0"
                value={editStock}
                onChange={(e) => setEditStock(e.target.value)}
                placeholder="0.00"
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{productToDelete?.name}</strong> from your inventory.
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
