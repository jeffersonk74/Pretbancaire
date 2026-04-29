-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Loan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "duration" INTEGER NOT NULL,
    "motif" TEXT,
    "status" TEXT NOT NULL,
    "requestDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rejectionNote" TEXT,
    "isDisbursed" BOOLEAN NOT NULL DEFAULT false,
    "isReadByGestionnaire" BOOLEAN NOT NULL DEFAULT false,
    "readAtGestionnaire" DATETIME,
    "isReadByDG" BOOLEAN NOT NULL DEFAULT false,
    "readAtDG" DATETIME,
    CONSTRAINT "Loan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Loan" ("amount", "duration", "id", "isDisbursed", "motif", "productName", "rejectionNote", "requestDate", "status", "userId") SELECT "amount", "duration", "id", "isDisbursed", "motif", "productName", "rejectionNote", "requestDate", "status", "userId" FROM "Loan";
DROP TABLE "Loan";
ALTER TABLE "new_Loan" RENAME TO "Loan";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
