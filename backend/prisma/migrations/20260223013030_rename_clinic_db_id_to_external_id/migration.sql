-- AlterTable (idempotent: supports DBs that had clinic_db_id and those that didn't)
ALTER TABLE "organizations" DROP COLUMN IF EXISTS "clinic_db_id";
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "clinic_external_id" TEXT;
