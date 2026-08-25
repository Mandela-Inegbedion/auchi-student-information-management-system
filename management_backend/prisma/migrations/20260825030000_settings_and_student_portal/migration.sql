-- AlterTable: add password_hash to students (nullable for existing rows)
ALTER TABLE "students" ADD COLUMN "password_hash" VARCHAR(255);

-- CreateTable: system_settings
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique key for system_settings
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- Seed default system settings
INSERT INTO "system_settings" ("id", "key", "value", "updated_at")
VALUES
    (gen_random_uuid(), 'institution_name', 'Auchi Polytechnic', NOW()),
    (gen_random_uuid(), 'current_session',  '2025/2026',         NOW()),
    (gen_random_uuid(), 'current_semester', 'FIRST',             NOW());
