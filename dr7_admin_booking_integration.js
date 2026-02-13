
// DR7 ADMIN BOOKING INTEGRATION - DEPLOYED 2026-02-13T22:24:11.089Z
// Provides full booking visibility to admin panel

export class DR7AdminBookingManager {
    constructor(supabase) {
        this.supabase = supabase;
    }
    
    // Get all bookings with full details
    async getAllBookings(filters = {}) {
        let query = this.supabase
            .from('bookings')
            .select(`
                id,
                customer_name,
                customer_email,
                customer_phone,
                vehicle_name,
                vehicle_id,
                pickup_date,
                dropoff_date,
                status,
                price_total,
                payment_status,
                booking_source,
                created_at,
                updated_at
            `)
            .order('created_at', { ascending: false });
            
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        if (filters.date_from) {
            query = query.gte('pickup_date', filters.date_from);
        }
        if (filters.date_to) {
            query = query.lte('dropoff_date', filters.date_to);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        return data;
    }
    
    // Get today's bookings
    async getTodayBookings() {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await this.supabase
            .from('bookings')
            .select('*')
            .lte('pickup_date', `${today}T23:59:59`)
            .gte('dropoff_date', `${today}T00:00:00`)
            .in('status', ['confirmed', 'ongoing', 'active']);
            
        if (error) throw error;
        return data;
    }
    
    // Get booking statistics
    async getBookingStats() {
        const { data: allBookings, error } = await this.supabase
            .from('bookings')
            .select('status, created_at, price_total, booking_source');
            
        if (error) throw error;
        
        const today = new Date();
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        return {
            total: allBookings.length,
            confirmed: allBookings.filter(b => b.status === 'confirmed').length,
            pending: allBookings.filter(b => b.status === 'pending').length,
            thisMonth: allBookings.filter(b => new Date(b.created_at) >= thisMonth).length,
            revenue: allBookings
                .filter(b => b.status === 'confirmed')
                .reduce((sum, b) => sum + (b.price_total || 0), 0),
            sources: allBookings.reduce((acc, b) => {
                const source = b.booking_source || 'unknown';
                acc[source] = (acc[source] || 0) + 1;
                return acc;
            }, {})
        };
    }
    
    // Update booking status
    async updateBookingStatus(bookingId, newStatus) {
        const { data, error } = await this.supabase
            .from('bookings')
            .update({ 
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', bookingId)
            .select();
            
        if (error) throw error;
        return data[0];
    }
}

// Easy integration for admin panel
export async function initializeAdminBookingDashboard(supabase) {
    const manager = new DR7AdminBookingManager(supabase);
    
    const [allBookings, todayBookings, stats] = await Promise.all([
        manager.getAllBookings(),
        manager.getTodayBookings(),
        manager.getBookingStats()
    ]);
    
    return {
        manager,
        dashboard: {
            allBookings,
            todayBookings,
            stats
        }
    };
}
        