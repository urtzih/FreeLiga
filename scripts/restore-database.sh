#!/bin/bash

# ====================================
# Sistema de Restauración MySQL
# ====================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
BACKUP_DIR="${BACKUP_DIR:-./backups}"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Sistema de Restauración MySQL        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Verificar si se proporcionó un archivo
if [ -z "$1" ]; then
    echo -e "${YELLOW}📋 Backups disponibles:${NC}"
    echo ""
    ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | awk '{print "   " $9 " (" $5 ")"}'
    echo ""
    echo -e "${YELLOW}💡 Uso:${NC}"
    echo "   ./scripts/restore-database.sh <archivo_backup>"
    echo "   ./scripts/restore-database.sh latest  (para usar el último backup)"
    echo ""
    exit 1
fi

# Determinar archivo de backup
if [ "$1" == "latest" ]; then
    BACKUP_FILE="$BACKUP_DIR/latest.sql.gz"
    if [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}❌ Error: No se encontró el último backup${NC}"
        exit 1
    fi
else
    BACKUP_FILE="$1"
    if [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}❌ Error: Archivo no encontrado: $BACKUP_FILE${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}📦 Archivo a restaurar: $BACKUP_FILE${NC}"
echo ""

# Verificar entorno
if [ -n "$RAILWAY_ENVIRONMENT" ]; then
    echo -e "${YELLOW}☁️  Detectado entorno Railway${NC}"
    
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\(.*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\(.*\)?.*/\1/p' | cut -d'?' -f1)
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\(.*\):.*/\1/p')
    DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/.*:\(.*\)@.*/\1/p')
    
    ENVIRONMENT="Railway (PRODUCCIÓN)"
else
    echo -e "${YELLOW}🐳 Detectado entorno Docker local${NC}"
    
    if [ ! -f .env ]; then
        echo -e "${RED}❌ Error: Archivo .env no encontrado${NC}"
        exit 1
    fi
    
    export $(cat .env | grep -v '^#' | xargs)
    
    CONTAINER_NAME="${MYSQL_CONTAINER_NAME:-freeliga-mysql}"
    DB_NAME="${MYSQL_DATABASE}"
    DB_USER="${MYSQL_USER}"
    DB_PASS="${MYSQL_PASSWORD}"
    
    ENVIRONMENT="Docker Local"
fi

# Confirmación
echo -e "${RED}⚠️  ADVERTENCIA: Esto sobrescribirá la base de datos actual${NC}"
echo -e "${YELLOW}   Entorno: $ENVIRONMENT${NC}"
echo -e "${YELLOW}   Base de datos: $DB_NAME${NC}"
echo ""
read -p "¿Estás seguro de que quieres continuar? (escribe 'si' para confirmar): " CONFIRM

if [ "$CONFIRM" != "si" ]; then
    echo -e "${YELLOW}❌ Restauración cancelada${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}🔄 Iniciando restauración...${NC}"

# Crear backup de seguridad antes de restaurar
echo -e "${YELLOW}📸 Creando backup de seguridad...${NC}"
SAFETY_BACKUP="$BACKUP_DIR/pre_restore_$(date +%Y%m%d_%H%M%S).sql.gz"

if [ -n "$RAILWAY_ENVIRONMENT" ]; then
    MYSQL_PWD=$DB_PASS mysqldump \
        -h $DB_HOST \
        -P $DB_PORT \
        -u $DB_USER \
        --single-transaction \
        $DB_NAME | gzip > "$SAFETY_BACKUP"
else
    docker exec $CONTAINER_NAME mysqldump \
        -u $DB_USER \
        -p$DB_PASS \
        --single-transaction \
        $DB_NAME | gzip > "$SAFETY_BACKUP"
fi

echo -e "${GREEN}✅ Backup de seguridad creado: $SAFETY_BACKUP${NC}"

# Restaurar backup
echo -e "${GREEN}💾 Restaurando base de datos...${NC}"

if [ -n "$RAILWAY_ENVIRONMENT" ]; then
    # Restaurar en Railway
    gunzip < "$BACKUP_FILE" | MYSQL_PWD=$DB_PASS mysql \
        -h $DB_HOST \
        -P $DB_PORT \
        -u $DB_USER \
        $DB_NAME
else
    # Restaurar en Docker local
    gunzip < "$BACKUP_FILE" | docker exec -i $CONTAINER_NAME mysql \
        -u $DB_USER \
        -p$DB_PASS \
        $DB_NAME
fi

# Verificar resultado
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ Restauración completada           ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}💡 Si algo salió mal, puedes restaurar el backup de seguridad:${NC}"
    echo -e "   ./scripts/restore-database.sh $SAFETY_BACKUP"
else
    echo ""
    echo -e "${RED}╔════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ Error en la restauración          ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}🔄 Restaurando backup de seguridad...${NC}"
    
    if [ -n "$RAILWAY_ENVIRONMENT" ]; then
        gunzip < "$SAFETY_BACKUP" | MYSQL_PWD=$DB_PASS mysql \
            -h $DB_HOST \
            -P $DB_PORT \
            -u $DB_USER \
            $DB_NAME
    else
        gunzip < "$SAFETY_BACKUP" | docker exec -i $CONTAINER_NAME mysql \
            -u $DB_USER \
            -p$DB_PASS \
            $DB_NAME
    fi
    
    exit 1
fi
