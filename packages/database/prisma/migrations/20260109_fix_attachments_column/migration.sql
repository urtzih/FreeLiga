-- AlterTable (Fix attachments column to LONGTEXT)
ALTER TABLE `bug_reports` MODIFY `attachments` LONGTEXT NULL;
