-- CreateEnum
CREATE TYPE "StudentLevel" AS ENUM ('ND1', 'ND2', 'HND1', 'HND2');

-- AlterTable: add level column, default existing rows to ND1, then remove default
ALTER TABLE "students" ADD COLUMN "level" "StudentLevel" NOT NULL DEFAULT 'ND1';
ALTER TABLE "students" ALTER COLUMN "level" DROP DEFAULT;
