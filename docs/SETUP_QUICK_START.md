# ⚡ GUÍA RÁPIDA DE INSTALACIÓN

## 🎯 EN 3 PASOS ESTARÁS LISTO

---

## PASO 1️⃣: INSTALAR DEPENDENCIAS

Abre PowerShell/CMD en tu proyecto y ejecuta:

```bash
cd apps/api
npm install
```

**Tiempo estimado**: 2-3 minutos

---

## PASO 2️⃣: EJECUTAR MIGRACIÓN DE BD

En el mismo PowerShell/CMD:

```bash
cd ../..
cd packages/database
npx prisma migrate dev --name add_match_scheduling
```

**Lo que hará**:
- Agregará nuevos campos a la tabla `matches`
- Creará la tabla `google_calendar_integrations`
- Actualizará el schema de BD

**Tiempo estimado**: 1-2 minutos

---

## PASO 3️⃣: REINICIAR SERVIDORES

Abre DOS terminales/CMD:

**Terminal 1 - API Backend:**
```bash
cd apps/api
npm run dev
```

**Terminal 2 - Frontend Web:**
```bash
cd apps/web
npm run dev
```

**Espera a ver:**
- API: "Server running on http://localhost:3001"
- Web: "VITE v5.x.x ready in XXX ms"

---

## ✅ VERIFICACIÓN RÁPIDA

### Accede a estas URLs en tu navegador:

1. **Página de Calendario**
   - URL: `http://localhost:4173/calendar`
   - Deberías ver: Calendario interactivo + botón de Google

2. **Página de Partidos**
   - URL: `http://localhost:4173/scheduled-matches`
   - Deberías ver: Lista vacía (aún sin partidos)

---

## 🔗 CONECTAR GOOGLE CALENDAR

1. Ve a `http://localhost:4173/calendar`
2. Haz click en botón **"Conectar Google Calendar"**
3. Se abre ventana de Google
4. Autoriza tu cuenta
5. Vuelves a la app, dice **"✓ Conectado"**

✅ **¡Listo!**

---

## 🎮 PROBAR FUNCIONALIDAD

### Programar tu primer partido:

1. En `/calendar` o `/scheduled-matches`, haz click en **"Programar Partido"**
2. Selecciona:
   - Jugador 1: (tu nombre)
   - Jugador 2: (otro jugador del grupo)
   - Fecha: Cualquier fecha futura
   - Hora: Cualquier hora
   - Lugar: Ej: "Club Squash Central"
3. Click en **"Programar"**
4. ✅ Se crea automáticamente en tu Google Calendar

### Editar el partido:

1. Haz click en el partido
2. Click en **"Editar"** (si eres uno de los jugadores)
3. Cambia la hora
4. Click en **"Guardar"**
5. ✅ Se actualiza automáticamente en Google Calendar

### Cancelar el partido:

1. Haz click en el partido
2. Click en **"Cancelar Partido"**
3. Confirma
4. ✅ Se elimina automáticamente de Google Calendar

---

## 🆘 SI ALGO FALLA

### Error: "npm: command not found"
→ Instala Node.js desde nodejs.org

### Error: "googleapis not found"
→ Ejecuta `npm install` en `apps/api`

### Error: "Prisma migration failed"
→ Verifica que `DATABASE_URL` en `.env` sea correcto

### No aparece botón Google
→ Verifica que el archivo `apps/web/src/pages/Calendar.tsx` existe

### Puerto 3001 o 4173 en uso
→ Cambia el puerto en `.env` de la aplicación

---

## 📊 ARCHIVOS CREADOS (PARA REFERENCIA)

### Backend
- ✅ `apps/api/src/services/googleCalendar.service.ts`
- ✅ `apps/api/src/services/matchSync.service.ts`

### Frontend
- ✅ `apps/web/src/pages/Calendar.tsx`
- ✅ `apps/web/src/pages/ScheduledMatches.tsx`
- ✅ `apps/web/src/components/calendar/CalendarView.tsx`
- ✅ `apps/web/src/components/calendar/ScheduleMatchForm.tsx`
- ✅ `apps/web/src/components/calendar/MatchDetail.tsx`

### Documentación
- ✅ `IMPLEMENTATION_SUMMARY.md`
- ✅ `SCHEDULED_MATCHES_IMPLEMENTATION.md`
- ✅ `SETUP_SCHEDULED_MATCHES.md`
- ✅ `SETUP_QUICK_START.md` (este archivo)

---

## 📝 NOTAS IMPORTANTES

- ✅ Ya está actualizado el schema de Prisma
- ✅ Ya están actualizados los routes de API
- ✅ Ya está actualizado el App.tsx con las nuevas rutas
- ✅ Variables de Google ya están en `.env`

**Solo necesitas ejecutar los 3 pasos anteriores.**

---

## 🚀 ¿LISTO?

1. Ejecuta PASO 1
2. Ejecuta PASO 2
3. Ejecuta PASO 3
4. Abre navegador en `http://localhost:4173/calendar`
5. ¡Disfruta! 🎉

---

## 📞 SOPORTE

Si necesitas ayuda:
1. Revisa la documentación completa en `SCHEDULED_MATCHES_IMPLEMENTATION.md`
2. Revisa los logs: `apps/api/logs/error.log`
3. Verifica que todos los archivos existen (ver sección anterior)

---

**¡Que te diviertas con el nuevo sistema de calendarios! 🎾📅**
