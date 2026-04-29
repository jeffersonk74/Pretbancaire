-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GlobalSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productName" TEXT NOT NULL,
    "rate" REAL NOT NULL,
    "maxAmount" REAL NOT NULL,
    "minAmount" REAL NOT NULL,
    "maxDuration" INTEGER NOT NULL
);
INSERT INTO "new_GlobalSettings" ("id", "maxAmount", "maxDuration", "minAmount", "productName", "rate") SELECT "id", "maxAmount", "maxDuration", "minAmount", "productName", "rate" FROM "GlobalSettings";
DROP TABLE "GlobalSettings";
ALTER TABLE "new_GlobalSettings" RENAME TO "GlobalSettings";
CREATE UNIQUE INDEX "GlobalSettings_productName_key" ON "GlobalSettings"("productName");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
