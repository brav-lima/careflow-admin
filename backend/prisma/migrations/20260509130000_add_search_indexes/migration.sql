-- CreateIndex
CREATE INDEX "organizations_clinic_external_id_idx" ON "organizations"("clinic_external_id");

-- CreateIndex
CREATE INDEX "invoices_external_reference_idx" ON "invoices"("external_reference");
