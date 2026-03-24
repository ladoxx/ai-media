-- CreateTable
CREATE TABLE "CloudflareWorker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "workerUrl" TEXT NOT NULL,
    "secretKey" TEXT NOT NULL,
    "accountId" TEXT,
    "apiToken" TEXT,
    "workerName" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastTested" DATETIME,
    "testStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
