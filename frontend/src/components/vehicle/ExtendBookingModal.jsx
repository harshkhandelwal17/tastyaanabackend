import React, { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiClock, FiAlertCircle, FiCheck, FiInfo } from 'react-icons/fi';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ExtendBookingModal = ({ isOpen, onClose, booking, currentEndTime, onRequestExtension, isLoading }) => {
    const [newEndDate, setNewEndDate] = useState('');
    const [newEndTime, setNewEndTime] = useState('');
    const [calculation, setCalculation] = useState(null);

    // Set initial values based on current end time
    useEffect(() => {
        if (isOpen && currentEndTime) {
            const date = new Date(currentEndTime);
            // Add 1 hour default extension
            date.setTime(date.getTime() + 60 * 60 * 1000);

            setNewEndDate(date.toISOString().split('T')[0]);
            setNewEndTime(date.toTimeString().slice(0, 5));
        }
    }, [isOpen, currentEndTime]);

    // Calculate costs when date/time changes
    useEffect(() => {
        if (newEndDate && newEndTime && booking) {
            calculateExtension();
        }
    }, [newEndDate, newEndTime]);

    const calculateExtension = () => {
        try {
            const currentEnd = new Date(currentEndTime);
            const proposedEnd = new Date(`${newEndDate}T${newEndTime}`);

            if (proposedEnd <= currentEnd) {
                setCalculation(null);
                return;
            }

            // Calculate duration in hours
            const durationMs = proposedEnd - currentEnd;
            const extraHours = Math.ceil(durationMs / (1000 * 60 * 60));

            if (extraHours < 1) return;

            // Get rate based on plan
            const isHourly24 = booking.rateType === 'hourly24' || booking.rateType === '24hr';
            const vehicle = booking.vehicleId;

            // Determine rate per hour
            let hourlyRate = 50; // default fallback

            if (vehicle.ratePlanUsed) {
                // Use stored rate plan details if available
                hourlyRate = vehicle.ratePlanUsed.extraHourCharge ||
                    (isHourly24 ? vehicle.rate24hr?.withoutFuelPerHour : vehicle.rate12hr?.withoutFuelPerHour);
            } else {
                // Fallback to vehicle current rates
                const hasFuel = booking.billing?.fuelCharges > 0;
                if (hasFuel) {
                    hourlyRate = isHourly24 ? vehicle.rate24hr?.withFuelPerHour : vehicle.rate12hr?.withFuelPerHour;
                } else {
                    hourlyRate = isHourly24 ? vehicle.rate24hr?.withoutFuelPerHour : vehicle.rate12hr?.withoutFuelPerHour;
                }
            }

            const amount = extraHours * hourlyRate;
            const gst = Math.round(amount * 0.18);
            const total = amount + gst;

            // Calculate extra KM
            const kmPerBlock = booking.ratePlanUsed?.kmLimit || 100;
            const hoursPerBlock = isHourly24 ? 24 : 12;
            const extraBlocks = Math.ceil(extraHours / hoursPerBlock);
            const extraKm = extraBlocks * kmPerBlock;

            setCalculation({
                extraHours,
                amount,
                gst,
                total,
                extraKm,
                hourlyRate
            });

        } catch (error) {
            console.error("Calculation error:", error);
        }
    };

    const handleSubmit = () => {
        if (!newEndDate || !newEndTime) {
            toast.error("Please select new end date and time");
            return;
        }

        const proposedEnd = new Date(`${newEndDate}T${newEndTime}`);
        if (proposedEnd <= new Date(currentEndTime)) {
            toast.error("New end time must be after current end time");
            return;
        }

        onRequestExtension(proposedEnd.toISOString());
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="font-bold text-gray-900">Extend Booking</h3>
                        <p className="text-xs text-gray-500">Request more time for your vehicle</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Current Status */}
                    <div className="bg-blue-50 px-4 py-3 rounded-xl border border-blue-100 flex items-start gap-3">
                        <FiClock className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-blue-900">Current Drop-off</p>
                            <p className="text-blue-700 font-bold">
                                {new Date(currentEndTime).toLocaleDateString('en-IN', {
                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                })}
                            </p>
                        </div>
                    </div>

                    {/* New Time Selection */}
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">New Drop-off Time</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <input
                                    type="date"
                                    value={newEndDate}
                                    min={new Date(currentEndTime).toISOString().split('T')[0]}
                                    onChange={(e) => setNewEndDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                />
                            </div>
                            <div>
                                <input
                                    type="time"
                                    value={newEndTime}
                                    onChange={(e) => setNewEndTime(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Calculation Summary */}
                    {calculation && (
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <FiInfo className="w-4 h-4" /> Est. Extension Cost
                            </h4>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Extra Duration</span>
                                    <span className="font-medium">{calculation.extraHours} hours</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Rate</span>
                                    <span className="font-medium">₹{calculation.hourlyRate}/hr</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Extension Charges</span>
                                    <span className="font-medium">₹{calculation.amount}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>GST (18%)</span>
                                    <span className="font-medium">₹{calculation.gst}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Extra KM Limit</span>
                                    <span className="font-medium text-green-600">+{calculation.extraKm} km</span>
                                </div>
                                <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                                    <span className="font-bold text-gray-900">Total Payable</span>
                                    <span className="font-bold text-indigo-600 text-lg">₹{calculation.total}</span>
                                </div>
                            </div>

                            <div className="bg-yellow-50 p-2 rounded text-xs text-yellow-800 border border-yellow-100 flex gap-2">
                                <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                                <p>This amount must be paid immediately upon seller approval to confirm the extension.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !calculation}
                        className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Sending Request...
                            </>
                        ) : (
                            <>
                                Request Extension
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExtendBookingModal;
