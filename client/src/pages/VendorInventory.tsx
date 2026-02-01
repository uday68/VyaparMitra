import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import { useProducts } from '../hooks/use-products';
import { useInventoryAnalytics, useInventoryAlerts } from '../hooks/use-analytics';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Input } from '../components/ui/input';
import { 
  Search, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Plus,
  Edit,
  Eye,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  unit: string;
  category: string;
  image?: string;
  status: 'active' | 'inactive' | 'low_stock' | 'out_of_stock';
  lastUpdated: string;
  salesVelocity?: number;
  reorderLevel?: number;
}

export default function VendorInventory() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [filterBy, setFilterBy] = useState('all');

  // Fetch data
  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useProducts();
  const { data: inventoryAnalytics, isLoading: analyticsLoading } = useInventoryAnalytics(user?.id || '');
  const { data: inventoryAlerts } = useInventoryAlerts(user?.id || '');

  // Process products data
  const processedProducts = React.useMemo(() => {
    if (!products) return [];
    
    return products.map(product => ({
      id: product.id.toString(),
      name: product.name,
      price: parseFloat(product.base_price || '0'),
      stock: product.stock_quantity || 0,
      unit: product.unit || 'piece',
      category: product.category || 'Other',
      image: product.images || undefined,
      status: getProductStatus(product.stock_quantity || 0, (product as any).reorder_level || 10),
      lastUpdated: new Date(product.updated_at || Date.now()).toLocaleDateString(),
      reorderLevel: (product as any).reorder_level || 10
    }));
  }, [products]);

  function getProductStatus(stock: number, reorderLevel: number): Product['status'] {
    if (stock === 0) return 'out_of_stock';
    if (stock <= reorderLevel) return 'low_stock';
    return 'active';
  }

  // Filter and sort products
  const filteredProducts = React.useMemo(() => {
    let filtered = processedProducts;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Status filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(product => product.status === filterBy);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'stock':
          return b.stock - a.stock;
        case 'price':
          return b.price - a.price;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [processedProducts, searchQuery, selectedCategory, filterBy, sortBy]);

  // Get unique categories
  const categories = React.useMemo(() => {
    const cats = [...new Set(processedProducts.map(p => p.category))];
    return ['all', ...cats];
  }, [processedProducts]);

  // Quick stats
  const quickStats = React.useMemo(() => {
    const totalProducts = processedProducts.length;
    const lowStockCount = processedProducts.filter(p => p.status === 'low_stock').length;
    const outOfStockCount = processedProducts.filter(p => p.status === 'out_of_stock').length;
    const totalValue = processedProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);

    return {
      totalProducts,
      lowStockCount,
      outOfStockCount,
      totalValue,
      activeProducts: totalProducts - outOfStockCount
    };
  }, [processedProducts]);

  const handleEditProduct = (productId: string) => {
    setLocation(`/edit-product/${productId}`);
  };

  const handleViewProduct = (productId: string) => {
    setLocation(`/product/${productId}`);
  };

  const getStatusColor = (status: Product['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Product['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'low_stock':
        return <AlertTriangle className="h-4 w-4" />;
      case 'out_of_stock':
        return <XCircle className="h-4 w-4" />;
      case 'inactive':
        return <Clock className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  if (productsLoading || analyticsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pb-20">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600">Manage your products and stock levels</p>
          </div>
          <Button onClick={() => setLocation('/add-product')} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold">{quickStats.totalProducts}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Low Stock</p>
                  <p className="text-2xl font-bold text-yellow-600">{quickStats.lowStockCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-600">{quickStats.outOfStockCount}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold">₹{quickStats.totalValue.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {inventoryAlerts && inventoryAlerts.length > 0 && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              You have {inventoryAlerts.length} inventory alerts that need attention.
            </AlertDescription>
          </Alert>
        )}

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>

                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="name">Sort by Name</option>
                  <option value="stock">Sort by Stock</option>
                  <option value="price">Sort by Price</option>
                  <option value="status">Sort by Status</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Products ({filteredProducts.length})</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchProducts()}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No products found</p>
                <Button 
                  onClick={() => setLocation('/add-product')}
                  className="mt-4"
                >
                  Add Your First Product
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          {product.image ? (
                            <img 
                              src={product.image} 
                              alt={product.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{product.name}</h3>
                            <Badge className={`text-xs ${getStatusColor(product.status)}`}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(product.status)}
                                {product.status.replace('_', ' ')}
                              </span>
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>₹{product.price}/{product.unit}</span>
                            <span>Stock: {product.stock} {product.unit}s</span>
                            <span>Category: {product.category}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewProduct(product.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProduct(product.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <BottomNav currentPage="inventory" />
    </div>
  );
}