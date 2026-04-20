-- Make gamesP1 and gamesP2 nullable for scheduled matches
ALTER TABLE `matches` MODIFY `gamesP1` INTEGER NULL;
ALTER TABLE `matches` MODIFY `gamesP2` INTEGER NULL;
