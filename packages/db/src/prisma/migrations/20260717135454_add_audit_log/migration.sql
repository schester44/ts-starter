-- CreateEnum
CREATE TYPE "audit_log_action_type" AS ENUM ('MEMBER_INVITED', 'MEMBER_REMOVED', 'MEMBER_ROLE_UPDATED', 'INVITATION_CANCELLED', 'SETTINGS_UPDATED');

-- CreateEnum
CREATE TYPE "audit_log_actor_type" AS ENUM ('USER', 'SYSTEM', 'API_KEY');

-- CreateEnum
CREATE TYPE "audit_log_entity_type" AS ENUM ('ORGANIZATION', 'USER', 'INVITATION', 'MEMBER', 'API_KEY');

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" TEXT NOT NULL,
    "action" "audit_log_action_type" NOT NULL,
    "entity_type" "audit_log_entity_type" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "actor_type" "audit_log_actor_type" NOT NULL,
    "actor_id" TEXT,
    "actor_name" VARCHAR(255),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log_entities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "audit_log_id" UUID NOT NULL,
    "entity_type" "audit_log_entity_type" NOT NULL,
    "entity_id" UUID NOT NULL,

    CONSTRAINT "audit_log_entities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_log_organization_id_entity_type_entity_id_occurred_at_idx" ON "audit_log"("organization_id", "entity_type", "entity_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "audit_log_organization_id_occurred_at_idx" ON "audit_log"("organization_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "audit_log_organization_id_actor_type_actor_id_idx" ON "audit_log"("organization_id", "actor_type", "actor_id");

-- CreateIndex
CREATE UNIQUE INDEX "audit_log_entities_audit_log_id_entity_type_entity_id_key" ON "audit_log_entities"("audit_log_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_log_entities_entity_type_entity_id_audit_log_id_idx" ON "audit_log_entities"("entity_type", "entity_id", "audit_log_id");

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log_entities" ADD CONSTRAINT "audit_log_entities_audit_log_id_fkey" FOREIGN KEY ("audit_log_id") REFERENCES "audit_log"("id") ON DELETE CASCADE ON UPDATE CASCADE;
