# 🛡️ Checklist RGPD y Cumplimiento Legal

**Fecha de creación:** 28 de febrero de 2026  
**Estado:** En progreso  
**Criticidad:** ALTA - Requiere atención legal inmediata

---

## 📋 Cumplimiento RGPD - Estado Actual

### ✅ Completado
- [x] Política de Privacidad creada (`/privacy`)
- [x] Términos de Servicio creados (`/terms`)
- [x] Aviso Legal creado (`/legal`)
- [x] Enlaces legales en footer

### ⚠️ Pendiente de Implementación

#### 1. **Consentimiento de Datos**
- [ ] Modal de consentimiento al primer acceso
- [ ] Checkbox específico para:
  - [ ] Procesamiento de datos personales
  - [ ] Acceso a Google Calendar
  - [ ] Uso de datos para estadísticas
  - [ ] Comunicaciones por email
- [ ] Guardar consentimiento en base de datos
- [ ] Permitir revocar consentimiento en perfil

#### 2. **Derechos de Usuario (API)**
- [ ] Endpoint: Descargar todos mis datos (GDPR Export)
- [ ] Endpoint: Eliminar mi cuenta (Derecho al olvido)
- [ ] Endpoint: Exportar datos en formato JSON/CSV
- [ ] Sistema de logging para auditoría

#### 3. **Gestión de Cookies**
- [ ] Banner de cookies (técnicas vs opcionales)
- [ ] Mostrar antes de Google Calendar integration
- [ ] localStorage clara sobre su contenido

#### 4. **Data Processing**
- [ ] Actualizar DPA (Data Processing Agreement) si usas Railway
- [ ] Documentar flujo de datos hacia servicios third-party
- [ ] Configurar encriptación en tránsito (ya OK: HTTPS)
- [ ] Encriptación en reposo (base de datos MySQL)

#### 5. **Período de Retención**
- [ ] Implementar eliminación automática de:
  - [ ] Logs de error (90 días)
  - [ ] Datos de bug reports (90 días)
  - [ ] Token de Google Calendar (al revocar)
- [ ] Documentar en qué tabla se almacena cada dato

#### 6. **Incident Response**
- [ ] Crear procedimiento para data breaches
- [ ] Notificación a AEPD en 72 horas si es grave
- [ ] Documentar breaches en log
- [ ] Contactar usuarios afectados

#### 7. **Audit Trail**
- [ ] Registrar cambios de datos sensibles:
  - [ ] Cambio de email
  - [ ] Cambio de contraseña
  - [ ] Cambio de rol
  - [ ] Eliminación de usuario
- [ ] Quién hizo el cambio (admin) y cuándo

#### 8. **Cumplimiento de Roles**
- [ ] Designar: **Data Protection Officer (DPO)** o responsable
- [ ] Designar: **Responsable técnico** de seguridad
- [ ] Documentar organigrama de responsabilidades
- [ ] Comunicar a usuarios quién es el responsable

---

## 📊 Análisis de Datos Actuales

### Datos Personales Identificables
| Campo | Tipo | Base Legal | Retención | Sensibilidad |
|-------|------|-----------|-----------|--------------|
| email | Obligatorio | Contrato | Mientras activo | 🟡 Media |
| password (hash) | Obligatorio | Contrato | Mientras activo | 🔴 Alta |
| nombre | Obligatorio | Contrato | Indefinido* | 🟡 Media |
| apodo | Opcional | Contrato | Indefinido* | 🟢 Baja |
| teléfono | Opcional | Consentimiento | Mientras autorizado | 🟡 Media |
| googleCalendarToken | Opcional | Consentimiento | Mientras activo | 🔴 Alta |
| resultados partidos | Derivado | Interés legítimo | Indefinido* | 🟢 Baja |
| cuotas pagadas | Derivado | Interés legítimo | 3 años (fiscal) | 🟡 Media |
| lastConnection | Derivado | Interés legítimo | 90 días | 🟢 Baja |

*Indefinido para historial competitivo (justificado legalmente)

---

## 🔒 Medidas de Seguridad - Estado Actual

### ✅ Implementado
- [x] Contraseñas hasheadas (bcrypt)
- [x] HTTPS/TLS en tránsito
- [x] Autenticación JWT
- [x] Control de roles (PLAYER/ADMIN)

### ⚠️ Necesario
- [ ] Encriptación de campos sensibles en BD (token Google)
- [ ] Rate limiting en endpoints auth
- [ ] 2FA (autenticación de dos factores)
- [ ] CORS configurado correctamente
- [ ] SQL Injection prevention (usar Prisma ORM - ✅ YA HECHO)
- [ ] CSRF protection en formularios
- [ ] Validación de input en toda API

---

## 🌍 Consideraciones Específicas España/UE

### AEPD - Autoridad Española de Protección de Datos
- Teléfono: +34 91 266 35 99
- Web: www.aepd.es
- **Debes registrarte si todavía no lo has hecho**

### Obligaciones si tienes empleados/voluntarios
- [ ] Realizar DPIA (Data Protection Impact Assessment)
- [ ] Documentar evaluación de riesgos

### Si monetizas la app
- [ ] Incluir política sobre cookies de marketing
- [ ] Compliance con Ley de Cookies española

---

## 📝 Acciones Inmediatas (Próximos 7 días)

### Priority 1 - CRÍTICO
1. [ ] **Modal de consentimiento** - Mostrar en primer acceso
2. [ ] **Link email legal** - Crear: privacy@freeligaapp.com, legal@freeligaapp.com
3. [ ] **Documentar responsable** - Quién es el Data Controller

### Priority 2 - IMPORTANTE
1. [ ] Endpoint para descargar datos del usuario
2. [ ] Endpoint para eliminar cuenta
3. [ ] Logging de cambios sensibles
4. [ ] Revisar permisos de admin

### Priority 3 - RECOMENDADO
1. [ ] Implementar 2FA
2. [ ] Encriptación de token Google
3. [ ] Rate limiting
4. [ ] DPIA (Data Protection Impact Assessment)

---

## 📚 Recursos Útiles

### Documentación RGPD
- [AEPD - Guía Práctica RGPD](https://www.aepd.es/es/derechos-y-deberes)
- [ICO GDPR Guide (en inglés)](https://ico.org.uk/for-organisations/data-protection-guidance/)
- [GDPR.eu - Texto completo](https://gdpr.eu/)

### Herramientas
- [GDPR Checklist Generator](https://www.gdpr.eu/gdpr-checklist/)
- [Privacy Impact Assessment Tool](https://www.aepd.es/es/derechos-y-deberes/dpia)

---

## 🚨 Riesgos Legales Actuales

### Sin Consentimiento
- **Riesgo:** Multa de hasta €10M o 2% ingresos anuales
- **Acción:** Implementar modal consentimiento YA

### Sin Política de Privacidad
- **Riesgo:** Multa de hasta €10M o 2% ingresos anuales
- **Acción:** HECHO ✅ - Pero verificar que se entiende

### Sin Derecho al Olvido
- **Riesgo:** Multa de hasta €20M o 4% ingresos anuales
- **Acción:** Implementar endpoint de eliminación

### Breach sin notificación
- **Riesgo:** Multa de hasta €20M o 4% ingresos anuales
- **Acción:** Crear procedimiento de incident response

---

## ✋ Disclaimer

> ⚠️ **IMPORTANTE:** Este documento es una guía técnica basada en RGPD. No presenta asesoramiento legal. Para cumplimiento total, **consulta con un abogado especializado en protección de datos** en tu jurisdicción. Especialmente si:
> - Tu app es comercial o tienes usuarios pagando cuotas
> - Tienes empleados con acceso a datos
> - Procesas datos de menores (<18 años)
> - Tienes usuarios fuera de España

---

## 📞 Contactos Recomendados

**Antes de ir a producción:**
1. **Abogada especialista en RGPD** - Para revisión legal
2. **AEPD** - Para registrar responsable si necesario
3. **Auditor de seguridad** - Para verificar medidas técnicas

---

**Próxima revisión:** Se recomienda cada 6 meses  
**Responsable:** Administrador de FreeLiga  
**Última actualización:** 28/02/2026
