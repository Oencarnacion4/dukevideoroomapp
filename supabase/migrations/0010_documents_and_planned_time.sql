-- Two independent additions:
--
-- 1. A "document" guide format — a title + intro plus either an uploaded
--    Word/PDF file (via the existing guide-media bucket) or a pasted
--    external link (Google Docs, Drive, etc.) — no written steps required,
--    for dropping in a document that already exists instead of retyping it.
--
-- 2. availability.kind — distinguishes the existing "busy" class/day-off
--    blocks (can't work) from new "planned" blocks: an intern marking when
--    they expect to come in outside a scheduled shift. Purely informational,
--    no approval step — unlike the 'proposed' shift status from migration
--    0009. Conflict-detection code only ever reads 'busy' rows; 'planned'
--    rows are additive and surfaced on the crew calendar for visibility.

alter table guides drop constraint if exists guides_format_check;
alter table guides add constraint guides_format_check
  check (format in ('written', 'video', 'document'));

alter table guides add column if not exists document_url text;
alter table guides add column if not exists document_name text;

alter table availability add column if not exists kind text not null default 'busy';
alter table availability drop constraint if exists availability_kind_check;
alter table availability add constraint availability_kind_check
  check (kind in ('busy', 'planned'));
