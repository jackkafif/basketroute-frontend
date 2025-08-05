import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, ShoppingCart, Route, DollarSign, Plus, X, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiService, type GroceryItem, type Store, type OptimizeRouteResponse } from '@/services/api';
import { useGeolocation } from '@/hooks/useGeolocation';

const GroceryShoppingApp = () => {
  const [groceryList, setGroceryList] = useState<GroceryItem[]>([]);
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, unit: 'pcs' });
  const [radius, setRadius] = useState(5);
  const [maxStores, setMaxStores] = useState(3);
  const [route, setRoute] = useState<OptimizeRouteResponse | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const { toast } = useToast();
  const { latitude, longitude, error: locationError, loading: locationLoading, refetch: refetchLocation } = useGeolocation();

  // Load nearby stores when location is available
  useEffect(() => {
    if (latitude && longitude) {
      loadNearbyStores();
    }
  }, [latitude, longitude, radius]);

  const loadNearbyStores = async () => {
    if (!latitude || !longitude) return;

    try {
      const nearbyStores = await apiService.getNearbyStores(
        { latitude, longitude },
        radius
      );
      setStores(nearbyStores);
    } catch (error) {
      console.error('Error loading stores:', error);
      toast({
        title: "Error",
        description: "Failed to load nearby stores. Using fallback data.",
        variant: "destructive"
      });
      
      // Fallback to sample data if API fails
      const sampleStores: Store[] = [
        {
          id: '1',
          name: 'SuperMart',
          address: '123 Main St',
          distance: 2.1,
          latitude: latitude + 0.01,
          longitude: longitude + 0.01,
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
          latitude: latitude - 0.01,
          longitude: longitude - 0.01,
          items: {
            'milk': { price: 4.19, available: true },
            'bread': { price: 2.99, available: true },
            'eggs': { price: 3.89, available: true },
            'apples': { price: 1.79, available: true },
          }
        }
      ];
      setStores(sampleStores);
    }
  };

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

  const optimizeRoute = async () => {
    if (groceryList.length === 0) {
      toast({
        title: "Error",
        description: "Please add items to your grocery list first",
        variant: "destructive"
      });
      return;
    }

    if (!latitude || !longitude) {
      toast({
        title: "Location Required",
        description: "Please enable location access to optimize your route",
        variant: "destructive"
      });
      return;
    }

    setIsOptimizing(true);

    try {
      const optimizedRoute = await apiService.optimizeRoute({
        items: groceryList,
        location: { latitude, longitude },
        radius,
        maxStores
      });

      setRoute(optimizedRoute);

      toast({
        title: "Route optimized!",
        description: `Found route visiting ${optimizedRoute.stores.length} stores`,
      });
    } catch (error) {
      console.error('Error optimizing route:', error);
      
      // Fallback to local optimization if API fails
      toast({
        title: "API Error",
        description: "Using local optimization as fallback",
        variant: "destructive"
      });

      // Simple local optimization as fallback
      const availableStores = stores.filter(store => store.distance <= radius);
      
      if (availableStores.length === 0) {
        toast({
          title: "No stores found",
          description: "No stores found within the specified radius",
          variant: "destructive"
        });
        return;
      }

      // Basic local optimization logic (simplified version)
      const result = {
        stores: availableStores.slice(0, maxStores),
        totalCost: groceryList.length * 15, // Rough estimate
        totalDistance: availableStores.slice(0, maxStores).reduce((sum, s) => sum + s.distance, 0),
        savings: groceryList.length * 5, // Rough estimate
        route: {
          coordinates: [] as Array<[number, number]>,
          duration: 0
        }
      };

      setRoute(result);
    } finally {
      setIsOptimizing(false);
    }
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
              <CardTitle>Location & Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Current Location</h4>
                    <p className="text-sm text-muted-foreground">
                      {locationLoading ? 'Getting location...' : 
                       locationError ? locationError :
                       latitude && longitude ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : 'Location unavailable'}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={refetchLocation}
                    disabled={locationLoading}
                  >
                    {locationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Refresh
                  </Button>
                </div>

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

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Available Stores</h4>
                  <p className="text-sm text-muted-foreground">
                    {stores.length > 0 ? `${stores.length} stores found within ${radius} miles` : 'No stores loaded'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="route" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Optimized Shopping Route</h2>
            <Button 
              onClick={optimizeRoute} 
              size="lg" 
              className="flex items-center gap-2"
              disabled={isOptimizing || !latitude || !longitude || groceryList.length === 0}
            >
              {isOptimizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Route className="w-4 h-4" />}
              {isOptimizing ? 'Optimizing...' : 'Optimize Route'}
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
                <Button 
                  onClick={optimizeRoute} 
                  disabled={groceryList.length === 0 || !latitude || !longitude || isOptimizing}
                >
                  {isOptimizing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    'Generate Route'
                  )}
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