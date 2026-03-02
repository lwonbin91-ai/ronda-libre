-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MatchSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" DATETIME NOT NULL,
    "location" TEXT,
    "maxPlayers" INTEGER NOT NULL DEFAULT 20,
    "maxGK" INTEGER NOT NULL DEFAULT 2,
    "fee" INTEGER NOT NULL,
    "recruitmentStart" DATETIME,
    "recruitmentEnd" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'RECRUITING',
    "videoUrl" TEXT,
    "videoTitle" TEXT,
    "seasonId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MatchSchedule_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MatchSchedule" ("createdAt", "description", "fee", "id", "location", "maxPlayers", "recruitmentEnd", "recruitmentStart", "scheduledAt", "seasonId", "status", "title", "type", "updatedAt", "videoTitle", "videoUrl") SELECT "createdAt", "description", "fee", "id", "location", "maxPlayers", "recruitmentEnd", "recruitmentStart", "scheduledAt", "seasonId", "status", "title", "type", "updatedAt", "videoTitle", "videoUrl" FROM "MatchSchedule";
DROP TABLE "MatchSchedule";
ALTER TABLE "new_MatchSchedule" RENAME TO "MatchSchedule";
CREATE TABLE "new_ScheduleRegistration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduleId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "isGK" BOOLEAN NOT NULL DEFAULT false,
    "fee" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScheduleRegistration_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "MatchSchedule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScheduleRegistration_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ScheduleRegistration" ("createdAt", "id", "paidAt", "playerId", "scheduleId", "status") SELECT "createdAt", "id", "paidAt", "playerId", "scheduleId", "status" FROM "ScheduleRegistration";
DROP TABLE "ScheduleRegistration";
ALTER TABLE "new_ScheduleRegistration" RENAME TO "ScheduleRegistration";
CREATE UNIQUE INDEX "ScheduleRegistration_scheduleId_playerId_key" ON "ScheduleRegistration"("scheduleId", "playerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
