# 🔔 Sistema de Notificaciones Push - Guía de Uso


## Descripción General

Se ha implementado un sistema completo de **notificaciones push** que permite:
- ✅ **Activación por defecto** al pagar la cuota anual (configurable desde el perfil)


## 🎯 Para Usuarios Finales

### Política de Activación por Defecto

**¡IMPORTANTE!** Al pagar tu cuota anual, las notificaciones push se activan automáticamente por defecto. Esto te asegura que no te pierdas información importante sobre nuevas temporadas y actualizaciones.

- ✅ **Activadas por defecto**: Recibirás notificaciones desde el momento en que pagas tu cuota
- 🔧 **Control total**: Puedes desactivarlas en cualquier momento desde tu perfil
- 🎯 **Sin spam**: Solo recibirás notificaciones importantes (nuevas temporadas, partidos programados, etc.)


### Cómo Gestionar tus Notificaciones

1. **Accede a tu perfil**: Ve a http://localhost:4175/profile (o haz clic en tu email en la barra superior)
2. **Busca la sección "🔔 Notificaciones Push"**: Está junto al interruptor de Calendario
3. **Activa o desactiva** usando el interruptor:
   - 🟢 Verde: Notificaciones activadas (recibirás notificaciones)
   - ⚪ Gris: Notificaciones desactivadas
4. **Autoriza el navegador**: La primera vez que actives las notificaciones, el navegador te pedirá permiso

### Estado de las Notificaciones

Desde tu perfil verás:
- ✅ **Activadas y suscrito**: Todo funciona correctamente
- ⚠️ **Activadas pero no suscrito**: Necesitas activar el interruptor para recibir notificaciones
- ❌ **Desactivadas**: No recibirás notificaciones (puedes activarlas cuando quieras)
- 🚫 **No soportado**: Tu navegador no soporta notificaciones push
### Requisitos

- **Navegador** que soporte notificaciones push (Chrome, Firefox, Edge, Safari)
- **App instalada como PWA** (mejor experiencia) o acceso web
- Haber **permitido notificaciones** en tu dispositivo

---

## 👨‍💼 Para Administradores

### Cómo Enviar Notificaciones

#### 1. Accede a la Página de Notificaciones

1. Inicia sesión como **administrador**
2. En el menú de administración, busca **"🔔 Notificaciones"**
3. Se abrirá la página de envío de notificaciones

#### 2. Configura la Notificación

**Campos disponibles:**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **Destinatarios** | Elige si enviar a todos o a un usuario específico | "Todos los usuarios" o usuario ID |
| **Título** | Texto principal de la notificación (máx. 100 caracteres) | "¡Nueva temporada disponible!" |
| **Mensaje** | Descripción completa (máx. 500 caracteres) | "La nueva temporada 2024-2025 ya está abierta..." |
| **Etiqueta** | Agrupar notificaciones similares | "season-notification" |

#### 3. Plantillas Recomendadas

**Nueva Temporada:**
```
Título: ¡Nueva Temporada Disponible! 🎉
Mensaje: La nueva temporada ya está abierta. ¡Comienza a competir!
Etiqueta: season-notification
```

**Recordatorio de Partido:**
```
Título: ⚠️ Recordatorio: Próximo Partido
Mensaje: Tu próximo partido está programado para hoy. ¡No olvides confirmar tu asistencia!
Etiqueta: match-reminder
```

**Mantenimiento:**
```
Título: 🔧 Mantenimiento Programado
Mensaje: Realizaremos mantenimiento mañana de 2-4 AM. El sistema estará temporalmente inaccesible.
Etiqueta: maintenance
```

#### 4. Envía la Notificación

1. Rellena los campos
2. Haz clic en **"🚀 Enviar Notificación"**
3. Verás un mensaje de confirmación con:
   - ✅ Notificaciones enviadas exitosamente
   - ❌ Notificaciones que fallaron (suscripciones inválidas)

---

## 🔧 Configuración Técnica

### Variables de Entorno (Backend)

Ya están configuradas en `.env`:

```env
VAPID_PUBLIC_KEY=BEe5Cs1fQjOtD0Wk8rTdwiL6erkx2YF2xc1Ev-U2LZsUIsw69esa8YAr1xKqV70euVyUpMsNXHwXE9bSse-IvQk
VAPID_PRIVATE_KEY=KN2Ik4QmLwRZ9ApDL72Z1bWmJp839kf0R_Ti2IY-66g
VAPID_SUBJECT=mailto:admin@freesquash.com
```

**Nota:** En producción, regenera estas claves con:
```bash
npx web-push generate-vapid-keys
```

### Base de Datos

Tabla creada automáticamente: `push_subscriptions`

```sql
Campos:
- id: Identificador único
- userId: ID del usuario suscrito
- endpoint: Endpoint del servidor push
- p256dh: Clave de encriptación
- auth: Token de autenticación
- createdAt: Fecha de suscripción
- updatedAt: Última actualización
```

---

## 📱 API Endpoints

### Pública (No requiere autenticación)

**GET** `/api/push/vapid-public-key`
- Obtiene la clave pública VAPID
- Respuesta: `{ publicKey: "..." }`

### Autenticada (Requiere usuario)

**POST** `/api/push/subscribe`
- Suscribir a notificaciones
- Body: `{ endpoint: "...", keys: { p256dh: "...", auth: "..." } }`

**POST** `/api/push/unsubscribe`
- Desuscribirse de notificaciones
- Body: `{ endpoint: "..." }`

### Administrativa (Requiere rol ADMIN)

**POST** `/api/push/send-to-user/:userId`
- Enviar notificación a un usuario específico
- Body:
  ```json
  {
    "title": "...",
    "body": "...",
    "tag": "...",
    "data": { ... }
  }
  ```

**POST** `/api/push/send-to-all`
- Enviar notificación a todos los usuarios suscritos
- Body: (mismo que arriba)

---

## 🐛 Solución de Problemas

### "No estoy recibiendo notificaciones"

**Causas comunes y soluciones:**

| Problema | Solución |
|----------|----------|
| Notificaciones bloqueadas en el navegador | Ve a Configuración → Privacidad → Notificaciones y permite FreeSquash |
| Notificaciones desactivadas en tu cuenta | Ve a tu perfil (`/profile`) y activa el interruptor "🔔 Notificaciones Push" |
| Navegador no soporta web push | Usa Chrome, Firefox, Edge o Safari moderno |
| La suscripción expiró | Intenta desuscribirse y suscribirse de nuevo |

### "No veo el control de notificaciones"

- El control está en tu perfil: `/profile`, sección **🔔 Notificaciones Push**
- Solo estará operativo en navegadores compatibles: Chrome, Firefox, Edge, Safari
- En navegadores antiguos puede aparecer como no soportado

### "Estoy intentando enviar una notificación como admin pero me da error"

- Verifica que tu cuenta sea **administrador**
- Asegúrate de rellenar **título** y **mensaje**
- Si hay usuarios sin suscripción, verás "Fallidas: X" (normal)

---

## 📊 Monitoreo

### Ver Suscriptores Activos

Próximamente: Página admin que muestre estadísticas de suscriptores

### Logs

Los eventos de notificaciones se registran en:
- **Backend logs**: Eventos de suscripción/envío
- **Database**: Tabla `push_subscriptions`

---

## 🔐 Seguridad

- ✅ **VAPID keys**: Generadas y almacenadas de forma segura
- ✅ **Encriptación end-to-end**: Notificaciones encriptadas en tránsito
- ✅ **Authentication**: Solo usuarios autenticados pueden suscribirse
- ✅ **Authorization**: Solo admins pueden enviar notificaciones
- ✅ **Renovación automática**: Las suscripciones inválidas se eliminan

---

## 📋 Checklist de Implementación

- [x] Backend: Instalación de web-push
- [x] Backend: Rutas de API para suscripción
- [x] Backend: Rutas de API para envío
- [x] Base de datos: Schema para push_subscriptions
- [x] Frontend: Hook usePushNotification
- [x] Frontend: Control de notificaciones en la página de perfil
- [x] Frontend: Página admin SendPushNotifications
- [x] Frontend: Service Worker personalizado
- [x] Frontend: Preferencia persistida por usuario (`pushNotificationsEnabled`)
- [x] Configuración: Variables de entorno VAPID
- [x] Documentación: Esta guía

---

## 🚀 Próximas Mejoras

- [ ] Dashboard admin con estadísticas de suscriptores
- [ ] Historial de notificaciones enviadas
- [ ] Notificaciones programadas (enviar en fecha/hora específica)
- [ ] Segmentación por grupo (enviar solo a un grupo)
- [ ] Notificaciones automáticas (nuevos partidos, recordatorios)
- [ ] Analytics: Ver cuántos usuarios abrieron la notificación

---

## 📞 Soporte

Si tienes problemas o preguntas sobre el sistema de notificaciones:

1. **Usuarios**: Contacta al administrador
2. **Administradores**: Revisa el apartado "Solución de problemas" arriba
3. **Desarrolladores**: Consulta el código en:
   - Backend: `/apps/api/src/services/push-notification.service.ts`
   - Backend: `/apps/api/src/routes/push.routes.ts`
   - Frontend: `/apps/web/src/hooks/usePushNotification.ts`
   - Frontend: `/apps/web/src/components/PushNotificationButton.tsx`
