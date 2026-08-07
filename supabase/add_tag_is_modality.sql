-- Adds an explicit "is this a modality tag" flag to tags, so Settings can control which tags
-- show above the line (imaging modalities) vs below it (everything else), instead of that
-- being a hardcoded name list in the app.
--
-- Safe to run multiple times.

alter table tags add column if not exists is_modality boolean not null default false;

-- Preserve today's grouping for existing tags that match the app's old hardcoded list, so
-- nothing visually moves the moment this migration runs.
update tags
set is_modality = true
where lower(name) in ('x-ray', 'ct', 'dsa', 'mri', 'ultrasound', 'nuclear medicine', 'nuclear medicine bone')
  and is_modality = false;

-- To undo: alter table tags drop column if exists is_modality;
