#!/bin/bash
# Script rápido para hacer un backup antes de trabajar

cd "$(dirname "$0")/.."

echo "🔐 Backup rápido antes de trabajar..."
./scripts/backup-database.sh

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Listo para trabajar de forma segura"
else
    echo ""
    echo "⚠️  Backup falló, pero puedes continuar"
fi
