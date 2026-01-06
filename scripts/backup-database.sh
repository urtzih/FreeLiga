#!/bin/bash

# ====================================
# Sistema de Backup Automático MySQL
# ====================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE_ONLY=$(date +"%Y%m%d")

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

echo -e "${GREEN}🔄 Iniciando backup de base de datos...${NC}"
echo "📅 Fecha: $(date)"
echo "📁 Directorio: $BACKUP_DIR"

# Verificar si estamos en Railway o local
if [ -n "$RAILWAY_ENVIRONMENT" ]; then
    echo -e "${YELLOW}☁️  Detectado entorno Railway${NC}"
    
    # En Railway, usar las variables de entorno directamente
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\(.*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\(.*\)?.*/\1/p' | cut -d'?' -f1)
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\(.*\):.*/\1/p')
    DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/.*:\(.*\)@.*/\1/p')
    
    BACKUP_FILE="$BACKUP_DIR/railway_backup_${DATE_ONLY}_${TIMESTAMP}.sql.gz"
    
else
    echo -e "${YELLOW}🐳 Detectado entorno Docker local${NC}"
    
    # En local, usar Docker
    if [ ! -f .env ]; then
        echo -e "${RED}❌ Error: Archivo .env no encontrado${NC}"
        exit 1
    fi
    
    # Cargar variables del .env
    export $(cat .env | grep -v '^#' | xargs)
    
    CONTAINER_NAME="${MYSQL_CONTAINER_NAME:-freeliga-mysql}"
    DB_NAME="${MYSQL_DATABASE}"
    DB_USER="${MYSQL_USER}"
    DB_PASS="${MYSQL_PASSWORD}"
    
    BACKUP_FILE="$BACKUP_DIR/local_backup_${DATE_ONLY}_${TIMESTAMP}.sql.gz"
fi

# Realizar backup
echo -e "${GREEN}💾 Creando backup...${NC}"

if [ -n "$RAILWAY_ENVIRONMENT" ]; then
    # Backup en Railway
    MYSQL_PWD=$DB_PASS mysqldump \
        -h $DB_HOST \
        -P $DB_PORT \
        -u $DB_USER \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        --set-gtid-purged=OFF \
        $DB_NAME | gzip > "$BACKUP_FILE"
else
    # Backup en Docker local
    docker exec $CONTAINER_NAME mysqldump \
        -u $DB_USER \
        -p$DB_PASS \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        $DB_NAME | gzip > "$BACKUP_FILE"
fi

# Verificar si el backup fue exitoso
if [ $? -eq 0 ] && [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✅ Backup completado exitosamente${NC}"
    echo "📦 Archivo: $BACKUP_FILE"
    echo "📊 Tamaño: $BACKUP_SIZE"
    
    # Crear link simbólico al último backup
    ln -sf "$(basename $BACKUP_FILE)" "$BACKUP_DIR/latest.sql.gz"
    
    # Limpiar backups antiguos
    echo -e "${YELLOW}🧹 Limpiando backups antiguos (más de $RETENTION_DAYS días)...${NC}"
    find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    # Mostrar backups disponibles
    echo -e "${GREEN}📋 Backups disponibles:${NC}"
    ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -5
    
else
    echo -e "${RED}❌ Error al crear el backup${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Proceso completado${NC}"
