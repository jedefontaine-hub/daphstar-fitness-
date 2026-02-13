-- CreateTable
CREATE TABLE "Village" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Village_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Village_name_key" ON "Village"("name");

-- Insert default villages
INSERT INTO "Village" ("id", "name", "createdAt", "updatedAt") VALUES
('vil-1', 'Sunrise Village', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('vil-2', 'Oakwood Gardens', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('vil-3', 'Meadow Creek', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('vil-4', 'Lakeside Manor', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('vil-5', 'Hillcrest Retirement', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
