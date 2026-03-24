-- CreateTable
CREATE TABLE "AiPlatform" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "baseUrl" TEXT,
    "model" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isBackup" BOOLEAN NOT NULL DEFAULT false,
    "monthlyLimit" INTEGER,
    "usedTokens" INTEGER NOT NULL DEFAULT 0,
    "lastTested" DATETIME,
    "testStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AiLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platformId" TEXT NOT NULL,
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "cost" REAL NOT NULL DEFAULT 0,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "success" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiLog_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "AiPlatform" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AiPlatform_slug_key" ON "AiPlatform"("slug");
