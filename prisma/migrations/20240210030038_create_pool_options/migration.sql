-- CreateTable
CREATE TABLE "PoolOption" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,

    CONSTRAINT "PoolOption_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PoolOption" ADD CONSTRAINT "PoolOption_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
