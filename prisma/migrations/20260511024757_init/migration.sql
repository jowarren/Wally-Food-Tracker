-- CreateTable
CREATE TABLE "FoodEntry" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "mealTime" TEXT NOT NULL,
    "foodName" TEXT NOT NULL,
    "reaction" TEXT NOT NULL,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FoodEntry_date_idx" ON "FoodEntry"("date");

-- CreateIndex
CREATE INDEX "FoodEntry_foodName_idx" ON "FoodEntry"("foodName");
