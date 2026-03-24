-- CreateTable
CREATE TABLE "AgentPromptHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "userPromptTmpl" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentPromptHistory_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AutomationAgent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AutomationAgent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "platformSlug" TEXT NOT NULL DEFAULT 'deepseek',
    "model" TEXT NOT NULL DEFAULT 'deepseek-chat',
    "temperature" REAL NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 2000,
    "timeout" INTEGER NOT NULL DEFAULT 30000,
    "maxRetry" INTEGER NOT NULL DEFAULT 3,
    "order" INTEGER NOT NULL,
    "systemPrompt" TEXT,
    "userPromptTmpl" TEXT,
    "promptVersion" INTEGER NOT NULL DEFAULT 1,
    "lastRun" DATETIME,
    "lastStatus" TEXT,
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "totalCost" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AutomationAgent" ("active", "createdAt", "description", "id", "isCritical", "lastRun", "lastStatus", "maxRetry", "maxTokens", "model", "name", "order", "platformSlug", "role", "runCount", "slug", "temperature", "timeout", "totalCost", "totalTokens", "updatedAt") SELECT "active", "createdAt", "description", "id", "isCritical", "lastRun", "lastStatus", "maxRetry", "maxTokens", "model", "name", "order", "platformSlug", "role", "runCount", "slug", "temperature", "timeout", "totalCost", "totalTokens", "updatedAt" FROM "AutomationAgent";
DROP TABLE "AutomationAgent";
ALTER TABLE "new_AutomationAgent" RENAME TO "AutomationAgent";
CREATE UNIQUE INDEX "AutomationAgent_slug_key" ON "AutomationAgent"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
