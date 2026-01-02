// Approve or Deny Booking (Seller Action)
const approveBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, reason } = req.body; // action: 'approve' or 'deny'

        const booking = await VehicleBooking.findById(id).populate('vehicleId');
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // Permission check
        if (req.user.role !== 'seller' || booking.vehicleId.sellerId.toString() !== req.user.id) {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }
        }

        if (booking.bookingStatus !== 'awaiting_approval') {
            return res.status(400).json({ success: false, message: 'Booking is not pending approval' });
        }

        if (action === 'approve') {
            booking.bookingStatus = 'confirmed';
            // Update vehicle status
            await Vehicle.findByIdAndUpdate(booking.vehicleId._id, {
                availability: 'not-available',
                status: 'booked'
            });
        } else if (action === 'deny') {
            booking.bookingStatus = 'cancelled';
            booking.cancellationReason = reason || 'Request denied by seller';

            // Auto-initiate refund
            if (booking.paymentStatus === 'paid') {
                booking.refundStatus = 'pending'; // Trigger refund process
                // In real app, call Razorpay refund API here
            }

            // Free up vehicle
            await Vehicle.findByIdAndUpdate(booking.vehicleId._id, {
                availability: 'available',
                status: 'active'
            });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid action' });
        }

        await booking.save();

        res.json({
            success: true,
            message: `Booking ${action}ed successfully`,
            data: booking
        });

    } catch (error) {
        console.error('Error in booking approval:', error);
        res.status(500).json({ success: false, message: 'Action failed' });
    }
};
