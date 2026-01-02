const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Mock data for Vehicle Rental Sellers with specific zones
const vehicleRentalSellersData = [
  {
    name: "Rajesh Kumar",
    email: "rajesh.bholaram@vehicles.com",
    phone: "+917894561230",
    password: "password123",
    role: "seller",
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: true,
    avatar: "/uploads/avatars/rajesh-kumar.jpg",
    sellerProfile: {
      storeName: "Bholaram Wheels",
      storeDescription: "Premium vehicle rental service in Bholaram Ustad Marg with modern fleet",
      storeAddress: "Shop No. 15, Bholaram Ustad Marg, Indore, MP 452001",
      storeStatus: "open",
      operatingHours: {
        monday: { open: "08:00", close: "20:00", isOpen: true },
        tuesday: { open: "08:00", close: "20:00", isOpen: true },
        wednesday: { open: "08:00", close: "20:00", isOpen: true },
        thursday: { open: "08:00", close: "20:00", isOpen: true },
        friday: { open: "08:00", close: "20:00", isOpen: true },
        saturday: { open: "08:00", close: "22:00", isOpen: true },
        sunday: { open: "09:00", close: "21:00", isOpen: true }
      },
      ratings: {
        average: 4.5,
        count: 127
      },
      isVerified: true,
      vehicleRentalService: {
        isEnabled: true,
        serviceStatus: "active",
        businessType: "fleet_owner",
          serviceZones: [
              {
          zoneName: "Bholaram Ustad Marg",
          zoneCode: "BUM001",
          address: "Bholaram Ustad Marg, Indore, MP 452001",
          coordinates: {
            lat: 22.7196,
            lng: 75.8577
          },
          isActive: true,
          operatingHours: {
            monday: { open: "08:00", close: "20:00", isOpen: true },
            tuesday: { open: "08:00", close: "20:00", isOpen: true },
            wednesday: { open: "08:00", close: "20:00", isOpen: true },
            thursday: { open: "08:00", close: "20:00", isOpen: true },
            friday: { open: "08:00", close: "20:00", isOpen: true },
            saturday: { open: "08:00", close: "22:00", isOpen: true },
            sunday: { open: "09:00", close: "21:00", isOpen: true }
          },
          contactInfo: {
            phone: "+917894561230",
            email: "bholaram@vehicles.com",
            managerName: "Rajesh Kumar"
          }
              },
              {
          zoneName: "Indrapuri",
          zoneCode: "IND001",
          address: "Indrapuri, Indore, MP 452020",
          coordinates: {
            lat: 22.6708,
            lng: 75.9063
          },
          isActive: true,
          operatingHours: {
            monday: { open: "06:00", close: "23:00", isOpen: true },
            tuesday: { open: "06:00", close: "23:00", isOpen: true },
            wednesday: { open: "06:00", close: "23:00", isOpen: true },
            thursday: { open: "06:00", close: "23:00", isOpen: true },
            friday: { open: "06:00", close: "23:00", isOpen: true },
            saturday: { open: "06:00", close: "23:30", isOpen: true },
            sunday: { open: "07:00", close: "23:00", isOpen: true }
          },
          contactInfo: {
            phone: "+917894561250",
            email: "indrapuri@vehicles.com",
            managerName: "Vikram Singh"
          }
              },{
          zoneName: "Vijaynagar",
          zoneCode: "VJN001",
          address: "Vijaynagar, Indore, MP 452010",
          coordinates: {
            lat: 22.7532,
            lng: 75.8937
          },
          isActive: true,
          operatingHours: {
            monday: { open: "07:30", close: "21:00", isOpen: true },
            tuesday: { open: "07:30", close: "21:00", isOpen: true },
            wednesday: { open: "07:30", close: "21:00", isOpen: true },
            thursday: { open: "07:30", close: "21:00", isOpen: true },
            friday: { open: "07:30", close: "21:00", isOpen: true },
            saturday: { open: "07:30", close: "22:30", isOpen: true },
            sunday: { open: "08:30", close: "22:00", isOpen: true }
          },
          contactInfo: {
            phone: "+917894561240",
            email: "vijaynagar@vehicles.com",
            managerName: "Priya Sharma"
          }
              }
          ],
        fleetStats: {
          totalVehicles: 3,
          activeVehicles: 3,
          vehicleCategories: {
            bikes: 1,
            cars:1 ,
            scooter: 1,
            buses: 0,
            trucks: 0
          },
          lastUpdated: new Date()
        },
        businessSettings: {
          allowAdvanceBooking: true,
          maxAdvanceBookingDays: 365,
          minBookingHours: 1,
          cancellationPolicy: {
            freeUptoHours: 24,
            chargePercentage: [
              { hoursBeforeStart: 24, chargePercent: 0 },
              { hoursBeforeStart: 12, chargePercent: 25 },
              { hoursBeforeStart: 6, chargePercent: 50 },
              { hoursBeforeStart: 2, chargePercent: 75 }
            ]
          },
          securityDeposit: {
            defaultAmount: 2000,
            refundPolicy: "Security deposit refunded within 48 hours after vehicle return"
          }
        },
        financialSettings: {
          commissionRate: 12,
          taxSettings: {
            gstRate: 18,
            serviceTaxRate: 0
          },
          paymentTerms: {
            settlementCycle: "weekly",
            minimumSettlementAmount: 500
          }
        },
        businessDocuments: {
          transportLicense: "/uploads/docs/transport-license-bholaram.pdf",
          vehicleRegistrationCertificate: "/uploads/docs/vehicle-reg-bholaram.pdf",
          insurancePolicy: "/uploads/docs/insurance-bholaram.pdf",
          businessRegistration: "/uploads/docs/business-reg-bholaram.pdf",
          gstCertificate: "/uploads/docs/gst-cert-bholaram.pdf",
          bankAccountProof: "/uploads/docs/bank-proof-bholaram.pdf",
          isVerified: true,
          verificationDate: new Date("2024-01-15"),
          verifiedBy: null
        },
        businessMetrics: {
          totalBookings: 1250,
          totalRevenue: 185000,
          averageRating: 4.5,
          ratingCount: 127,
          lastBookingDate: new Date(),
          popularVehicleTypes: ["bikes", "scooties", "cars"],
          peakHours: [
            { hour: 9, bookingCount: 25 },
            { hour: 18, bookingCount: 30 },
            { hour: 20, bookingCount: 22 }
          ]
        },
        staffMembers: [
          {
            name: "Amit Sharma",
            phone: "+917894561231",
            role: "manager",
            assignedZones: ["BUM001"],
            isActive: true,
            joiningDate: new Date("2023-06-01"),
            salary: 25000,
            permissions: {
              canCreateBooking: true,
              canCancelBooking: true,
              canProcessRefund: false,
              canManageVehicles: true
            }
          },
          {
            name: "Rahul Patel",
            phone: "+917894561232",
            role: "driver",
            assignedZones: ["BUM001"],
            isActive: true,
            joiningDate: new Date("2023-08-15"),
            salary: 18000,
            permissions: {
              canCreateBooking: false,
              canCancelBooking: false,
              canProcessRefund: false,
              canManageVehicles: false
            }
          }
        ]
      }
    }
  },

  {
    name: "Priya Sharma",
    email: "priya.vijaynagar@vehicles.com",
    phone: "+917894561240",
    password: "password123",
    role: "seller",
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: true,
    avatar: "/uploads/avatars/priya-sharma.jpg",
    sellerProfile: {
      storeName: "Vijaynagar Auto Rentals",
      storeDescription: "Affordable and reliable vehicle rental services in Vijaynagar area",
      storeAddress: "Plot No. 25, Vijaynagar, Indore, MP 452010",
      storeStatus: "open",
      operatingHours: {
        monday: { open: "07:30", close: "21:00", isOpen: true },
        tuesday: { open: "07:30", close: "21:00", isOpen: true },
        wednesday: { open: "07:30", close: "21:00", isOpen: true },
        thursday: { open: "07:30", close: "21:00", isOpen: true },
        friday: { open: "07:30", close: "21:00", isOpen: true },
        saturday: { open: "07:30", close: "22:30", isOpen: true },
        sunday: { open: "08:30", close: "22:00", isOpen: true }
      },
      ratings: {
        average: 4.2,
        count: 89
      },
      isVerified: true,
      vehicleRentalService: {
        isEnabled: true,
        serviceStatus: "active",
        businessType: "agency",
          serviceZones: [
              {
          zoneName: "Vijaynagar",
          zoneCode: "VJN001",
          address: "Vijaynagar, Indore, MP 452010",
          coordinates: {
            lat: 22.7532,
            lng: 75.8937
          },
          isActive: true,
          operatingHours: {
            monday: { open: "07:30", close: "21:00", isOpen: true },
            tuesday: { open: "07:30", close: "21:00", isOpen: true },
            wednesday: { open: "07:30", close: "21:00", isOpen: true },
            thursday: { open: "07:30", close: "21:00", isOpen: true },
            friday: { open: "07:30", close: "21:00", isOpen: true },
            saturday: { open: "07:30", close: "22:30", isOpen: true },
            sunday: { open: "08:30", close: "22:00", isOpen: true }
          },
          contactInfo: {
            phone: "+917894561240",
            email: "vijaynagar@vehicles.com",
            managerName: "Priya Sharma"
          }
              }
          ],
        fleetStats: {
          totalVehicles: 32,
          activeVehicles: 30,
          vehicleCategories: {
            bikes: 12,
            cars: 8,
            scooties: 12,
            buses: 0,
            trucks: 0
          },
          lastUpdated: new Date()
        },
        businessSettings: {
          allowAdvanceBooking: true,
          maxAdvanceBookingDays: 10,
          minBookingHours: 3,
          cancellationPolicy: {
            freeUptoHours: 12,
            chargePercentage: [
              { hoursBeforeStart: 12, chargePercent: 0 },
              { hoursBeforeStart: 6, chargePercent: 30 },
              { hoursBeforeStart: 2, chargePercent: 60 }
            ]
          },
          securityDeposit: {
            defaultAmount: 1500,
            refundPolicy: "Security deposit refunded within 24 hours after vehicle return"
          }
        },
        financialSettings: {
          commissionRate: 10,
          taxSettings: {
            gstRate: 18,
            serviceTaxRate: 0
          },
          paymentTerms: {
            settlementCycle: "bi-weekly",
            minimumSettlementAmount: 1000
          }
        },
        businessDocuments: {
          transportLicense: "/uploads/docs/transport-license-vijaynagar.pdf",
          vehicleRegistrationCertificate: "/uploads/docs/vehicle-reg-vijaynagar.pdf",
          insurancePolicy: "/uploads/docs/insurance-vijaynagar.pdf",
          businessRegistration: "/uploads/docs/business-reg-vijaynagar.pdf",
          gstCertificate: "/uploads/docs/gst-cert-vijaynagar.pdf",
          bankAccountProof: "/uploads/docs/bank-proof-vijaynagar.pdf",
          isVerified: true,
          verificationDate: new Date("2024-02-20"),
          verifiedBy: null
        },
        businessMetrics: {
          totalBookings: 890,
          totalRevenue: 125000,
          averageRating: 4.2,
          ratingCount: 89,
          lastBookingDate: new Date(),
          popularVehicleTypes: ["scooties", "bikes", "cars"],
          peakHours: [
            { hour: 8, bookingCount: 18 },
            { hour: 17, bookingCount: 24 },
            { hour: 19, bookingCount: 20 }
          ]
        },
        staffMembers: [
          {
            name: "Suresh Gupta",
            phone: "+917894561241",
            role: "supervisor",
            assignedZones: ["VJN001"],
            isActive: true,
            joiningDate: new Date("2023-09-10"),
            salary: 20000,
            permissions: {
              canCreateBooking: true,
              canCancelBooking: true,
              canProcessRefund: false,
              canManageVehicles: true
            }
          }
        ]
      }
    }
  },

  {
    name: "Vikram Singh",
    email: "vikram.indrapuri@vehicles.com",
    phone: "+917894561250",
    password: "password123",
    role: "seller",
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: true,
    avatar: "/uploads/avatars/vikram-singh.jpg",
    sellerProfile: {
      storeName: "Indrapuri Speed Rentals",
      storeDescription: "Fast and efficient vehicle rental services in Indrapuri with 24/7 support",
      storeAddress: "B-12, Sector 1, Indrapuri, Indore, MP 452020",
      storeStatus: "open",
      operatingHours: {
        monday: { open: "06:00", close: "23:00", isOpen: true },
        tuesday: { open: "06:00", close: "23:00", isOpen: true },
        wednesday: { open: "06:00", close: "23:00", isOpen: true },
        thursday: { open: "06:00", close: "23:00", isOpen: true },
        friday: { open: "06:00", close: "23:00", isOpen: true },
        saturday: { open: "06:00", close: "23:30", isOpen: true },
        sunday: { open: "07:00", close: "23:00", isOpen: true }
      },
      ratings: {
        average: 4.7,
        count: 156
      },
      isVerified: true,
      vehicleRentalService: {
        isEnabled: true,
        serviceStatus: "active",
        businessType: "individual",
          serviceZones: [
              {
          zoneName: "Indrapuri",
          zoneCode: "IND001",
          address: "Indrapuri, Indore, MP 452020",
          coordinates: {
            lat: 22.6708,
            lng: 75.9063
          },
          isActive: true,
          operatingHours: {
            monday: { open: "06:00", close: "23:00", isOpen: true },
            tuesday: { open: "06:00", close: "23:00", isOpen: true },
            wednesday: { open: "06:00", close: "23:00", isOpen: true },
            thursday: { open: "06:00", close: "23:00", isOpen: true },
            friday: { open: "06:00", close: "23:00", isOpen: true },
            saturday: { open: "06:00", close: "23:30", isOpen: true },
            sunday: { open: "07:00", close: "23:00", isOpen: true }
          },
          contactInfo: {
            phone: "+917894561250",
            email: "indrapuri@vehicles.com",
            managerName: "Vikram Singh"
          }
              }
          ],
        fleetStats: {
          totalVehicles: 28,
          activeVehicles: 26,
          vehicleCategories: {
            bikes: 10,
            cars: 6,
            scooties: 10,
            buses: 1,
            trucks: 1
          },
          lastUpdated: new Date()
        },
        businessSettings: {
          allowAdvanceBooking: true,
          maxAdvanceBookingDays: 20,
          minBookingHours: 2,
          cancellationPolicy: {
            freeUptoHours: 6,
            chargePercentage: [
              { hoursBeforeStart: 6, chargePercent: 0 },
              { hoursBeforeStart: 3, chargePercent: 25 },
              { hoursBeforeStart: 1, chargePercent: 50 }
            ]
          },
          securityDeposit: {
            defaultAmount: 1800,
            refundPolicy: "Security deposit refunded immediately after vehicle inspection"
          }
        },
        financialSettings: {
          commissionRate: 15,
          taxSettings: {
            gstRate: 18,
            serviceTaxRate: 0
          },
          paymentTerms: {
            settlementCycle: "weekly",
            minimumSettlementAmount: 800
          }
        },
        businessDocuments: {
          transportLicense: "/uploads/docs/transport-license-indrapuri.pdf",
          vehicleRegistrationCertificate: "/uploads/docs/vehicle-reg-indrapuri.pdf",
          insurancePolicy: "/uploads/docs/insurance-indrapuri.pdf",
          businessRegistration: "/uploads/docs/business-reg-indrapuri.pdf",
          gstCertificate: "/uploads/docs/gst-cert-indrapuri.pdf",
          bankAccountProof: "/uploads/docs/bank-proof-indrapuri.pdf",
          isVerified: true,
          verificationDate: new Date("2024-03-10"),
          verifiedBy: null
        },
        businessMetrics: {
          totalBookings: 1450,
          totalRevenue: 220000,
          averageRating: 4.7,
          ratingCount: 156,
          lastBookingDate: new Date(),
          popularVehicleTypes: ["bikes", "scooties", "cars"],
          peakHours: [
            { hour: 7, bookingCount: 32 },
            { hour: 18, bookingCount: 28 },
            { hour: 21, bookingCount: 25 }
          ]
        },
        staffMembers: [
          {
            name: "Ravi Kumar",
            phone: "+917894561251",
            role: "manager",
            assignedZones: ["IND001"],
            isActive: true,
            joiningDate: new Date("2023-05-20"),
            salary: 28000,
            permissions: {
              canCreateBooking: true,
              canCancelBooking: true,
              canProcessRefund: true,
              canManageVehicles: true
            }
          },
          {
            name: "Deepak Joshi",
            phone: "+917894561252",
            role: "mechanic",
            assignedZones: ["IND001"],
            isActive: true,
            joiningDate: new Date("2023-07-01"),
            salary: 22000,
            permissions: {
              canCreateBooking: false,
              canCancelBooking: false,
              canProcessRefund: false,
              canManageVehicles: true
            }
          }
        ]
      }
    }
  }
];

// Additional sellers for broader coverage
const additionalVehicleRentalSellers = [
  {
    name: "Anjali Mehta",
    email: "anjali.premium@vehicles.com",
    phone: "+917894561260",
    password: "password123",
    role: "seller",
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: true,
    avatar: "/uploads/avatars/anjali-mehta.jpg",
    sellerProfile: {
      storeName: "Premium Auto Hub",
      storeDescription: "Luxury and premium vehicle rental services across multiple zones",
      storeAddress: "ABC-15, Commercial Complex, Bholaram Ustad Marg, Indore",
      storeStatus: "open",
      operatingHours: {
        monday: { open: "09:00", close: "21:00", isOpen: true },
        tuesday: { open: "09:00", close: "21:00", isOpen: true },
        wednesday: { open: "09:00", close: "21:00", isOpen: true },
        thursday: { open: "09:00", close: "21:00", isOpen: true },
        friday: { open: "09:00", close: "21:00", isOpen: true },
        saturday: { open: "09:00", close: "22:00", isOpen: true },
        sunday: { open: "10:00", close: "20:00", isOpen: true }
      },
      ratings: {
        average: 4.8,
        count: 203
      },
      isVerified: true,
      vehicleRentalService: {
        isEnabled: true,
        serviceStatus: "active",
        businessType: "franchise",
        serviceZones: [
          {
            zoneName: "Bholaram Ustad Marg",
            zoneCode: "BUM002",
            address: "Bholaram Ustad Marg, Indore, MP 452001",
            coordinates: { lat: 22.7196, lng: 75.8577 },
            isActive: true,
            operatingHours: {
              monday: { open: "09:00", close: "21:00", isOpen: true },
              tuesday: { open: "09:00", close: "21:00", isOpen: true },
              wednesday: { open: "09:00", close: "21:00", isOpen: true },
              thursday: { open: "09:00", close: "21:00", isOpen: true },
              friday: { open: "09:00", close: "21:00", isOpen: true },
              saturday: { open: "09:00", close: "22:00", isOpen: true },
              sunday: { open: "10:00", close: "20:00", isOpen: true }
            },
            contactInfo: {
              phone: "+917894561260",
              email: "bholaram.premium@vehicles.com",
              managerName: "Anjali Mehta"
            }
          },
          {
            zoneName: "Vijaynagar",
            zoneCode: "VJN002",
            address: "Vijaynagar, Indore, MP 452010",
            coordinates: { lat: 22.7532, lng: 75.8937 },
            isActive: true,
            operatingHours: {
              monday: { open: "09:00", close: "21:00", isOpen: true },
              tuesday: { open: "09:00", close: "21:00", isOpen: true },
              wednesday: { open: "09:00", close: "21:00", isOpen: true },
              thursday: { open: "09:00", close: "21:00", isOpen: true },
              friday: { open: "09:00", close: "21:00", isOpen: true },
              saturday: { open: "09:00", close: "22:00", isOpen: true },
              sunday: { open: "10:00", close: "20:00", isOpen: true }
            },
            contactInfo: {
              phone: "+917894561261",
              email: "vijaynagar.premium@vehicles.com",
              managerName: "Rohit Agarwal"
            }
          }
        ],
        fleetStats: {
          totalVehicles: 65,
          activeVehicles: 62,
          vehicleCategories: {
            bikes: 20,
            cars: 25,
            scooties: 18,
            buses: 2,
            trucks: 0
          },
          lastUpdated: new Date()
        },
        businessSettings: {
          allowAdvanceBooking: true,
          maxAdvanceBookingDays: 45,
          minBookingHours: 6,
          cancellationPolicy: {
            freeUptoHours: 48,
            chargePercentage: [
              { hoursBeforeStart: 48, chargePercent: 0 },
              { hoursBeforeStart: 24, chargePercent: 15 },
              { hoursBeforeStart: 12, chargePercent: 35 },
              { hoursBeforeStart: 6, chargePercent: 65 }
            ]
          },
          securityDeposit: {
            defaultAmount: 3500,
            refundPolicy: "Security deposit refunded within 72 hours after comprehensive vehicle inspection"
          }
        },
        financialSettings: {
          commissionRate: 8,
          taxSettings: {
            gstRate: 18,
            serviceTaxRate: 0
          },
          paymentTerms: {
            settlementCycle: "monthly",
            minimumSettlementAmount: 5000
          }
        },
        businessDocuments: {
          transportLicense: "/uploads/docs/transport-license-premium.pdf",
          vehicleRegistrationCertificate: "/uploads/docs/vehicle-reg-premium.pdf",
          insurancePolicy: "/uploads/docs/insurance-premium.pdf",
          businessRegistration: "/uploads/docs/business-reg-premium.pdf",
          gstCertificate: "/uploads/docs/gst-cert-premium.pdf",
          bankAccountProof: "/uploads/docs/bank-proof-premium.pdf",
          isVerified: true,
          verificationDate: new Date("2023-12-01"),
          verifiedBy: null
        },
        businessMetrics: {
          totalBookings: 2150,
          totalRevenue: 485000,
          averageRating: 4.8,
          ratingCount: 203,
          lastBookingDate: new Date(),
          popularVehicleTypes: ["cars", "bikes", "scooties"],
          peakHours: [
            { hour: 10, bookingCount: 42 },
            { hour: 16, bookingCount: 38 },
            { hour: 19, bookingCount: 45 }
          ]
        },
        staffMembers: [
          {
            name: "Rohit Agarwal",
            phone: "+917894561261",
            role: "manager",
            assignedZones: ["VJN002"],
            isActive: true,
            joiningDate: new Date("2023-11-01"),
            salary: 35000,
            permissions: {
              canCreateBooking: true,
              canCancelBooking: true,
              canProcessRefund: true,
              canManageVehicles: true
            }
          },
          {
            name: "Sanjay Verma",
            phone: "+917894561262",
            role: "supervisor",
            assignedZones: ["BUM002"],
            isActive: true,
            joiningDate: new Date("2023-11-15"),
            salary: 30000,
            permissions: {
              canCreateBooking: true,
              canCancelBooking: true,
              canProcessRefund: false,
              canManageVehicles: true
            }
          }
        ]
      }
    }
  }
];

// Function to hash passwords for all users
const hashPasswords = async (sellers) => {
  for (let seller of sellers) {
    if (seller.password) {
      const salt = await bcrypt.genSalt(12);
      seller.password = await bcrypt.hash(seller.password, salt);
    }
  }
  return sellers;
};

// Export the data
module.exports = {
  vehicleRentalSellersData,
  additionalVehicleRentalSellers,
  allVehicleRentalSellers: [...vehicleRentalSellersData, ...additionalVehicleRentalSellers],
  hashPasswords,
  
  // Helper function to get sellers by zone
  getSellersByZone: (zoneName) => {
    const allSellers = [...vehicleRentalSellersData, ...additionalVehicleRentalSellers];
    return allSellers.filter(seller => 
      seller.sellerProfile.vehicleRentalService.serviceZones.some(zone => 
        zone.zoneName.toLowerCase().includes(zoneName.toLowerCase())
      )
    );
  },

  // Helper function to get zone statistics
  getZoneStatistics: () => {
    const zones = {
      "Bholaram Ustad Marg": { sellers: 0, totalVehicles: 0 },
      "Vijaynagar": { sellers: 0, totalVehicles: 0 },
      "Indrapuri": { sellers: 0, totalVehicles: 0 }
    };

    const allSellers = [...vehicleRentalSellersData, ...additionalVehicleRentalSellers];
    
    allSellers.forEach(seller => {
      seller.sellerProfile.vehicleRentalService.serviceZones.forEach(zone => {
        if (zones[zone.zoneName]) {
          zones[zone.zoneName].sellers++;
          zones[zone.zoneName].totalVehicles += seller.sellerProfile.vehicleRentalService.fleetStats.totalVehicles;
        }
      });
    });

    return zones;
  }
};

// Usage example for seeding database:
/*
const User = require('./models/User');
const { allVehicleRentalSellers, hashPasswords } = require('./mockData/vehicleRentalSellers');

async function seedVehicleRentalSellers() {
  try {
    const hashedSellers = await hashPasswords(allVehicleRentalSellers);
    await User.insertMany(hashedSellers);
    console.log('Vehicle rental sellers seeded successfully');
  } catch (error) {
    console.error('Error seeding vehicle rental sellers:', error);
  }
}
*/