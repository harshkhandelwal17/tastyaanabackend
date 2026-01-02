
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Zap, 
  Search, 
  Star, 
  MapPin, 
  Clock, 
  Package, 
  Users, 
  ChevronRight,
  Plus,
  Minus,
  CheckCircle2,
  Phone,
  AlertCircle,
  Loader2,
  TrendingUp,
  Award,
  Truck,
  ArrowLeft,
  Sparkles,
  Check,
  ArrowRight
} from 'lucide-react';
export const ItemSelector = ({ selectedItems, onItemsChange, vendor, deliverySpeed }) => {
  const [activeCategory, setActiveCategory] = useState('topwear');
  const [removedItemsMessage, setRemovedItemsMessage] = useState(null);
  
  // Check if vendor uses weight-based pricing
  const pricingModel = vendor?.pricingConfig?.model || 'per_piece';
  const isWeightBased = pricingModel === 'weight_based' || pricingModel === 'hybrid';

  // Update prices when deliverySpeed changes
  // Also remove items that are not available for the selected delivery speed
  useEffect(() => {
    if (selectedItems.length > 0 && vendor?.pricing) {
      const isQuickEnabled = vendor?.quickServiceConfig?.enabled;
      const previousItemsCount = selectedItems.length;
      const removedItems = [];
      
      const updatedItems = selectedItems
        .map(item => {
          // Handle weight-based pricing
          if (isWeightBased && item.weight && item.weight > 0) {
            const baseWeightPricing = vendor.pricingConfig?.weightBasedPricing || {};
            const quickWeightPricing = vendor.quickWeightBasedPricing || {};
            
            // For quick service, check if quick pricing exists
            if (deliverySpeed === 'quick' && isQuickEnabled) {
              if (!quickWeightPricing[item.serviceType] || quickWeightPricing[item.serviceType] <= 0) {
                // Track removed item
                removedItems.push({
                  type: item.type,
                  service: item.serviceType,
                  quantity: item.quantity
                });
                return null;
              }
            }
            
            let pricePerKg;
            if (deliverySpeed === 'quick' && isQuickEnabled) {
              pricePerKg = quickWeightPricing[item.serviceType];
            } else {
              // Scheduled pricing
              pricePerKg = baseWeightPricing[item.serviceType] || 50;
            }
            
            const itemWeight = item.weight * item.quantity;
            const totalPrice = pricePerKg * itemWeight;
            
            return {
              ...item,
              pricePerKg: pricePerKg,
              totalPrice: totalPrice
            };
          }
          
          // Handle per-piece pricing
          const baseItemPricing = vendor.pricing[item.type] || {};
          const quickItemPricing = vendor.quickPricing?.[item.type] || {};
          
          // For quick service, check if quick pricing exists
          if (deliverySpeed === 'quick' && isQuickEnabled) {
            if (!quickItemPricing[item.serviceType] || quickItemPricing[item.serviceType] <= 0) {
              // Track removed item
              removedItems.push({
                type: item.type,
                service: item.serviceType,
                quantity: item.quantity
              });
              return null;
            }
          }
          
          let newPrice;
          if (deliverySpeed === 'quick' && isQuickEnabled) {
            // Use quick pricing (already verified above)
            newPrice = quickItemPricing[item.serviceType];
          } else {
            // Scheduled pricing
            newPrice = baseItemPricing[item.serviceType] || item.pricePerItem;
          }
          
          return {
            ...item,
            pricePerItem: newPrice,
            totalPrice: newPrice * item.quantity
          };
        })
        .filter(item => item !== null); // Remove items that are not available
      
      // Show message if items were removed
      if (removedItems.length > 0 && deliverySpeed === 'quick') {
        const removedCount = removedItems.length;
        const message = `${removedCount} item${removedCount > 1 ? 's' : ''} removed - not available for quick service`;
        setRemovedItemsMessage(message);
        // Auto-hide message after 5 seconds
        setTimeout(() => setRemovedItemsMessage(null), 5000);
      } else {
        setRemovedItemsMessage(null);
      }
      
      // Only update if items actually changed
      if (updatedItems.length !== previousItemsCount || removedItems.length > 0) {
        onItemsChange(updatedItems);
      } else {
        // Just update prices without removing items
        onItemsChange(updatedItems);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliverySpeed]); // Only update when deliverySpeed changes
  
  const categories = {
    topwear: { 
      name: 'Top Wear', 
      icon: '👕', 
      gradient: 'from-blue-500 to-indigo-500',
      items: ['shirt', 'tshirt', 'sweater', 'jacket']
    },
    bottomwear: { 
      name: 'Bottom Wear', 
      icon: '👖', 
      gradient: 'from-purple-500 to-pink-500',
      items: ['jeans', 'trousers', 'shorts']
    },
    home_textiles: { 
      name: 'Home Textiles', 
      icon: '🛏️', 
      gradient: 'from-emerald-500 to-teal-500',
      items: ['bedsheet', 'blanket', 'curtain', 'towel']
    },
    others: {
      name: 'Others',
      icon: '👔',
      gradient: 'from-orange-500 to-red-500',
      items: ['saree', 'suit', 'shoe']
    }
  };

  // Convert pricing object to array format grouped by category
  const getItemsForCategory = (category) => {
    // For hybrid model, we need to check both pricing types
    const hasPerPiecePricing = vendor?.pricing && typeof vendor.pricing === 'object';
    const hasWeightPricing = vendor?.pricingConfig?.weightBasedPricing && 
      Object.keys(vendor.pricingConfig.weightBasedPricing).length > 0;
    
    // If no pricing at all, return empty
    if (!hasPerPiecePricing && !hasWeightPricing) {
      return [];
    }

    const categoryItems = categories[category]?.items || [];
    const items = [];
    const isQuickEnabled = vendor?.quickServiceConfig?.enabled;
    const isScheduledEnabled = vendor?.scheduledServiceConfig?.enabled !== false;

    categoryItems.forEach(itemType => {
      const baseItemPricing = vendor.pricing?.[itemType] || {};
      const quickItemPricing = vendor.quickPricing?.[itemType] || {};
      
      // For per-piece pricing
      if (hasPerPiecePricing && baseItemPricing && typeof baseItemPricing === 'object') {
        const services = [];
        Object.keys(baseItemPricing).forEach(serviceType => {
          const basePrice = baseItemPricing[serviceType];
          // Only include services with valid prices
          if (typeof basePrice === 'number' && basePrice > 0) {
            // For quick service: Only show if quick pricing is explicitly set
            // For scheduled service: Show all services with pricing
            if (deliverySpeed === 'quick' && isQuickEnabled) {
              // Quick service: Only show if quick pricing is set
              const hasQuickPricing = quickItemPricing[serviceType] && quickItemPricing[serviceType] > 0;
              if (!hasQuickPricing) {
                // Don't show this service for quick service if pricing not set
                return;
              }
              // Use the quick pricing
              services.push({
                service: serviceType,
                scheduledPrice: basePrice,
                quickPrice: quickItemPricing[serviceType],
                pricingModel: 'per_piece'
              });
            } else if (deliverySpeed === 'scheduled' && isScheduledEnabled) {
              // Scheduled service: Show all services
              // Calculate quick price for display (if available)
              const quickPrice = (quickItemPricing[serviceType] && quickItemPricing[serviceType] > 0) 
                ? quickItemPricing[serviceType] 
                : basePrice; // Fallback to base price if quick pricing not set
              
              services.push({
                service: serviceType,
                scheduledPrice: basePrice,
                quickPrice: quickPrice,
                pricingModel: 'per_piece'
              });
            }
          }
        });

        if (services.length > 0) {
          items.push({
            item: itemType,
            category: category,
            services: services,
            pricingType: 'per_piece'
          });
        }
      }
      
      // For weight-based pricing (if hybrid or weight_based model)
      if (isWeightBased && hasWeightPricing) {
        const weightServices = [];
        const baseWeightPricing = vendor.pricingConfig?.weightBasedPricing || {};
        const quickWeightPricing = vendor.quickWeightBasedPricing || {};
        
        Object.keys(baseWeightPricing).forEach(serviceType => {
          const baseWeightPrice = baseWeightPricing[serviceType];
          if (typeof baseWeightPrice === 'number' && baseWeightPrice > 0) {
            // For quick service: Only show if quick weight pricing is set
            if (deliverySpeed === 'quick' && isQuickEnabled) {
              const hasQuickWeightPricing = quickWeightPricing[serviceType] && quickWeightPricing[serviceType] > 0;
              if (!hasQuickWeightPricing) {
                return;
              }
              weightServices.push({
                service: serviceType,
                scheduledPrice: baseWeightPrice,
                quickPrice: quickWeightPricing[serviceType],
                pricingModel: 'weight_based'
              });
            } else if (deliverySpeed === 'scheduled' && isScheduledEnabled) {
              const quickWeightPrice = (quickWeightPricing[serviceType] && quickWeightPricing[serviceType] > 0)
                ? quickWeightPricing[serviceType]
                : baseWeightPrice;
              
              weightServices.push({
                service: serviceType,
                scheduledPrice: baseWeightPrice,
                quickPrice: quickWeightPrice,
                pricingModel: 'weight_based'
              });
            }
          }
        });
        
        // Add weight-based services as a separate item entry
        if (weightServices.length > 0) {
          // Check if we already have this item type with per-piece pricing
          const existingItemIndex = items.findIndex(i => i.item === itemType);
          if (existingItemIndex >= 0) {
            // Merge weight-based services into existing item
            items[existingItemIndex].services = [
              ...items[existingItemIndex].services,
              ...weightServices
            ];
            items[existingItemIndex].pricingType = 'hybrid';
          } else {
            // Create new item entry for weight-based only
            items.push({
              item: itemType,
              category: category,
              services: weightServices,
              pricingType: 'weight_based'
            });
          }
        }
      }
    });

    return items;
  };

  const addItem = (pricingItem, service) => {
    // Use the pricing model from service, or fallback to vendor's pricing model
    const servicePricingModel = service.pricingModel || pricingModel;
    const isServiceWeightBased = servicePricingModel === 'weight_based';
    
    const itemKey = `${pricingItem.item}_${service.service}_${servicePricingModel}`;
    const existing = selectedItems.find(i => i.itemKey === itemKey);
    
    // For weight-based pricing, we need weight input
    if (isServiceWeightBased && !existing) {
      // Prompt for weight or use default
      const defaultWeight = 0.5; // Default 0.5kg per item
      const weightPricing = deliverySpeed === 'quick' && vendor.quickWeightBasedPricing
        ? vendor.quickWeightBasedPricing
        : vendor.pricingConfig?.weightBasedPricing;
      
      const pricePerKg = weightPricing?.[service.service] || service.scheduledPrice || 50;
      const totalPrice = pricePerKg * defaultWeight;
      
      onItemsChange([...selectedItems, {
        itemKey,
        type: pricingItem.item,
        category: pricingItem.category,
        serviceType: service.service,
        quantity: 1,
        weight: defaultWeight,
        pricePerKg: pricePerKg,
        pricingModel: 'weight_based',
        totalPrice: totalPrice
      }]);
      return;
    }
    
    // Per-piece pricing
    const price = deliverySpeed === 'quick' 
      ? (service.quickPrice || service.scheduledPrice) 
      : service.scheduledPrice;
    
    if (existing) {
      // Check if existing item is weight-based or per-piece
      if (existing.weight !== undefined && existing.pricePerKg) {
        // For weight-based, increase quantity (weight stays per item)
        const newQty = existing.quantity + 1;
        const totalWeight = existing.weight * newQty;
        onItemsChange(selectedItems.map(i => 
          i.itemKey === itemKey 
            ? { ...i, quantity: newQty, totalPrice: i.pricePerKg * totalWeight } 
            : i
        ));
      } else {
        // For per-piece, increase quantity
      onItemsChange(selectedItems.map(i => 
          i.itemKey === itemKey 
            ? { ...i, quantity: i.quantity + 1, totalPrice: i.pricePerItem * (i.quantity + 1) } 
            : i
      ));
      }
    } else {
      onItemsChange([...selectedItems, {
        itemKey,
        type: pricingItem.item,
        category: pricingItem.category,
        serviceType: service.service,
        quantity: 1,
        pricePerItem: price,
        pricingModel: 'per_piece',
        totalPrice: price
      }]);
    }
  };
  
  const updateItemWeight = (itemKey, weight) => {
    // Validate weight
    const validatedWeight = Math.max(0.1, Math.min(50, parseFloat(weight) || 0.1));
    
    onItemsChange(selectedItems.map(item => {
      if (item.itemKey === itemKey && item.weight !== undefined) {
        const totalWeight = validatedWeight * item.quantity;
        const totalPrice = item.pricePerKg * totalWeight;
        return { ...item, weight: validatedWeight, totalPrice: totalPrice };
      }
      return item;
    }));
  };

  const updateQuantity = (itemKey, delta) => {
    onItemsChange(selectedItems.map(item => {
      if (item.itemKey === itemKey) {
        const newQty = Math.max(1, Math.min(100, item.quantity + delta)); // Limit between 1-100
        if (newQty === 0) return null;
        
        // Handle weight-based pricing
        if (item.weight !== undefined && item.pricePerKg) {
          const totalWeight = item.weight * newQty;
          return { ...item, quantity: newQty, totalPrice: item.pricePerKg * totalWeight };
        }
        
        // Handle per-piece pricing
        return { ...item, quantity: newQty, totalPrice: item.pricePerItem * newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const totalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = selectedItems.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
      <div className="p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200">
        <h3 className="text-xl lg:text-2xl font-extrabold text-gray-900 mb-3">Select Items</h3>
        {isWeightBased && (
          <div className="mt-3 p-4 bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300 rounded-2xl shadow-sm">
            <p className="text-sm font-bold text-blue-900 mb-1.5 flex items-center gap-2">
              <span className="text-lg">⚖️</span>
              Weight-Based Pricing
            </p>
            <p className="text-xs text-blue-800 leading-relaxed">This vendor uses weight-based pricing. Enter the weight (in kg) for each item after adding it.</p>
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Removed Items Message */}
        {removedItemsMessage && (
          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            {removedItemsMessage}
          </div>
        )}
        
        {/* Category Tabs */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-3 scrollbar-hide px-1">
          {Object.keys(categories).map(catKey => {
            const cat = categories[catKey];
            const isActive = activeCategory === catKey;
            return (
              <button
                key={catKey}
                onClick={() => setActiveCategory(catKey)}
                className={`px-5 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Items List */}
        {getItemsForCategory(activeCategory).length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No items available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 mb-5">
          {getItemsForCategory(activeCategory).map(pricingItem => (
              <div key={pricingItem.item} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-5 border-2 border-gray-200 shadow-sm hover:shadow-md transition-all">
                <h4 className="font-extrabold text-lg text-gray-900 mb-4 capitalize">
                  {pricingItem.item.replace('_', ' ')}
                </h4>
                
                <div className="space-y-2">
                {pricingItem.services.map(service => {
                    const price = deliverySpeed === 'quick' 
                      ? service.quickPrice 
                      : service.scheduledPrice;
                    const displayPrice = typeof price === 'number' && price > 0 ? price : 0;
                    const servicePricingModel = service.pricingModel || pricingModel;
                    const isServiceWeightBased = servicePricingModel === 'weight_based';
                    const priceLabel = isServiceWeightBased 
                      ? `₹${Math.round(displayPrice)}/kg`
                      : `₹${Math.round(displayPrice)}/piece`;
                    
                  return (
                    <button
                        key={`${service.service}_${servicePricingModel}`}
                      onClick={() => addItem(pricingItem, service)}
                        className="w-full text-left p-4 rounded-2xl border-2 border-gray-200 bg-white hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <span className="text-base font-bold text-gray-900 capitalize block mb-1.5">
                        {service.service.replace(/_/g, ' ')}
                            </span>
                            <div className="flex items-center gap-2">
                              {isServiceWeightBased ? (
                                <span className="text-xs text-blue-700 font-bold bg-blue-100 px-2 py-1 rounded-lg">⚖️ Weight-based</span>
                              ) : (
                                <span className="text-xs text-gray-600 font-semibold bg-gray-100 px-2 py-1 rounded-lg">📦 Per-piece</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 ml-3">
                            <span className="text-base font-extrabold text-gray-900 whitespace-nowrap">{priceLabel}</span>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all">
                              <Plus className="w-5 h-5" />
                            </div>
                          </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Selected Items */}
        {selectedItems.length > 0 && (
          <div className="border-t-2 border-gray-200 pt-5 mt-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-base text-gray-900">
                Selected Items ({totalItems})
              </h4>
              <div className="text-right">
                <div className="text-xs text-gray-500">Total</div>
                <div className="text-lg font-bold text-blue-600">₹{subtotal.toFixed(0)}</div>
              </div>
            </div>
            
            <div className="space-y-3">
              {selectedItems.map(item => (
                <div key={item.itemKey} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-gray-900 capitalize mb-1">
                      {item.type.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-gray-600 capitalize">
                        {item.serviceType.replace('_', ' ')}
                        {item.weight !== undefined 
                          ? ` • ₹${item.pricePerKg}/kg`
                          : ` • ₹${item.pricePerItem}`
                        }
                      </div>
                    </div>
                    <div className="font-bold text-base text-gray-900">
                      ₹{item.totalPrice?.toFixed(0) || 0}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Weight input - More prominent for weight-based */}
                    {item.weight !== undefined && (
                      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border-2 border-blue-300 shadow-sm">
                        <label className="text-xs text-blue-700 font-bold">⚖️ Weight (kg):</label>
                        <input
                          type="number"
                          min="0.1"
                          max="50"
                          step="0.1"
                          value={item.weight}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0.1;
                            if (value >= 0.1 && value <= 50) {
                              updateItemWeight(item.itemKey, value);
                            }
                          }}
                          className="w-16 px-2 py-1 border border-blue-200 rounded bg-blue-50 text-sm font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-xs text-blue-600 font-semibold">kg</span>
                      </div>
                    )}
                    
                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 ml-auto bg-white rounded-lg border border-gray-300 p-1">
                      <button
                        onClick={() => updateQuantity(item.itemKey, -1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 active:scale-95 transition-all"
                      >
                        <Minus className="w-4 h-4 text-gray-600" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.itemKey, 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 active:scale-95 transition-all"
                      >
                        <Plus className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                  
                  {item.weight !== undefined && (
                    <div className="mt-2 p-2 bg-blue-100 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-blue-800 font-semibold">Total Weight:</span>
                        <span className="text-blue-900 font-bold">{(item.weight * item.quantity).toFixed(2)} kg</span>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-blue-700">Price per kg:</span>
                        <span className="text-blue-900 font-bold">₹{item.pricePerKg}/kg</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

