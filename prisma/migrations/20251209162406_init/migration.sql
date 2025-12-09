-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'RECEPTIONIST', 'CASHIER', 'HOUSEKEEPER', 'WAITER');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'OCCUPIED', 'CLEANING', 'MAINTENANCE', 'OUT_OF_ORDER');

-- CreateEnum
CREATE TYPE "DateType" AS ENUM ('WEEKDAY', 'WEEKEND', 'HOLIDAY', 'HIGH_SEASON');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('INDIVIDUAL', 'CORPORATE', 'TRAVEL_AGENT');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'CHECKED_OUT', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "StayRecordStatus" AS ENUM ('OPEN', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StayDetailStatus" AS ENUM ('OCCUPIED', 'CHECKED_OUT');

-- CreateEnum
CREATE TYPE "ReservationDetailStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "FolioType" AS ENUM ('MASTER', 'GUEST', 'NON_RESIDENT');

-- CreateEnum
CREATE TYPE "FolioStatus" AS ENUM ('OPEN', 'CLOSED', 'VOID');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TransactionCategory" AS ENUM ('ROOM_CHARGE', 'SERVICE_CHARGE', 'SURCHARGE', 'PENALTY', 'DEPOSIT', 'PAYMENT', 'REFUND', 'ADJUSTMENT', 'DISCOUNT');

-- CreateEnum
CREATE TYPE "ServiceGroup" AS ENUM ('SURCHARGE', 'PENALTY', 'MINIBAR', 'SPA', 'LAUNDRY', 'F_AND_B', 'ROOM_SERVICE', 'OTHER');

-- CreateEnum
CREATE TYPE "HousekeepingStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'INSPECTING', 'PASSED', 'FAILED');

-- CreateEnum
CREATE TYPE "ShiftSessionStatus" AS ENUM ('OPEN', 'CLOSED', 'APPROVED');

-- CreateTable
CREATE TABLE "system_parameters" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_types" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "baseCapacity" INTEGER NOT NULL,
    "maxCapacity" INTEGER NOT NULL,
    "amenities" TEXT,
    "rackRate" DECIMAL(15,2) NOT NULL,
    "extraPersonFee" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "floor" INTEGER,
    "roomTypeId" INTEGER NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_policies" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "roomTypeId" INTEGER NOT NULL,
    "fromDate" DATE NOT NULL,
    "toDate" DATE NOT NULL,
    "dateType" "DateType" NOT NULL,
    "dayOfWeek" VARCHAR(20),
    "rateFactor" DECIMAL(5,2) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "unit" VARCHAR(50),
    "serviceGroup" "ServiceGroup" NOT NULL DEFAULT 'OTHER',
    "allowPromotion" BOOLEAN NOT NULL DEFAULT true,
    "allowDiscount" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "transactionFee" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "role" "Role" NOT NULL DEFAULT 'RECEPTIONIST',
    "userGroupId" INTEGER,
    "passwordHash" VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_shifts" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_schedules" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "shiftId" INTEGER NOT NULL,
    "workDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_tiers" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "pointsRequired" INTEGER NOT NULL DEFAULT 0,
    "roomDiscountFactor" DECIMAL(5,2) NOT NULL,
    "serviceDiscountFactor" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "tierId" INTEGER,
    "fullName" VARCHAR(200) NOT NULL,
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "idNumber" VARCHAR(50),
    "nationality" VARCHAR(100),
    "address" TEXT,
    "customerType" "CustomerType" NOT NULL DEFAULT 'INDIVIDUAL',
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "totalSpending" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalNights" INTEGER NOT NULL DEFAULT 0,
    "lastStayDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "voucherCode" VARCHAR(50),
    "fromDate" DATE NOT NULL,
    "toDate" DATE NOT NULL,
    "promotionType" "PromotionType" NOT NULL,
    "discountValue" DECIMAL(15,2) NOT NULL,
    "discountUnit" VARCHAR(10),
    "maxDiscountAmount" DECIMAL(15,2),
    "minimumNights" INTEGER,
    "status" "PromotionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "customerId" INTEGER NOT NULL,
    "reservationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedArrival" DATE NOT NULL,
    "expectedDeparture" DATE NOT NULL,
    "numberOfGuests" INTEGER NOT NULL DEFAULT 1,
    "depositRequired" DECIMAL(15,2),
    "depositPaid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "source" VARCHAR(50),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_details" (
    "id" SERIAL NOT NULL,
    "reservationId" INTEGER NOT NULL,
    "roomTypeId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "expectedRate" DECIMAL(15,2),
    "numberOfGuests" INTEGER NOT NULL DEFAULT 1,
    "status" "ReservationDetailStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservation_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stay_records" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "reservationId" INTEGER,
    "customerId" INTEGER,
    "checkInTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutTime" TIMESTAMP(3),
    "employeeId" INTEGER NOT NULL,
    "status" "StayRecordStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stay_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stay_details" (
    "id" SERIAL NOT NULL,
    "stayRecordId" INTEGER NOT NULL,
    "roomId" INTEGER NOT NULL,
    "roomAssignedTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedCheckOut" DATE NOT NULL,
    "actualCheckOut" TIMESTAMP(3),
    "lockedRate" DECIMAL(15,2),
    "numberOfGuests" INTEGER NOT NULL DEFAULT 1,
    "status" "StayDetailStatus" NOT NULL DEFAULT 'OCCUPIED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stay_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guests_in_residence" (
    "id" SERIAL NOT NULL,
    "stayDetailId" INTEGER NOT NULL,
    "fullName" VARCHAR(200) NOT NULL,
    "idType" VARCHAR(20),
    "idNumber" VARCHAR(50),
    "dateOfBirth" DATE,
    "nationality" VARCHAR(100),
    "address" TEXT,
    "phone" VARCHAR(20),
    "isMainGuest" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guests_in_residence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_folios" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "reservationId" INTEGER,
    "stayRecordId" INTEGER,
    "billToCustomerId" INTEGER NOT NULL,
    "folioType" "FolioType" NOT NULL DEFAULT 'GUEST',
    "status" "FolioStatus" NOT NULL DEFAULT 'OPEN',
    "totalCharges" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalPayments" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_folios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folio_transactions" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "guestFolioId" INTEGER NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postingDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "transactionType" "TransactionType" NOT NULL,
    "category" "TransactionCategory" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(15,2),
    "serviceId" INTEGER,
    "promotionId" INTEGER,
    "paymentMethodId" INTEGER,
    "employeeId" INTEGER NOT NULL,
    "stayDetailId" INTEGER,
    "isVoid" BOOLEAN NOT NULL DEFAULT false,
    "voidReason" TEXT,
    "voidBy" INTEGER,
    "voidAt" TIMESTAMP(3),
    "originalTxId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folio_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "guestFolioId" INTEGER NOT NULL,
    "invoiceToCustomerId" INTEGER NOT NULL,
    "taxId" VARCHAR(50),
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_details" (
    "id" SERIAL NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "transactionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_groups" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_functions" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "functionKey" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_functions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "functionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" SERIAL NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "blacklisted" BOOLEAN NOT NULL DEFAULT false,
    "employeeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "housekeeping_logs" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "status" "HousekeepingStatus" NOT NULL DEFAULT 'PENDING',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "inspectedBy" INTEGER,
    "inspectedAt" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "housekeeping_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_move_logs" (
    "id" SERIAL NOT NULL,
    "stayDetailId" INTEGER NOT NULL,
    "fromRoomId" INTEGER NOT NULL,
    "toRoomId" INTEGER NOT NULL,
    "moveTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "employeeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_move_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_sessions" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "shiftId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "openingBalance" DECIMAL(15,2) NOT NULL,
    "closingBalance" DECIMAL(15,2),
    "expectedBalance" DECIMAL(15,2),
    "variance" DECIMAL(15,2),
    "status" "ShiftSessionStatus" NOT NULL DEFAULT 'OPEN',
    "approvedBy" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_snapshots" (
    "id" SERIAL NOT NULL,
    "snapshotDate" DATE NOT NULL,
    "totalRooms" INTEGER NOT NULL,
    "availableRooms" INTEGER NOT NULL,
    "occupiedRooms" INTEGER NOT NULL,
    "reservedRooms" INTEGER NOT NULL,
    "outOfOrderRooms" INTEGER NOT NULL,
    "occupancyRate" DECIMAL(5,2) NOT NULL,
    "roomRevenue" DECIMAL(15,2) NOT NULL,
    "serviceRevenue" DECIMAL(15,2) NOT NULL,
    "surchargeRevenue" DECIMAL(15,2) NOT NULL,
    "penaltyRevenue" DECIMAL(15,2) NOT NULL,
    "totalRevenue" DECIMAL(15,2) NOT NULL,
    "newReservations" INTEGER NOT NULL DEFAULT 0,
    "cancelledReservations" INTEGER NOT NULL DEFAULT 0,
    "checkIns" INTEGER NOT NULL DEFAULT 0,
    "checkOuts" INTEGER NOT NULL DEFAULT 0,
    "noShows" INTEGER NOT NULL DEFAULT 0,
    "totalGuests" INTEGER NOT NULL DEFAULT 0,
    "averageDailyRate" DECIMAL(15,2) NOT NULL,
    "revPAR" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_inspections" (
    "id" SERIAL NOT NULL,
    "stayDetailId" INTEGER NOT NULL,
    "inspectedById" INTEGER NOT NULL,
    "inspectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "hasDamages" BOOLEAN NOT NULL DEFAULT false,
    "damageNotes" TEXT,
    "damageAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "hasMissingItems" BOOLEAN NOT NULL DEFAULT false,
    "missingItems" TEXT,
    "missingAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "hasViolations" BOOLEAN NOT NULL DEFAULT false,
    "violationNotes" TEXT,
    "penaltyAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalPenalty" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_parameters_name_key" ON "system_parameters"("name");

-- CreateIndex
CREATE UNIQUE INDEX "room_types_code_key" ON "room_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_code_key" ON "rooms"("code");

-- CreateIndex
CREATE UNIQUE INDEX "rate_policies_code_key" ON "rate_policies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "services_code_key" ON "services"("code");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_code_key" ON "payment_methods"("code");

-- CreateIndex
CREATE UNIQUE INDEX "employees_code_key" ON "employees"("code");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE UNIQUE INDEX "work_shifts_code_key" ON "work_shifts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "work_schedules_employeeId_workDate_key" ON "work_schedules"("employeeId", "workDate");

-- CreateIndex
CREATE UNIQUE INDEX "customer_tiers_code_key" ON "customer_tiers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "customers_code_key" ON "customers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "customers_idNumber_key" ON "customers"("idNumber");

-- CreateIndex
CREATE UNIQUE INDEX "promotions_code_key" ON "promotions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "promotions_voucherCode_key" ON "promotions"("voucherCode");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_code_key" ON "reservations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "stay_records_code_key" ON "stay_records"("code");

-- CreateIndex
CREATE UNIQUE INDEX "guest_folios_code_key" ON "guest_folios"("code");

-- CreateIndex
CREATE UNIQUE INDEX "folio_transactions_code_key" ON "folio_transactions"("code");

-- CreateIndex
CREATE INDEX "folio_transactions_guestFolioId_transactionDate_idx" ON "folio_transactions"("guestFolioId", "transactionDate");

-- CreateIndex
CREATE INDEX "folio_transactions_category_idx" ON "folio_transactions"("category");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_code_key" ON "invoices"("code");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_details_invoiceId_transactionId_key" ON "invoice_details"("invoiceId", "transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "user_groups_code_key" ON "user_groups"("code");

-- CreateIndex
CREATE UNIQUE INDEX "system_functions_code_key" ON "system_functions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "system_functions_functionKey_key" ON "system_functions"("functionKey");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_groupId_functionId_key" ON "permissions"("groupId", "functionId");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_token_key" ON "tokens"("token");

-- CreateIndex
CREATE INDEX "tokens_employeeId_idx" ON "tokens"("employeeId");

-- CreateIndex
CREATE INDEX "housekeeping_logs_roomId_status_idx" ON "housekeeping_logs"("roomId", "status");

-- CreateIndex
CREATE INDEX "housekeeping_logs_employeeId_idx" ON "housekeeping_logs"("employeeId");

-- CreateIndex
CREATE INDEX "room_move_logs_stayDetailId_idx" ON "room_move_logs"("stayDetailId");

-- CreateIndex
CREATE INDEX "shift_sessions_employeeId_startTime_idx" ON "shift_sessions"("employeeId", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "daily_snapshots_snapshotDate_key" ON "daily_snapshots"("snapshotDate");

-- CreateIndex
CREATE INDEX "daily_snapshots_snapshotDate_idx" ON "daily_snapshots"("snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "room_inspections_stayDetailId_key" ON "room_inspections"("stayDetailId");

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_policies" ADD CONSTRAINT "rate_policies_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_userGroupId_fkey" FOREIGN KEY ("userGroupId") REFERENCES "user_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "work_shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "customer_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_details" ADD CONSTRAINT "reservation_details_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_details" ADD CONSTRAINT "reservation_details_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stay_records" ADD CONSTRAINT "stay_records_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stay_records" ADD CONSTRAINT "stay_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stay_details" ADD CONSTRAINT "stay_details_stayRecordId_fkey" FOREIGN KEY ("stayRecordId") REFERENCES "stay_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stay_details" ADD CONSTRAINT "stay_details_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guests_in_residence" ADD CONSTRAINT "guests_in_residence_stayDetailId_fkey" FOREIGN KEY ("stayDetailId") REFERENCES "stay_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_folios" ADD CONSTRAINT "guest_folios_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_folios" ADD CONSTRAINT "guest_folios_stayRecordId_fkey" FOREIGN KEY ("stayRecordId") REFERENCES "stay_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_folios" ADD CONSTRAINT "guest_folios_billToCustomerId_fkey" FOREIGN KEY ("billToCustomerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folio_transactions" ADD CONSTRAINT "folio_transactions_guestFolioId_fkey" FOREIGN KEY ("guestFolioId") REFERENCES "guest_folios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folio_transactions" ADD CONSTRAINT "folio_transactions_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folio_transactions" ADD CONSTRAINT "folio_transactions_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folio_transactions" ADD CONSTRAINT "folio_transactions_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folio_transactions" ADD CONSTRAINT "folio_transactions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folio_transactions" ADD CONSTRAINT "folio_transactions_stayDetailId_fkey" FOREIGN KEY ("stayDetailId") REFERENCES "stay_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_guestFolioId_fkey" FOREIGN KEY ("guestFolioId") REFERENCES "guest_folios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_invoiceToCustomerId_fkey" FOREIGN KEY ("invoiceToCustomerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_details" ADD CONSTRAINT "invoice_details_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_details" ADD CONSTRAINT "invoice_details_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "folio_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "user_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_functionId_fkey" FOREIGN KEY ("functionId") REFERENCES "system_functions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "housekeeping_logs" ADD CONSTRAINT "housekeeping_logs_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "housekeeping_logs" ADD CONSTRAINT "housekeeping_logs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "housekeeping_logs" ADD CONSTRAINT "housekeeping_logs_inspectedBy_fkey" FOREIGN KEY ("inspectedBy") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_move_logs" ADD CONSTRAINT "room_move_logs_stayDetailId_fkey" FOREIGN KEY ("stayDetailId") REFERENCES "stay_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_move_logs" ADD CONSTRAINT "room_move_logs_fromRoomId_fkey" FOREIGN KEY ("fromRoomId") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_move_logs" ADD CONSTRAINT "room_move_logs_toRoomId_fkey" FOREIGN KEY ("toRoomId") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_move_logs" ADD CONSTRAINT "room_move_logs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_sessions" ADD CONSTRAINT "shift_sessions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_sessions" ADD CONSTRAINT "shift_sessions_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "work_shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_sessions" ADD CONSTRAINT "shift_sessions_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_inspections" ADD CONSTRAINT "room_inspections_stayDetailId_fkey" FOREIGN KEY ("stayDetailId") REFERENCES "stay_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_inspections" ADD CONSTRAINT "room_inspections_inspectedById_fkey" FOREIGN KEY ("inspectedById") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
