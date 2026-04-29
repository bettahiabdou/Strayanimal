-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SUPERVISOR', 'AGENT', 'FIELD_TEAM');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING_INVITE');

-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('AGGRESSIVE', 'INJURED', 'STRAY');

-- CreateEnum
CREATE TYPE "AnimalType" AS ENUM ('DOG', 'CAT', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'IMPOSSIBLE', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReportSource" AS ENUM ('WEB_FORM', 'WHATSAPP', 'PHONE', 'AGENT_MANUAL');

-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('ASSIGNED', 'EN_ROUTE', 'ON_SITE', 'CAPTURED', 'IMPOSSIBLE');

-- CreateEnum
CREATE TYPE "MediaPurpose" AS ENUM ('CITIZEN_REPORT', 'POST_INTERVENTION');

-- CreateEnum
CREATE TYPE "AuditCategory" AS ENUM ('AUTH', 'REPORT', 'TEAM', 'SETTINGS', 'USER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "zone" TEXT,
    "preferredLocale" TEXT NOT NULL DEFAULT 'fr',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "isLead" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("userId","teamId")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "publicRef" TEXT NOT NULL,
    "source" "ReportSource" NOT NULL,
    "category" "ReportCategory" NOT NULL,
    "animalType" "AnimalType" NOT NULL,
    "animalCount" INTEGER NOT NULL DEFAULT 1,
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "rejectReason" TEXT,
    "citizenName" TEXT,
    "citizenPhone" TEXT,
    "preferredLocale" TEXT NOT NULL DEFAULT 'fr',
    "triagedById" TEXT,
    "triagedAt" TIMESTAMP(3),
    "assignedById" TEXT,
    "assignedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "status" "MissionStatus" NOT NULL DEFAULT 'ASSIGNED',
    "agentNote" TEXT,
    "fieldNote" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enRouteAt" TIMESTAMP(3),
    "onSiteAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "outcome" "MissionStatus",
    "durationMin" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "purpose" "MediaPurpose" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT,
    "contentType" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "category" "AuditCategory" NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "details" JSONB,
    "userId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_userId_key" ON "TeamMember"("userId");

-- CreateIndex
CREATE INDEX "TeamMember_teamId_idx" ON "TeamMember"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_publicRef_key" ON "Report"("publicRef");

-- CreateIndex
CREATE INDEX "Report_status_isUrgent_idx" ON "Report"("status", "isUrgent");

-- CreateIndex
CREATE INDEX "Report_receivedAt_idx" ON "Report"("receivedAt");

-- CreateIndex
CREATE INDEX "Report_zone_idx" ON "Report"("zone");

-- CreateIndex
CREATE UNIQUE INDEX "Mission_reportId_key" ON "Mission"("reportId");

-- CreateIndex
CREATE INDEX "Mission_teamId_status_idx" ON "Mission"("teamId", "status");

-- CreateIndex
CREATE INDEX "Mission_status_idx" ON "Mission"("status");

-- CreateIndex
CREATE INDEX "MediaAsset_reportId_purpose_idx" ON "MediaAsset"("reportId", "purpose");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_userId_idx" ON "AuditEvent"("userId");

-- CreateIndex
CREATE INDEX "AuditEvent_category_idx" ON "AuditEvent"("category");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_triagedById_fkey" FOREIGN KEY ("triagedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
