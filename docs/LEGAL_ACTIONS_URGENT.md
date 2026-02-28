# 🚨 Acciones Legales URGENTES - Próximos 7 días

**Estado del sitio:** ⚠️ A RIESGO LEGAL  
**Prioridad:** CRÍTICA

---

## 1️⃣ HOY - Modal de Consentimiento (½ hora)

Crea este componente y colócalo en `App.tsx`:

```typescript
// apps/web/src/components/ConsentModal.tsx
import React, { useState, useEffect } from 'react';

export default function ConsentModal() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    // Mostrar solo si no ha dado consentimiento
    const hasConsent = localStorage.getItem('gdprConsent');
    if (!hasConsent) {
      setShowConsent(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('gdprConsent', JSON.stringify({
      accepted: true,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }));
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-6 shadow-lg z-50">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm mb-2">
            <strong>Aviso de privacidad:</strong> Utilizamos cookies y procesamos datos personales para mejorar tu experiencia.
          </p>
          <p className="text-xs text-gray-400">
            Lee nuestra <a href="/privacy" className="underline hover:text-blue-400">Política de Privacidad</a> y 
            <a href="/terms" className="underline ml-1 hover:text-blue-400">Términos de Servicio</a>
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={handleAccept}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold whitespace-nowrap"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Añade en App.tsx (en el return):**
```typescript
<ConsentModal />
<SpeedInsights />
```

---

## 2️⃣ HOY - Crear Emails Legales (1 hora)

**Crea estas direcciones o alias de email:**

- `privacy@freeligaapp.com` → Para RGPD y privacidad
- `legal@freeligaapp.com` → Para términos legales
- `dpo@freeligaapp.com` → Para Data Protection Officer (si lo necesitas)

**Si usas Gmail simple:**
1. Abre Gmail
2. Haz clic en engranaje → Configuración
3. Ve a Cuentas y importación
4. Haz clic en "Enviar correo como"
5. Añade: privacy@freeligaapp.com (spoofing básico)

**Mejor opción - Alias profesional:**
- Usa un servicio como Zoho Mail o AWS SES
- Cuesta ~$1-5/mes
- Te da un dominio profesional

**Actualiza:**
- Privacy.tsx con email de privacidad
- Terms.tsx con email de términos
- Legal.tsx con email legal

---

## 3️⃣ HOY - Verificar Datos Sensibles (1 hora)

**Ejecuta en tu base de datos:**

```sql
-- Ver qué datos almacenas
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'railway'
ORDER BY TABLE_NAME;

-- Campos sensibles encontrados:
-- users.password (✅ hashed correctamente)
-- users.email
-- players.phone
-- players.name
-- googleCalendarToken.token ⚠️ (NO ENCRIPTADO - URGENTE)
```

**Acción:** El token de Google Calendar DEBE estar encriptado. Esto es crítico.

---

## 4️⃣ SEMANA 1 - Endpoint Derecho al Olvido (2 horas)

**Crea en `apps/api/src/routes/user.routes.ts`:**

```typescript
// DELETE /api/users/me/delete-account (Current user deletes self)
fastify.delete('/:id/delete-account', {
    onRequest: [fastify.authenticate],
}, async (request, reply) => {
    const decoded = request.user as any;
    const { id } = request.params as { id: string };
    
    // Solo el usuario puede borrar su propia cuenta
    if (decoded.userId !== id && decoded.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Forbidden' });
    }

    try {
        // Eliminar CASCADE (matches, groups, etc)
        await prisma.user.delete({
            where: { id }
        });

        logger.warn({
            type: 'account_deleted',
            userId: id,
            deletedBy: decoded.userId,
            timestamp: new Date()
        }, 'Account permanently deleted');

        return reply.send({ message: 'Account deleted successfully' });
    } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
    }
});
```

---

## 5️⃣ SEMANA 1 - Endpoint Exportar Datos (2 horas)

**Crea en `apps/api/src/routes/user.routes.ts`:**

```typescript
// GET /api/users/me/export-data
fastify.get('/:id/export-data', {
    onRequest: [fastify.authenticate],
}, async (request, reply) => {
    const decoded = request.user as any;
    const { id } = request.params as { id: string };
    
    if (decoded.userId !== id && decoded.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Forbidden' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                player: {
                    include: {
                        matchesAsPlayer1: true,
                        matchesAsPlayer2: true,
                        wonMatches: true,
                        seasonStats: true,
                        groupPlayers: {
                            include: { group: true }
                        }
                    }
                },
                bugReports: true
            }
        });

        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }

        // Crear JSON con TODOS los datos del usuario
        const userData = {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                lastConnection: user.lastConnection,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            },
            player: user.player,
            bugReports: user.bugReports,
            exportDate: new Date().toISOString(),
            exportedBy: 'GDPR Data Export Request'
        };

        reply.send(userData);
    } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
    }
});
```

---

## ⚠️ Responsable Designado

**Debes designar quién es responsable de:**

1. **Data Controller (Responsable del tratamiento):**
   - Quien decide QUÉ datos recopilar y conserVar
   - Probablemente: TÚ o admin de la liga

2. **Data Processor (Encargado del tratamiento):**
   - Quien almacena y procesa datos
   - Ejemplo: Railway (hosting)
   - **Debes verificar su GDPR compliance**

3. **Data Protection Officer (DPO - Opcional pero recomendado):**
   - Responsable de GDPR compliance
   - Puede ser externo (asesor legal)

**Documenta esto en tu Privacy Policy:**

```
Responsable del tratamiento: [Tu nombre/empresa]
Email contacto: privacy@freeligaapp.com

Encargados del tratamiento:
- Railway (hosting): Cumple GDPR
- Google (Calendar API): Cumple GDPR
- [Cualquier otro servicio]
```

---

## 🛑 Riesgos Legales AHORA MISMO

| Riesgo | Multa | Plazo | Estado |
|--------|-------|-------|--------|
| Sin consentimiento | €10M ✗ | YA | Falta modal |
| Sin política privacidad | €10M | YA | ✅ Hecho |
| Sin derecho olvido | €20M | YA | Falta endpoint |
| Token Google sin encriptar | €20M | YA | 🔴 URGENTE |
| Sin logging de cambios | €10M | 3 meses | Recomendado |

---

## 📋 Checklist de Esta Semana

- [ ] Día 1: Modal de consentimiento + Emails
- [ ] Día 2: Verificar encriptación token Google
- [ ] Día 3: Endpoint exportar datos
- [ ] Día 4: Endpoint eliminar cuenta
- [ ] Día 5: Documentar responsables legales
- [ ] Día 6: Revisar con abogado (RECOMENDADO)
- [ ] Día 7: Actualizar Privacy Pages con cambios

---

## 🎯 Contactos Inmediatos

**ANTES de ir a PRODUCCIÓN:**

1. **Consultor GDPR:**
   - Costo: €500-2000
   - Tiempo: 1-2 semanas
   - Herramientas como Derechosdigitales.org pueden recomendarte

2. **AEPD (España):**
   - https://www.aepd.es/
   - Para consultas generales

3. **Abogado DATA:**
   - Búsca "Abogado experto RGPD" + tu ciudad
   - Recomendable: €1000-5000 para audit completo

---

**⏰ Tiempo estimado total: 8 horas**  
**🚨 No retrasar más de 7 días**
