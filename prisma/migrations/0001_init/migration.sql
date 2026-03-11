-- Clients, Units, Maintenance, Quotes, Items, EmailNotifications, Users

CREATE TABLE "User" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'admin',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Client" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "address" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "ClientUnit" (
  "id" SERIAL PRIMARY KEY,
  "clientId" INT NOT NULL,
  "brand" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "powerKw" DOUBLE PRECISION,
  "serialNumber" TEXT,
  "installation" TIMESTAMP(3),
  "periodMonths" INT NOT NULL DEFAULT 12,
  "location" TEXT,
  "notes" TEXT,
  CONSTRAINT "ClientUnit_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "MaintenanceLog" (
  "id" SERIAL PRIMARY KEY,
  "unitId" INT NOT NULL,
  "performedDate" TIMESTAMP(3) NOT NULL,
  "description" TEXT,
  "materials" TEXT,
  "costInternal" INT,
  "technicianId" INT,
  "nextDue" TIMESTAMP(3),
  "photos" TEXT,
  CONSTRAINT "MaintenanceLog_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "ClientUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Quote" (
  "id" SERIAL PRIMARY KEY,
  "clientId" INT NOT NULL,
  "quoteNo" TEXT NOT NULL UNIQUE,
  "dateIssued" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "netTotal" INT,
  "vatAmount" INT,
  "grossTotal" INT,
  "profit" INT,
  "terms" TEXT,
  "pdfPath" TEXT,
  CONSTRAINT "Quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "QuoteItem" (
  "id" SERIAL PRIMARY KEY,
  "quoteId" INT NOT NULL,
  "name" TEXT NOT NULL,
  "basePriceNet" INT NOT NULL,
  "profitValue" INT NOT NULL,
  "profitType" TEXT NOT NULL,
  "finalPriceNet" INT NOT NULL,
  "qty" INT NOT NULL DEFAULT 1,
  CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "EmailNotifications" (
  "id" SERIAL PRIMARY KEY,
  "clientId" INT NOT NULL,
  "clientUnitId" INT NOT NULL,
  "notificationType" TEXT NOT NULL,
  "sentToEmail" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" TEXT NOT NULL,
  CONSTRAINT "EmailNotifications_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EmailNotifications_clientUnitId_fkey" FOREIGN KEY ("clientUnitId") REFERENCES "ClientUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Hasznos indexek
CREATE INDEX "idx_clientunit_client" ON "ClientUnit"("clientId");
CREATE INDEX "idx_maint_unit"       ON "MaintenanceLog"("unitId");
CREATE INDEX "idx_quote_client"      ON "Quote"("clientId");
CREATE INDEX "idx_item_quote"        ON "QuoteItem"("quoteId");
CREATE INDEX "idx_mail_client"       ON "EmailNotifications"("clientId");
CREATE INDEX "idx_mail_unit"         ON "EmailNotifications"("clientUnitId");

