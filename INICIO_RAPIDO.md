# 🚀 FreeSquash League - Inicio Rápido

## ¿Qué es FreeSquash League?

Una aplicación web moderna para gestionar ligas de squash con:
- ⚡ Clasificaciones automáticas con algoritmo inteligente
- 📊 Estadísticas detalladas de jugadores
- 📱 Sistema de contacto entre jugadores
- 👨‍💼 Panel de administración completo
- 🇪🇸 100% en castellano (España)

---

## 🎯 Inicio en 3 Pasos

### 1️⃣ Instalación Rápida

```powershell
# Desde la raíz del proyecto
.\setup.ps1
```

Este script instala todo automáticamente y configura la base de datos.

### 2️⃣ Iniciar Servidores

**Terminal 1 - Backend:**
```powershell
cd apps/api
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd apps/web
npm run dev
```

### 3️⃣ Crear Datos de Prueba

**Terminal 3:**
```powershell
.\test-data.ps1
```

Este script crea:
- 1 administrador
- 8 jugadores
- 1 temporada
- 1 grupo con todos asignados
- 15 partidos de ejemplo

✅ **¡Listo! Accede a http://localhost:5173**

---

## 🔐 Credenciales de Prueba

**Administrador:**
- Email: `admin@freesquash.com`
- Password: `admin123`

**Jugadores:**
- Email: `carlos@email.com`, `maria@email.com`, etc.
- Password: `pass123` (para todos)

---

## 📖 Documentación

| Documento | Descripción |
|-----------|-------------|
| [README.md](README.md) | Setup técnico y arquitectura |
| [MANUAL_USUARIO.md](MANUAL_USUARIO.md) | **⭐ Guía para usuarios** |
| [GUIA_PRUEBAS.md](GUIA_PRUEBAS.md) | **⭐ Cómo probar todo** |
| [TRADUCCION.md](TRADUCCION.md) | Estado de internacionalización |
| [walkthrough.md](walkthrough.md) | Demo del sistema completo |

---

## 🧪 Probar la Aplicación

### Como Jugador

1. **Login**: Entra con `carlos@email.com / pass123`
2. **Dashboard**: Ve tus estadísticas y racha
3. **Mi Grupo**: Clickea "Ver Detalles del Grupo"
   - Observa la clasificación
   - Prueba los botones de contacto
4. **Registrar Partido**: Añade un nuevo resultado
5. **Historial**: Mira todos tus partidos
6. **Clasificación**: Usa los filtros para explorar

### Como Administrador

1. **Login**: Entra con `admin@freesquash.com / admin123`
2. **Administración**: Accede al panel admin
3. **Temporadas**: Crea una nueva temporada
4. **Grupos**: Crea un nuevo grupo
5. **Jugadores**: Visualiza todos los jugadores

### Verificar el Algoritmo

Consulta la sección "Verificación del Algoritmo de Ranking" en [GUIA_PRUEBAS.md](GUIA_PRUEBAS.md) para casos de prueba específicos.

---

## 🛠️ Comandos Útiles

### Base de Datos

```powershell
# Ver base de datos visualmente
cd packages/database
npm run db:studio
# Abre en http://localhost:5555

# Resetear base de datos
npm run db:push  # Resetea y recrea tablas
```

### Desarrollo

```powershell
# Instalar dependencias
npm install

# Generar cliente Prisma
npm run db:generate

# Migrar base de datos
npm run db:migrate
```

---

## 🎨 Características Destacadas

### Sistema de Ranking Inteligente

El algoritmo desempata en 4 niveles:
1. **Partidos ganados** (principal)
2. **Enfrentamiento directo** (si empatan 2 jugadores)
3. **Mini-liga interna** (si empatan 3+):
   - Victorias entre empatados
   - Averás entre empatados
4. **Averás global** (diferencia total de sets)
5. **Alfabético** (último recurso)

### Indicadores Visuales

- 🏆 Zona de ascenso (2 primeros)
- ⚠️ Zona de descenso (2 últimos)
- 🔥 Racha de victorias
- 💧 Racha de derrotas
- ✅ Partido ganado
- ❌ Partido perdido
- 🤕 Lesión
- 🚫 Cancelado

### Filtros Avanzados

En la **Clasificación Global** puedes filtrar por:
- Nombre de jugador
- Temporada específica
- Grupo específico
- Rango de fechas (para ver evolución)

---

## 🔧 Solución de Problemas

### Backend no inicia

```powershell
# Verifica que el puerto 3000 esté libre
netstat -ano | findstr :3000

# Mata el proceso si es necesario
taskkill /PID <PID> /F
```

### Frontend no inicia

```powershell
# Verifica que el puerto 5173 esté libre
netstat -ano | findstr :5173
```

### Error de base de datos

```powershell
cd packages/database

# Resetea la base de datos
npm run db:push

# Regenera el cliente
npm run db:generate
```

### "Player not in any group"

Necesitas asignar el jugador a un grupo:

```powershell
# Opción 1: Usa Prisma Studio
npm run db:studio
# Crea registro en tabla GroupPlayer

# Opción 2: Usa la API
# POST /groups/{groupId}/players
# Body: { "playerId": "..." }
```

---

## 📊 Estructura del Proyecto

```
FreeLiga/
├── apps/
│   ├── api/          # Backend Fastify
│   └── web/          # Frontend React
├── packages/
│   └── database/     # Prisma + Schema
├── MANUAL_USUARIO.md    # ⭐ Guía de usuario
├── GUIA_PRUEBAS.md      # ⭐ Guía de testing
├── setup.ps1            # Script de instalación
├── test-data.ps1        # Script de datos de prueba
└── README.md            # Documentación técnica
```

---

## 🌟 Próximos Pasos Recomendados

### Para Pruebas Locales
1. Ejecuta `test-data.ps1` para poblar datos
2. Lee [MANUAL_USUARIO.md](MANUAL_USUARIO.md) para entender las funcionalidades
3. Sigue [GUIA_PRUEBAS.md](GUIA_PRUEBAS.md) para testing completo

### Para Desarrollo
1. Lee [README.md](README.md) para arquitectura técnica
2. Explora el código fuente (muy bien comentado)
3. Usa Prisma Studio para explorar la BD
4. Revisa walkthrough.md para entender flujos

### Para Producción
1. Configura variables de entorno de producción
2. Despliega Backend en Railway/Render/Fly.io
3. Despliega Frontend en Vercel/Netlify
4. Usa PostgreSQL de Supabase/Railway para BD
5. Configura dominios y SSL

Ver sección "Deployment" en [README.md](README.md) para más detalles.

---

## 💡 Consejos Útiles

- **Usa Thunder Client** (VS Code) para probar la API fácilmente
- **Usa Prisma Studio** para ver/editar datos visualmente
- **Lee MANUAL_USUARIO.md** para entender la lógica de negocio
- **Ejecuta test-data.ps1** cada vez que resetees la BD
- **Todos los passwords de prueba** son `pass123` o `admin123`

---

## 📞 Soporte

### Consulta la Documentación
- **Usuarios**: [MANUAL_USUARIO.md](MANUAL_USUARIO.md)
- **Testing**: [GUIA_PRUEBAS.md](GUIA_PRUEBAS.md)
- **Técnica**: [README.md](README.md)

### Preguntas Frecuentes

**Q: ¿Cómo asigno jugadores a grupos?**  
A: POST a `/groups/:id/players` con `{"playerId": "..."}` o usa Prisma Studio

**Q: ¿Los partidos por lesión cuentan en el ranking?**  
A: No, solo partidos con estado "PLAYED" afectan al ranking

**Q: ¿Cómo reseteo la base de datos?**  
A: `cd packages/database && npm run db:push` y luego ejecuta `test-data.ps1`

**Q: ¿Dónde veo los tokens JWT?**  
A: En localStorage del navegador (F12 > Application > Local Storage)

---

## ✅ Checklist Antes de Empezar

- [ ] Node.js v18+ instalado
- [ ] npm instalado
- [ ] PostgreSQL instalado y funcionando (o URL de Supabase)
- [ ] Puertos 3000 y 5173 libres
- [ ] Variables de entorno configuradas (.env files)
- [ ] Dependencias instaladas (`npm install`)
- [ ] Migraciones aplicadas (`npm run db:migrate`)

---

## 🎉 ¡Todo Listo!

Ahora puedes:
1. ✅ Iniciar servidores
2. ✅ Crear datos de prueba
3. ✅ Acceder a http://localhost:5173
4. ✅ Login como admin o jugador
5. ✅ Explorar todas las funcionalidades

**¡Disfruta de FreeSquash League!** 🏆🎾

---

**Versión**: 1.0 MVP  
**Última actualización**: 22 de noviembre de 2024  
**Estado**: ✅ Completado y probado
