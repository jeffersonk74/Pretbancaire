-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "duration" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "requestDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rejectionNote" TEXT,
    "isDisbursed" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
