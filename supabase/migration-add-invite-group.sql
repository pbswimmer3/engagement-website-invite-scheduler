-- Adds an `invite_group` column to the guests table.
-- Used to associate each invitee with one of the three families inviting them
-- (praanya, biswas, or jain) so the right email template is selected.

alter table guests
  add column if not exists invite_group text;

-- Optional: enforce the allowed values at the DB level.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'guests_invite_group_check'
  ) then
    alter table guests
      add constraint guests_invite_group_check
      check (invite_group is null or invite_group in ('praanya', 'biswas', 'jain'));
  end if;
end $$;
