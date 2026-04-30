-- AlterTable
ALTER TABLE "MediaAsset" ADD COLUMN     "data" BYTEA,
ALTER COLUMN "storageKey" DROP NOT NULL;
