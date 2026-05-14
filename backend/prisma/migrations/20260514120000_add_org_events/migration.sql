-- CreateEnum
CREATE TYPE "OrgEventType" AS ENUM ('ORG_CREATED', 'STATUS_CHANGED', 'SUBSCRIPTION_STARTED', 'SUBSCRIPTION_CANCELED', 'PLAN_CHANGED', 'TRIAL_STARTED', 'TRIAL_CONVERTED', 'INVOICE_PAID', 'INVOICE_OVERDUE', 'USER_ADDED', 'USER_REMOVED', 'PASSWORD_RESET');

-- CreateTable
CREATE TABLE "org_events" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "type" "OrgEventType" NOT NULL,
    "payload" JSONB,
    "actor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "org_events_organization_id_created_at_idx" ON "org_events"("organization_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "org_events" ADD CONSTRAINT "org_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
