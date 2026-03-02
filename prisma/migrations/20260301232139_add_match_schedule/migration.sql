-- CreateTable
CREATE TABLE "MatchSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" DATETIME NOT NULL,
    "location" TEXT,
    "maxPlayers" INTEGER NOT NULL DEFAULT 20,
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

-- CreateTable
CREATE TABLE "ScheduleRegistration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduleId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScheduleRegistration_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "MatchSchedule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScheduleRegistration_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleRegistration_scheduleId_playerId_key" ON "ScheduleRegistration"("scheduleId", "playerId");
