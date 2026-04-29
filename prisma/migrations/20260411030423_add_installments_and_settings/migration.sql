-- CreateTable
CREATE TABLE "Installment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "loanId" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "paymentDate" DATETIME,
    "status" TEXT NOT NULL,
    "penalty" REAL NOT NULL DEFAULT 0,
    "capital" REAL NOT NULL,
    "interest" REAL NOT NULL,
    "insurance" REAL NOT NULL,
    "remainingBalance" REAL NOT NULL,
    CONSTRAINT "Installment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GlobalSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "productName" TEXT NOT NULL,
    "rate" REAL NOT NULL,
    "maxAmount" REAL NOT NULL,
    "minAmount" REAL NOT NULL,
    "maxDuration" INTEGER NOT NULL
);

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
    CONSTRAINT "Loan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Loan" ("amount", "duration", "id", "isDisbursed", "productName", "rejectionNote", "requestDate", "status", "userId") SELECT "amount", "duration", "id", "isDisbursed", "productName", "rejectionNote", "requestDate", "status", "userId" FROM "Loan";
DROP TABLE "Loan";
ALTER TABLE "new_Loan" RENAME TO "Loan";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "GlobalSettings_productName_key" ON "GlobalSettings"("productName");
