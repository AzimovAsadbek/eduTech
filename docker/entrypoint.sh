#!/bin/sh
set -e
if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
  echo "▶ prisma migrate deploy"
  node node_modules/prisma/build/index.js migrate deploy
fi
exec "$@"
