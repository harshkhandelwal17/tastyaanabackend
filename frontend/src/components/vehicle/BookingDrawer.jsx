import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';

const BookingDrawer = ({
    isOpen,
    onClose,
    vehicle,
    onBookNow
}) => {
    const [rentalPlan, setRentalPlan] = useState('12hr'); // '12hr', '24hr', 'weekly', 'monthly'
    const [extraHelmet, setExtraHelmet] = useState(false);
    const [helmetCount, setHelmetCount] = useState(1);
    const [fullInsurance, setFullInsurance] = useState(false);
    const [pickupDate, setPickupDate] = useState('');
    const [pickupTime, setPickupTime] = useState('');
    const [dropoffDate, setDropoffDate] = useState('');
    const [dropoffTime, setDropoffTime] = useState('');
    const [location, setLocation] = useState('');

    // Calculate total price
    const billSummary = useMemo(() => {
        let basePrice = 0;
        let duration = 1;

        // Get base price based on rental plan
        if (rentalPlan === '12hr') {
            basePrice = vehicle?.rate12hr?.withoutFuelPerHour || 0;
            duration = 12;
        } else if (rentalPlan === '24hr') {
            basePrice = vehicle?.rate24hr?.withoutFuelPerHour || 0;
            duration = 24;
        } else if (rentalPlan === 'daily') {
            basePrice = vehicle?.rateDaily?.[0]?.withoutFuelPerDay || 0;
            duration = 1;
        }

        const rentalCost = basePrice * duration;
        const helmetCost = extraHelmet ? helmetCount * 50 : 0; // ₹50 per helmet
        const insuranceCost = fullInsurance ? 100 : 0; // ₹100 for insurance
        const deposit = vehicle?.depositAmount || 0;

        const subtotal = rentalCost + helmetCost + insuranceCost;
        const total = subtotal;

        return {
            rentalCost,
            helmetCost,
            insuranceCost,
            deposit,
            subtotal,
            total
        };
    }, [rentalPlan, extraHelmet, helmetCount, fullInsurance, vehicle]);

    const rentalPlans = [
        { id: '12hr', label: '12 Hours', price: vehicle?.rate12hr?.withoutFuelPerHour || 0 },
        { id: '24hr', label: '24 Hours', price: vehicle?.rate24hr?.withoutFuelPerHour || 0 },
        { id: 'daily', label: 'Daily', price: vehicle?.rateDaily?.[0]?.withoutFuelPerDay || 0 }
    ];

    const handleBookNow = () => {
        const bookingData = {
            vehicleId: vehicle._id,
            rentalPlan,
            extraHelmet,
            helmetCount: extraHelmet ? helmetCount : 0,
            fullInsurance,
            pickupDate,
            pickupTime,
            dropoffDate,
            dropoffTime,
            location,
            billSummary
        };
        onBookNow(bookingData);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-40"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 bg-gradient-to-b from-gray-900 to-black rounded-t-3xl shadow-2xl z-50 max-h-[90vh] overflow-hidden text-white"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">Book Your Ride</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto px-6 py-4 max-h-[calc(90vh-180px)] space-y-6">
                            {/* Rental Plan */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-300 mb-3">Rental Plan</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {rentalPlans.map((plan) => (
                                        <button
                                            key={plan.id}
                                            onClick={() => setRentalPlan(plan.id)}
                                            className={`p-3 rounded-xl border-2 transition-all ${rentalPlan === plan.id
                                                    ? 'border-green-500 bg-green-500/20'
                                                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                                                }`}
                                        >
                                            <div className="text-xs text-gray-400">{plan.label}</div>
                                            <div className="text-lg font-bold text-green-400">₹{plan.price}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Accessories */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-300 mb-3">Accessories</h3>
                                <div className="space-y-3">
                                    {/* Extra Helmet */}
                                    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                                                🪖
                                            </div>
                                            <div>
                                                <div className="font-medium">Extra Helmet</div>
                                                <div className="text-xs text-gray-400">Safety first</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {extraHelmet && (
                                                <div className="flex items-center gap-2 bg-gray-700 rounded-lg px-2 py-1">
                                                    <button
                                                        onClick={() => setHelmetCount(Math.max(1, helmetCount - 1))}
                                                        className="w-6 h-6 flex items-center justify-center text-white hover:bg-gray-600 rounded"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="w-6 text-center">{helmetCount}</span>
                                                    <button
                                                        onClick={() => setHelmetCount(helmetCount + 1)}
                                                        className="w-6 h-6 flex items-center justify-center text-white hover:bg-gray-600 rounded"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            )}
                                            <div className="text-green-400 font-semibold">+₹{extraHelmet ? helmetCount * 50 : 50}</div>
                                            <button
                                                onClick={() => setExtraHelmet(!extraHelmet)}
                                                className={`relative w-12 h-6 rounded-full transition-colors ${extraHelmet ? 'bg-green-500' : 'bg-gray-600'
                                                    }`}
                                            >
                                                <motion.div
                                                    animate={{ x: extraHelmet ? 24 : 2 }}
                                                    className="absolute top-1 w-4 h-4 bg-white rounded-full"
                                                />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Full Insurance */}
                                    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                                                🛡️
                                            </div>
                                            <div>
                                                <div className="font-medium">Full Insurance</div>
                                                <div className="text-xs text-gray-400">Coverage on all</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-green-400 font-semibold">+₹100</div>
                                            <button
                                                onClick={() => setFullInsurance(!fullInsurance)}
                                                className={`relative w-12 h-6 rounded-full transition-colors ${fullInsurance ? 'bg-green-500' : 'bg-gray-600'
                                                    }`}
                                            >
                                                <motion.div
                                                    animate={{ x: fullInsurance ? 24 : 2 }}
                                                    className="absolute top-1 w-4 h-4 bg-white rounded-full"
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Pickup & Drop-off */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-300 mb-3">Pickup & Drop-off</h3>
                                <div className="space-y-3">
                                    {/* Date & Time */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1 block">DATE</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                                                <input
                                                    type="date"
                                                    value={pickupDate}
                                                    onChange={(e) => setPickupDate(e.target.value)}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-green-500"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1 block">TIME</label>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                                                <input
                                                    type="time"
                                                    value={pickupTime}
                                                    onChange={(e) => setPickupTime(e.target.value)}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-green-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">LOCATION</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                                            <select
                                                value={location}
                                                onChange={(e) => setLocation(e.target.value)}
                                                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-10 py-2 text-sm focus:outline-none focus:border-green-500 appearance-none"
                                            >
                                                <option value="">Select location</option>
                                                <option value="downtown">Downtown Hub, SF</option>
                                                <option value="airport">Airport Terminal</option>
                                                <option value="marina">Marina District</option>
                                            </select>
                                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 rotate-90" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bill Summary */}
                            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 space-y-2">
                                <h3 className="text-sm font-semibold text-gray-300 mb-3">Bill Summary</h3>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Rental Cost</span>
                                    <span>₹{billSummary.rentalCost}</span>
                                </div>
                                {extraHelmet && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Extra Helmet ({helmetCount}x)</span>
                                        <span>₹{billSummary.helmetCost}</span>
                                    </div>
                                )}
                                {fullInsurance && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Full Insurance</span>
                                        <span>₹{billSummary.insuranceCost}</span>
                                    </div>
                                )}
                                <div className="border-t border-gray-700 pt-2 mt-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Deposit (Refundable)</span>
                                        <span className="text-yellow-400">₹{billSummary.deposit}</span>
                                    </div>
                                </div>
                                <div className="border-t border-gray-700 pt-2 mt-2">
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total Price</span>
                                        <span className="text-green-400">₹{billSummary.total}</span>
                                    </div>
                                    <div className="text-xs text-gray-400 text-right">/day</div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 px-6 py-4">
                            <button
                                onClick={handleBookNow}
                                disabled={!pickupDate || !pickupTime || !location}
                                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${pickupDate && pickupTime && location
                                        ? 'bg-green-500 text-white hover:bg-green-600 hover:shadow-xl'
                                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                Book Now
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default BookingDrawer;
