#!/usr/bin/env bash
set -euo pipefail
host="$1"
user="$2"
export PGPASSWORD="$3"

until pg_isready -h "$host" -U "$user"; do
  >&2 echo "Postgres no está listo, reintentando..."
  sleep 2
done
>&2 echo "Postgres listo."
