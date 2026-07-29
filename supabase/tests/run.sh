#!/usr/bin/env bash
#
# Apply every migration to a throwaway database and run the schema tests against
# it. No Docker and no Supabase project needed — just a reachable Postgres 15+.
#
#   ./supabase/tests/run.sh
#
# Override the connection with PGHOST/PGPORT/PGUSER/PGPASSWORD as usual.
#
set -euo pipefail

DB="${SHRED_TEST_DB:-shred_schema_test}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "==> recreating database '$DB'"
dropdb --if-exists "$DB"
createdb "$DB"

run() { psql -v ON_ERROR_STOP=1 --quiet -d "$DB" -f "$1"; }

echo "==> applying local auth shim"
run "$ROOT/supabase/tests/00_shim_supabase.sql"

echo "==> applying migrations"
for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "    - $(basename "$f")"
  run "$f"
done

echo "==> running tests"
psql -v ON_ERROR_STOP=1 --quiet -d "$DB" -c 'create schema if not exists tests;'
psql -v ON_ERROR_STOP=1 -d "$DB" -f "$ROOT/supabase/tests/01_schema_test.sql"

echo "==> dropping '$DB'"
dropdb "$DB"
