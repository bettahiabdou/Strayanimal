-- One-time data fix: the Setting singleton was seeded with the old short
-- commune name. Update it to the long official name, but ONLY if the
-- current value still equals the old default — so we don't clobber a
-- custom value an admin already entered through the Settings UI.

UPDATE "Setting"
SET "communeName" = 'Groupement des Collectivités Territoriales pour la Prévention et la Santé Publique - Ouarzazate'
WHERE "id" = 'platform'
  AND "communeName" = 'Groupement des communes territoriales — Ouarzazate';
