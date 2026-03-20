-- Quotes táblák létrehozása

CREATE TYPE "QuoteStatus" AS ENUM ('draft','sent','accepted','rejected');

CREATE TABLE "Quote" (
  "id" SERIAL PRIMARY KEY,
  "clientId" INTEGER NOT NULL,
  "title" TEXT,
  "status" "QuoteStatus" NOT NULL DEFAULT 'draft',
  "terms" TEXT,
  "netTotal" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "vatAmount" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "grossTotal" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE
);

CREATE TABLE "QuoteItem" (
  "id" SERIAL PRIMARY KEY,
  "quoteId" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" NUMERIC(12,3) NOT NULL DEFAULT 1,
  "unit" TEXT,
  "unitPriceNet" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "vatRate" NUMERIC(5,2) NOT NULL DEFAULT 27,
  "lineNet" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "lineVat" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "lineGross" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "costNet" NUMERIC(12,2),
  "profitAbs" NUMERIC(12,2),
  "profitPct" NUMERIC(5,2),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE
);

-- updatedAt trigger (opcionális, kényelmi)
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_quote_updated_at
BEFORE UPDATE ON "Quote"
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();
