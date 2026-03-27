-- Add missing User columns (added via prisma db push, not migration)
ALTER TABLE "User" ADD COLUMN "systemRole" TEXT NOT NULL DEFAULT 'EDITOR';
ALTER TABLE "User" ADD COLUMN "roleId" TEXT;
ALTER TABLE "User" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "approvedBy" TEXT;
ALTER TABLE "User" ADD COLUMN "approvedAt" DATETIME;

-- CreateTable: Permission
CREATE TABLE IF NOT EXISTS "Permission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS "Permission_module_action_key" ON "Permission"("module", "action");

-- CreateTable: Role
CREATE TABLE IF NOT EXISTS "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "Role_slug_key" ON "Role"("slug");

-- CreateTable: RolePermission
CREATE TABLE IF NOT EXISTS "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    PRIMARY KEY ("roleId", "permissionId"),
    CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: UserPermission
CREATE TABLE IF NOT EXISTS "UserPermission" (
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY ("userId", "permissionId"),
    CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: ApiKeyViewLog
CREATE TABLE IF NOT EXISTS "ApiKeyViewLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "keyName" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable: SuperAdminToken
CREATE TABLE IF NOT EXISTS "SuperAdminToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "SuperAdminToken_userId_key" ON "SuperAdminToken"("userId");

-- Add FK index for User.roleId
CREATE INDEX IF NOT EXISTS "User_roleId_fkey" ON "User"("roleId");
