# ✅ Checklist de Implementación de Backups

## Instalación Inicial

- [ ] Los scripts se han creado en `/scripts/`
- [ ] El directorio `/backups/` está en `.gitignore`
- [ ] Los scripts tienen permisos de ejecución (Linux/Mac): `chmod +x scripts/*.sh`

## Prueba Local

- [ ] Ejecuté un backup manual y se creó correctamente
- [ ] Verifiqué que el archivo `.sql.gz` se creó en `/backups/`
- [ ] Probé restaurar el backup en un entorno de desarrollo
- [ ] El link simbólico `latest.sql.gz` se actualiza correctamente

## Automatización

### Windows
- [ ] Configuré tarea programada en Windows
- [ ] La tarea se ejecuta correctamente en horario programado
- [ ] Recibo notificaciones de errores (si configurado)

### Linux/Mac
- [ ] Configuré crontab para backups diarios
- [ ] Probé que el cron job se ejecuta correctamente
- [ ] Los logs se guardan correctamente

### Producción (Railway)
- [ ] Agregué secrets en GitHub (RAILWAY_DATABASE_URL)
- [ ] El workflow de GitHub Actions está habilitado
- [ ] Probé ejecutar el workflow manualmente
- [ ] Los backups se suben a GitHub Artifacts

## Verificación Continua

- [ ] Los backups se crean diariamente
- [ ] Los backups antiguos se eliminan después de 30 días
- [ ] El tamaño de los backups es razonable (comprimidos)
- [ ] Probé restaurar un backup real al menos una vez al mes

## Documentación

- [ ] El equipo conoce cómo hacer backups manuales
- [ ] El equipo conoce cómo restaurar backups
- [ ] Existe un plan de recuperación de desastres documentado
- [ ] Las credenciales están documentadas de forma segura

## Mejoras Futuras (Opcional)

- [ ] Configurar almacenamiento en cloud (S3, Azure Blob)
- [ ] Configurar notificaciones de éxito/fallo
- [ ] Crear backups antes de cada deployment
- [ ] Implementar backups incrementales
- [ ] Configurar réplicas de base de datos
- [ ] Monitorear el tamaño de los backups
- [ ] Automatizar pruebas de restauración

---

**Última revisión:** {{ fecha }}
**Responsable:** {{ nombre }}
**Estado:** [ ] Pendiente [ ] En progreso [ ] Completado
