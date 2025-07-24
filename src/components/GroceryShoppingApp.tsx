import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, ShoppingCart, Route, DollarSign, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface Store {
  id: string;
  name: string;
  address: string;
  distance: number;
  items: { [itemId: string]: { price: number; available: boolean } };
}

interface ShoppingRoute {
  stores: Store[];
  totalCost: number;
  totalDistance: number;
  savings: number;
}

const GroceryShoppingApp = () => {
  const [groceryList, setGroceryList] = useState<GroceryItem[]>([]);
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, unit: 'pcs' });
  const [radius, setRadius] = useState(5);
  const [maxStores, setMaxStores] = useState(3);
  const [route, setRoute] = useState<ShoppingRoute | null>(null);
  const { toast } = useToast();

  // Sample store data - in a real app, this would come from APIs
  const sampleStores: Store[] = [
    {
      id: '1',
      name: 'SuperMart',
      address: '123 Main St',
      distance: 2.1,
      items: {
        'milk': { price: 3.99, available: true },
        'bread': { price: 2.49, available: true },
        'eggs': { price: 4.29, available: true },
        'apples': { price: 1.99, available: true },
      }
    },
    {
      id: '2',
      name: 'Fresh Foods',
      address: '456 Oak Ave',
      distance: 3.2,
      items: {
        'milk': { price: 4.19, available: true },
        'bread': { price: 2.99, available: true },
        'eggs': { price: 3.89, available: true },
        'apples': { price: 1.79, available: true },
      }
    },
    {
      id: '3',
      name: 'Budget Grocers',
      address: '789 Pine Rd',
      distance: 4.8,
      items: {
        'milk': { price: 3.49, available: true },
        'bread': { price: 1.99, available: true },
        'eggs': { price: 3.99, available: true },
        'apples': { price: 2.19, available: true },
      }
    }
  ];

  const addItem = () => {
    if (!newItem.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter an item name",
        variant: "destructive"
      });
      return;
    }

    const item: GroceryItem = {
      id: Date.now().toString(),
      name: newItem.name.toLowerCase(),
      quantity: newItem.quantity,
      unit: newItem.unit
    };

    setGroceryList([...groceryList, item]);
    setNewItem({ name: '', quantity: 1, unit: 'pcs' });
  };

  const removeItem = (id: string) => {
    setGroceryList(groceryList.filter(item => item.id !== id));
  };

  const optimizeRoute = () => {
    if (groceryList.length === 0) {
      toast({
        title: "Error",
        description: "Please add items to your grocery list first",
        variant: "destructive"
      });
      return;
    }

    // Simple optimization algorithm - find cheapest combination of stores
    const availableStores = sampleStores.filter(store => store.distance <= radius);
    
    if (availableStores.length === 0) {
      toast({
        title: "No stores found",
        description: "No stores found within the specified radius",
        variant: "destructive"
      });
      return;
    }

    // For each item, find the cheapest store
    const itemStoreMaps: { [itemName: string]: { store: Store; price: number }[] } = {};
    
    groceryList.forEach(item => {
      itemStoreMaps[item.name] = [];
      availableStores.forEach(store => {
        if (store.items[item.name]?.available) {
          itemStoreMaps[item.name].push({
            store,
            price: store.items[item.name].price * item.quantity
          });
        }
      });
      // Sort by price
      itemStoreMaps[item.name].sort((a, b) => a.price - b.price);
    });

    // Greedy approach: start with cheapest options, group by stores
    const storeItemMap: { [storeId: string]: { store: Store; items: string[]; cost: number } } = {};
    let totalCost = 0;

    groceryList.forEach(item => {
      const cheapestOptions = itemStoreMaps[item.name];
      if (cheapestOptions.length > 0) {
        const cheapest = cheapestOptions[0];
        if (!storeItemMap[cheapest.store.id]) {
          storeItemMap[cheapest.store.id] = {
            store: cheapest.store,
            items: [],
            cost: 0
          };
        }
        storeItemMap[cheapest.store.id].items.push(`${item.quantity} ${item.unit} ${item.name}`);
        storeItemMap[cheapest.store.id].cost += cheapest.price;
        totalCost += cheapest.price;
      }
    });

    const routeStores = Object.values(storeItemMap)
      .sort((a, b) => a.store.distance - b.store.distance)
      .slice(0, maxStores);

    const totalDistance = routeStores.reduce((sum, s) => sum + s.store.distance, 0);
    
    // Calculate savings compared to shopping at the most expensive single store
    const expensiveStoreCost = groceryList.reduce((sum, item) => {
      const maxPrice = Math.max(...availableStores
        .filter(s => s.items[item.name]?.available)
        .map(s => s.items[item.name].price));
      return sum + (maxPrice * item.quantity);
    }, 0);

    setRoute({
      stores: routeStores.map(s => s.store),
      totalCost,
      totalDistance,
      savings: expensiveStoreCost - totalCost
    });

    toast({
      title: "Route optimized!",
      description: `Found route visiting ${routeStores.length} stores`,
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2 text-primary">Smart Grocery Shopping</h1>
        <p className="text-muted-foreground">Optimize your shopping route to save money and time</p>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Grocery List
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="route" className="flex items-center gap-2">
            <Route className="w-4 h-4" />
            Route
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Items to Your List</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="item-name">Item Name</Label>
                  <Input
                    id="item-name"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="e.g., milk, bread, apples"
                    onKeyPress={(e) => e.key === 'Enter' && addItem()}
                  />
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={addItem} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Grocery List ({groceryList.length} items)</CardTitle>
            </CardHeader>
            <CardContent>
              {groceryList.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No items in your list yet. Add some items above!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {groceryList.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">{item.quantity} {item.unit} {item.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shopping Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="radius">Search Radius (miles)</Label>
                  <Input
                    id="radius"
                    type="number"
                    min="1"
                    max="25"
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value) || 5)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">Maximum distance to search for stores</p>
                </div>
                <div>
                  <Label htmlFor="max-stores">Maximum Stores</Label>
                  <Input
                    id="max-stores"
                    type="number"
                    min="1"
                    max="10"
                    value={maxStores}
                    onChange={(e) => setMaxStores(parseInt(e.target.value) || 3)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">Limit the number of stores to visit</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="route" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Optimized Shopping Route</h2>
            <Button onClick={optimizeRoute} size="lg" className="flex items-center gap-2">
              <Route className="w-4 h-4" />
              Optimize Route
            </Button>
          </div>

          {route ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Route Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">{route.stores.length}</div>
                      <div className="text-sm text-muted-foreground">Stores</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">${route.totalCost.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">Total Cost</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">${route.savings.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">Savings</div>
                    </div>
                  </CardContent>
                </Card>

                {route.stores.map((store, index) => (
                  <Card key={store.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        {store.name}
                      </CardTitle>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {store.address} • {store.distance} miles
                      </p>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Cost Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Cost:</span>
                      <span className="font-medium">${route.totalCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Savings:</span>
                      <span className="font-medium">${route.savings.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Total Distance:</span>
                      <span>{route.totalDistance.toFixed(1)} miles</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Route className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Route Generated</h3>
                <p className="text-muted-foreground mb-4">Add items to your grocery list and click "Optimize Route" to get started.</p>
                <Button onClick={optimizeRoute} disabled={groceryList.length === 0}>
                  Generate Route
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GroceryShoppingApp;