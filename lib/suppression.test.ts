import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sql = readFileSync(
  new URL(
    "../supabase/migrations/20261013161500_supprimer_mon_compte.sql",
    import.meta.url,
  ),
  "utf8",
);

test("supprimer_mon_compte ne vise que auth.uid()", () => {
  assert.match(sql, /security definer/);
  assert.match(sql, /set search_path = ''/);
  assert.match(sql, /auth\.uid\(\)/);
  assert.match(sql, /delete from auth\.users where id = auth\.uid\(\)/);
  assert.match(sql, /delete from public\.exploitations where owner_id = auth\.uid\(\)/);
  assert.match(
    sql,
    /grant execute on function public\.supprimer_mon_compte\(\) to authenticated/,
  );
  assert.match(sql, /revoke all on function public\.supprimer_mon_compte\(\) from public/);
  assert.match(sql, /revoke all on function public\.supprimer_mon_compte\(\) from anon/);
  assert.doesNotMatch(sql, /service_role/);
  assert.match(sql, /for delete/);
  assert.match(sql, /owner_id = \(select auth\.uid\(\)\)/);
});
