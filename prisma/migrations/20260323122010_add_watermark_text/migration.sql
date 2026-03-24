-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CloudflareWorker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "workerUrl" TEXT NOT NULL,
    "secretKey" TEXT NOT NULL,
    "accountId" TEXT,
    "apiToken" TEXT,
    "workerName" TEXT,
    "watermarkText" TEXT NOT NULL DEFAULT 'Para Pusulası',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastTested" DATETIME,
    "testStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CloudflareWorker" ("accountId", "active", "apiToken", "createdAt", "id", "lastTested", "name", "secretKey", "testStatus", "updatedAt", "workerName", "workerUrl") SELECT "accountId", "active", "apiToken", "createdAt", "id", "lastTested", "name", "secretKey", "testStatus", "updatedAt", "workerName", "workerUrl" FROM "CloudflareWorker";
DROP TABLE "CloudflareWorker";
ALTER TABLE "new_CloudflareWorker" RENAME TO "CloudflareWorker";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
