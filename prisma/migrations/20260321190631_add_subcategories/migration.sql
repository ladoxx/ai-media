-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT 'finans',
    "icon" TEXT NOT NULL DEFAULT '📰',
    "type" TEXT NOT NULL DEFAULT 'news',
    "parentId" TEXT,
    "menuOrder" INTEGER NOT NULL DEFAULT 0,
    "showInMenu" BOOLEAN NOT NULL DEFAULT true,
    "showInHome" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);
INSERT INTO "new_Category" ("color", "createdAt", "description", "icon", "id", "menuOrder", "name", "parentId", "showInHome", "showInMenu", "slug", "type") SELECT "color", "createdAt", "description", "icon", "id", "menuOrder", "name", "parentId", "showInHome", "showInMenu", "slug", "type" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
