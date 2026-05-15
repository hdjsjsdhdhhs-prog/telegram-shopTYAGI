ALTER TABLE "Product"
ADD COLUMN "stockQuantity" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Product"
ADD CONSTRAINT "Product_stockQuantity_nonnegative_check" CHECK ("stockQuantity" >= 0);

CREATE INDEX "Product_stockQuantity_idx" ON "Product"("stockQuantity");
