/*
  Warnings:

  - A unique constraint covering the columns `[progressId,topicId]` on the table `topic_progress` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "topic_progress_progressId_topicId_key" ON "topic_progress"("progressId", "topicId");
