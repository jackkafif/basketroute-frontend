import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, ShoppingCart, Plus, X, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchStores, fetchProducts, optimizeShoppingRoute, type Store, type Product, type OptimizedRoute } from '@/services/api';

const GroceryShoppingApp = () => {
  const [items, setItems] = useState<string[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedStores, fetchedProducts] = await Promise.all([
          fetchStores(),
          fetchProducts()
        ]);
        setStores(fetchedStores);
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast({
          title: "Error",
          description: "Failed to load stores and products",
          variant: "destructive",
        });
      }
    };

    loadData();
  }, []);

  const addItem = () => {
    if (newItemName.trim() && !items.includes(newItemName.trim())) {
      const newItem = newItemName.trim();
      setItems([...items, newItem]);
      setNewItemName('');
      toast({
        title: "Item Added",
        description: `${newItem} added to your list`,
      });
    }
  };

  const removeItem = (index: number) => {
    const removedItem = items[index];
    setItems(items.filter((_, i) => i !== index));
    toast({
      title: "Item Removed",
      description: `${removedItem} removed from your list`,
    });
  };

  const handleStoreSelection = (storeName: string, checked: boolean) => {
    if (checked) {
      setSelectedStores([...selectedStores, storeName]);
    } else {
      setSelectedStores(selectedStores.filter(name => name !== storeName));
    }
  };

  const optimizeRoute = async () => {
    if (items.length === 0) {
      toast({
        title: "No Items",
        description: "Please add items to your grocery list first",
        variant: "destructive",
      });
      return;
    }

    if (selectedStores.length === 0) {
      toast({
        title: "No Stores Selected",
        description: "Please select at least one store",
        variant: "destructive",
      });
      return;
    }

    setIsOptimizing(true);
    try {
      const result = await optimizeShoppingRoute(items, selectedStores);
      setOptimizedRoute(result);
      toast({
        title: "Route Optimized",
        description: `Found optimal route with total cost $${result.Cost.toFixed(2)}`,
      });
    } catch (error) {
      console.error('Optimization failed:', error);
      toast({
        title: "Optimization Failed",
        description: "Could not optimize your shopping route. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2 text-primary">BasketRoute</h1>
        <p className="text-muted-foreground">Optimize your grocery shopping route to minimize cost</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grocery List */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Grocery List
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter item name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addItem()}
                />
                <Button onClick={addItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {items.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>{item}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Store Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {stores.map((store, index) => (
                  <div key={store.name || index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`store-${index}`}
                      checked={selectedStores.includes(store.name)}
                      onCheckedChange={(checked) => 
                        handleStoreSelection(store.name, checked as boolean)
                      }
                    />
                    <label 
                      htmlFor={`store-${index}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {store.name}
                      {store.address && ` - ${store.address}`}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={optimizeRoute} 
            className="w-full" 
            disabled={isOptimizing || items.length === 0 || selectedStores.length === 0}
          >
            {isOptimizing ? 'Optimizing...' : 'Optimize Shopping Route'}
          </Button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {optimizedRoute && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Optimized Shopping Route
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium">Total Cost: ${optimizedRoute.Cost.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {Object.entries(optimizedRoute.Plan).map(([storeName, storeItems], index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{storeName}</h4>
                        </div>
                        <div className="space-y-1">
                          {storeItems.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex justify-between text-sm">
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {!optimizedRoute && (
            <Card>
              <CardContent className="text-center py-12">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Route Generated</h3>
                <p className="text-muted-foreground">Add items to your grocery list, select stores, and click optimize to get started.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroceryShoppingApp;