-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "a2aAgentCard" JSONB,
ADD COLUMN     "a2aUrl" TEXT,
ADD COLUMN     "isA2A" BOOLEAN NOT NULL DEFAULT false;
