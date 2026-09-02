-- =========================================================
-- INIT.SQL FOR TRAVEL SHUTTLE DATABASE (POSTGRESQL)
-- KETERANGAN LOGIN ADMIN:
-- Email    : admin@travel.com
-- Password : password123 
-- =========================================================

-- Enable pgcrypto extension for UUID generation (if needed)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (Clean Setup)
DROP TABLE IF EXISTS "package_bookings" CASCADE;
DROP TABLE IF EXISTS "charters" CASCADE;
DROP TABLE IF EXISTS "bookings" CASCADE;
DROP TABLE IF EXISTS "schedules" CASCADE;
DROP TABLE IF EXISTS "drivers" CASCADE;
DROP TABLE IF EXISTS "vehicles" CASCADE;
DROP TABLE IF EXISTS "seat_templates" CASCADE;
DROP TABLE IF EXISTS "routes" CASCADE;
DROP TABLE IF EXISTS "cities" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "qris_settings" CASCADE;
DROP TABLE IF EXISTS "social_settings" CASCADE;

-- Drop existing enum types if they exist
DROP TYPE IF EXISTS "UserRole" CASCADE;
DROP TYPE IF EXISTS "BookingStatus" CASCADE;
DROP TYPE IF EXISTS "VehicleStatus" CASCADE;
DROP TYPE IF EXISTS "DriverStatus" CASCADE;
DROP TYPE IF EXISTS "RecurringType" CASCADE;
DROP TYPE IF EXISTS "ScheduleStatus" CASCADE;
DROP TYPE IF EXISTS "CharterStatus" CASCADE;
DROP TYPE IF EXISTS "PackageStatus" CASCADE;

-- ---------------------------------------------------------
-- CREATE ENUM TYPES
-- ---------------------------------------------------------
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OPERATOR', 'DRIVER', 'CUSTOMER');
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'PAID', 'CONFIRMED', 'CANCELLED');
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'INACTIVE');
CREATE TYPE "DriverStatus" AS ENUM ('ACTIVE', 'OFF_DUTY', 'INACTIVE');
CREATE TYPE "RecurringType" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY');
CREATE TYPE "ScheduleStatus" AS ENUM ('SCHEDULED', 'DEPARTED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "CharterStatus" AS ENUM ('PENDING', 'PAID', 'PROCESSED', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
CREATE TYPE "PackageStatus" AS ENUM ('PENDING', 'PAID', 'PROCESSED', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- ---------------------------------------------------------
-- CREATE TABLES
-- ---------------------------------------------------------

-- 1. Users Table
CREATE TABLE "users" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- 2. Cities Table
CREATE TABLE "cities" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- 3. Routes Table
CREATE TABLE "routes" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "originCityId" TEXT NOT NULL,
    "destinationCityId" TEXT NOT NULL,
    "distance" INTEGER NOT NULL,
    "estimatedTime" INTEGER NOT NULL,
    "basePrice" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- 4. Seat Templates Table
CREATE TABLE "seat_templates" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rowsConfig" JSONB NOT NULL,
    "totalSeats" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seat_templates_pkey" PRIMARY KEY ("id")
);

-- 5. Vehicles Table
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "plateNumber" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "seatTemplateId" TEXT,
    "description" TEXT,
    "facilities" JSONB,
    "imageUrl" TEXT,
    "maxCharter" INTEGER NOT NULL DEFAULT 0,
    "charterPrice" INTEGER NOT NULL DEFAULT 0,
    "maxPackageCount" INTEGER NOT NULL DEFAULT 0,
    "maxPackageWeight" INTEGER NOT NULL DEFAULT 0,
    "packagePricePerKg" INTEGER NOT NULL DEFAULT 0,
    "status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- 6. Drivers Table
CREATE TABLE "drivers" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "status" "DriverStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- 7. Schedules Table
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "routeId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "departureTime" TEXT NOT NULL,
    "ticketPrice" INTEGER NOT NULL,
    "availableSeats" INTEGER NOT NULL,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "recurringType" "RecurringType" NOT NULL DEFAULT 'NONE',
    "recurringDays" JSONB,
    "templateName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sourceTemplateId" TEXT,
    "poolOrigin" TEXT,
    "poolDestination" TEXT,
    "imageUrl" TEXT,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'SCHEDULED',
    "actualDepartureTime" TIMESTAMP(3),
    "actualArrivalTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- 8. Bookings Table
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "bookingCode" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "seatNumbers" TEXT[] NOT NULL,
    "totalSeats" INTEGER NOT NULL,
    "totalPrice" INTEGER NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "paidAt" TIMESTAMP(3),
    "paymentDeadline" TIMESTAMP(3),
    "passengerName" TEXT,
    "passengerPhone" TEXT,
    "passengerEmail" TEXT,
    "passengerNik" TEXT,
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,
    "checkInTime" TIMESTAMP(3),
    "checkInBy" TEXT,
    "paymentProofUrl" TEXT,
    "paymentSenderName" TEXT,
    "paymentBankName" TEXT,
    "paymentTargetBank" TEXT,
    "paymentAmount" INTEGER,
    "paymentNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- 9. QRIS Settings Table
CREATE TABLE "qris_settings" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "accountName" TEXT DEFAULT 'PT Travel Shuttle Indonesia',
    "imageUrl" TEXT,
    "instruction" TEXT DEFAULT 'Scan QR Code QRIS di bawah menggunakan mobile banking atau e-wallet (GoPay/OVO/Dana/ShopeePay)',
    "bankBca" TEXT DEFAULT '123-456-7890 (a.n. PT Travel Shuttle Indonesia)',
    "bankMandiri" TEXT DEFAULT '987-000-112233 (a.n. PT Travel Shuttle Indonesia)',
    "bankOther" TEXT,
    "waNumber" TEXT DEFAULT '6281234567890',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qris_settings_pkey" PRIMARY KEY ("id")
);

-- 10. Social Settings Table
CREATE TABLE "social_settings" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "instagramUrl" TEXT DEFAULT 'https://instagram.com',
    "twitterUrl" TEXT DEFAULT 'https://twitter.com',
    "youtubeUrl" TEXT DEFAULT 'https://youtube.com',
    "facebookUrl" TEXT DEFAULT 'https://facebook.com',
    "linkedinUrl" TEXT DEFAULT 'https://linkedin.com',
    "threadsUrl" TEXT DEFAULT 'https://threads.net',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_settings_pkey" PRIMARY KEY ("id")
);

-- 11. Charters Table
CREATE TABLE "charters" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "charterCode" TEXT NOT NULL,
    "userId" TEXT,
    "vehicleId" TEXT NOT NULL,
    "originCityId" TEXT,
    "destinationCityId" TEXT,
    "originAddress" TEXT NOT NULL,
    "destinationAddress" TEXT NOT NULL,
    "charterDate" TIMESTAMP(3) NOT NULL,
    "durationDays" INTEGER NOT NULL DEFAULT 1,
    "totalVehicles" INTEGER NOT NULL DEFAULT 1,
    "totalPrice" INTEGER NOT NULL,
    "status" "CharterStatus" NOT NULL DEFAULT 'PENDING',
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "notes" TEXT,
    "paymentMethod" TEXT,
    "paidAt" TIMESTAMP(3),
    "paymentDeadline" TIMESTAMP(3),
    "paymentProofUrl" TEXT,
    "paymentSenderName" TEXT,
    "paymentBankName" TEXT,
    "paymentTargetBank" TEXT,
    "paymentAmount" INTEGER,
    "paymentNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "charters_pkey" PRIMARY KEY ("id")
);

-- 12. Package Bookings Table
CREATE TABLE "package_bookings" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "packageCode" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "userId" TEXT,
    "senderName" TEXT NOT NULL,
    "senderPhone" TEXT NOT NULL,
    "senderAddress" TEXT,
    "recipientName" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "recipientAddress" TEXT NOT NULL,
    "packageDescription" TEXT NOT NULL,
    "itemCount" INTEGER NOT NULL DEFAULT 1,
    "weightKg" INTEGER NOT NULL DEFAULT 1,
    "totalPrice" INTEGER NOT NULL,
    "status" "PackageStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "paidAt" TIMESTAMP(3),
    "paymentDeadline" TIMESTAMP(3),
    "paymentProofUrl" TEXT,
    "paymentSenderName" TEXT,
    "paymentBankName" TEXT,
    "paymentTargetBank" TEXT,
    "paymentAmount" INTEGER,
    "paymentNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_bookings_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------
-- CREATE UNIQUE INDEXES
-- ---------------------------------------------------------
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "seat_templates_name_key" ON "seat_templates"("name");
CREATE UNIQUE INDEX "vehicles_plateNumber_key" ON "vehicles"("plateNumber");
CREATE UNIQUE INDEX "drivers_userId_key" ON "drivers"("userId");
CREATE UNIQUE INDEX "drivers_licenseNumber_key" ON "drivers"("licenseNumber");
CREATE UNIQUE INDEX "bookings_bookingCode_key" ON "bookings"("bookingCode");
CREATE UNIQUE INDEX "charters_charterCode_key" ON "charters"("charterCode");
CREATE UNIQUE INDEX "package_bookings_packageCode_key" ON "package_bookings"("packageCode");

-- ---------------------------------------------------------
-- CREATE FOREIGN KEY CONSTRAINTS
-- ---------------------------------------------------------
ALTER TABLE "routes" ADD CONSTRAINT "routes_originCityId_fkey" FOREIGN KEY ("originCityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "routes" ADD CONSTRAINT "routes_destinationCityId_fkey" FOREIGN KEY ("destinationCityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_seatTemplateId_fkey" FOREIGN KEY ("seatTemplateId") REFERENCES "seat_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "drivers" ADD CONSTRAINT "drivers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "schedules" ADD CONSTRAINT "schedules_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_sourceTemplateId_fkey" FOREIGN KEY ("sourceTemplateId") REFERENCES "schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "charters" ADD CONSTRAINT "charters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "charters" ADD CONSTRAINT "charters_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "charters" ADD CONSTRAINT "charters_originCityId_fkey" FOREIGN KEY ("originCityId") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "charters" ADD CONSTRAINT "charters_destinationCityId_fkey" FOREIGN KEY ("destinationCityId") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "package_bookings" ADD CONSTRAINT "package_bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "package_bookings" ADD CONSTRAINT "package_bookings_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------
-- SEED DATA (INITIAL USERS & SETTINGS)
-- Password for all seed users is: password123
-- ---------------------------------------------------------

INSERT INTO "users" ("id", "email", "password", "name", "phone", "role") VALUES
('usr_admin_001', 'admin@travel.com', '$2a$10$l52HuaHYshtpYkOy2nLX8u59uLfiA7UkYqNBJO1FhNFwsZmUOtF5e', 'Admin Travel', '081234567890', 'ADMIN'),
('usr_operator_001', 'operator@travel.com', '$2a$10$l52HuaHYshtpYkOy2nLX8u59uLfiA7UkYqNBJO1FhNFwsZmUOtF5e', 'Operator Travel', '081234567891', 'OPERATOR'),
('usr_driver_001', 'driver@travel.com', '$2a$10$l52HuaHYshtpYkOy2nLX8u59uLfiA7UkYqNBJO1FhNFwsZmUOtF5e', 'Driver Budi', '081234567892', 'DRIVER'),
('usr_customer_001', 'customer@travel.com', '$2a$10$l52HuaHYshtpYkOy2nLX8u59uLfiA7UkYqNBJO1FhNFwsZmUOtF5e', 'Customer Test', '081234567893', 'CUSTOMER');

-- Initial Cities
INSERT INTO "cities" ("id", "name", "province") VALUES
('jakarta-id', 'Jakarta', 'DKI Jakarta'),
('bandung-id', 'Bandung', 'Jawa Barat'),
('surabaya-id', 'Surabaya', 'Jawa Timur'),
('yogyakarta-id', 'Yogyakarta', 'DI Yogyakarta'),
('cirebon-id', 'Cirebon', 'Jawa Barat'),
('semarang-id', 'Semarang', 'Jawa Tengah');

-- Initial Settings
INSERT INTO "qris_settings" ("id", "accountName", "instruction", "bankBca", "bankMandiri", "waNumber", "isActive") VALUES
('qris_setting_001', 'PT Travel Shuttle Indonesia', 'Scan QR Code QRIS di bawah menggunakan mobile banking atau e-wallet (GoPay/OVO/Dana/ShopeePay)', '123-456-7890 (a.n. PT Travel Shuttle Indonesia)', '987-000-112233 (a.n. PT Travel Shuttle Indonesia)', '6281234567890', true);

INSERT INTO "social_settings" ("id", "instagramUrl", "twitterUrl", "youtubeUrl", "facebookUrl", "linkedinUrl", "threadsUrl", "isActive") VALUES
('social_setting_001', 'https://instagram.com', 'https://twitter.com', 'https://youtube.com', 'https://facebook.com', 'https://linkedin.com', 'https://threads.net', true);
