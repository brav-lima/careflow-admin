-- #10: cascade delete Subscription → Organization, Invoice → Subscription
ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "subscriptions_organization_id_fkey";
ALTER TABLE "subscriptions"
  ADD CONSTRAINT "subscriptions_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;

ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_subscription_id_fkey";
ALTER TABLE "invoices"
  ADD CONSTRAINT "invoices_subscription_id_fkey"
  FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE;

-- #11: unique constraint (organization_id, plan_id) on subscriptions
CREATE UNIQUE INDEX "subscriptions_organization_id_plan_id_key"
  ON "subscriptions"("organization_id", "plan_id");
