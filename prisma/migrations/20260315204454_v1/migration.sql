-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PLAYER', 'RAID_LEADER', 'OFFICER', 'ADMIN');

-- CreateEnum
CREATE TYPE "RaidStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ReservationFormStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "CharacterClass" AS ENUM ('WARRIOR', 'PALADIN', 'HUNTER', 'ROGUE', 'PRIEST', 'DEATH_KNIGHT', 'SHAMAN', 'MAGE', 'WARLOCK', 'MONK', 'DRUID', 'DEMON_HUNTER', 'EVOKER');

-- CreateEnum
CREATE TYPE "ReserveStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'FULFILLED');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('HELM', 'SHOULDER', 'BACK', 'CHEST', 'WRIST', 'HANDS', 'WAIST', 'LEGS', 'FEET', 'NECK', 'FINGER', 'TRINKET', 'WEAPON', 'SHIELD', 'OFF_HAND');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PLAYER',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "raids" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "status" "RaidStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raid_attendances" (
    "id" TEXT NOT NULL,
    "raid_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "attended" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raid_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_forms" (
    "id" TEXT NOT NULL,
    "week_of" TIMESTAMP(3) NOT NULL,
    "opens_at" TIMESTAMP(3) NOT NULL,
    "closes_at" TIMESTAMP(3) NOT NULL,
    "status" "ReservationFormStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservation_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bosses" (
    "id" TEXT NOT NULL,
    "raid_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bosses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "boss_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "item_type" "ItemType" NOT NULL,
    "ilvl" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "class" "CharacterClass" NOT NULL,
    "spec" TEXT NOT NULL,
    "realm" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserves" (
    "id" TEXT NOT NULL,
    "raid_id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "status" "ReserveStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reserves_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "raids_date_key" ON "raids"("date");

-- CreateIndex
CREATE UNIQUE INDEX "raid_attendances_raid_id_user_id_key" ON "raid_attendances"("raid_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "reservation_forms_week_of_key" ON "reservation_forms"("week_of");

-- CreateIndex
CREATE UNIQUE INDEX "bosses_raid_id_order_index_key" ON "bosses"("raid_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "characters_name_realm_key" ON "characters"("name", "realm");

-- CreateIndex
CREATE UNIQUE INDEX "reserves_raid_id_character_id_item_name_key" ON "reserves"("raid_id", "character_id", "item_name");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raids" ADD CONSTRAINT "raids_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raid_attendances" ADD CONSTRAINT "raid_attendances_raid_id_fkey" FOREIGN KEY ("raid_id") REFERENCES "raids"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raid_attendances" ADD CONSTRAINT "raid_attendances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raid_attendances" ADD CONSTRAINT "raid_attendances_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bosses" ADD CONSTRAINT "bosses_raid_id_fkey" FOREIGN KEY ("raid_id") REFERENCES "raids"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_boss_id_fkey" FOREIGN KEY ("boss_id") REFERENCES "bosses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserves" ADD CONSTRAINT "reserves_raid_id_fkey" FOREIGN KEY ("raid_id") REFERENCES "raids"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserves" ADD CONSTRAINT "reserves_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
