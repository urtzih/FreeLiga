# 📋 Guía de Ascensos y Descensos - FreeLiga

## 🎯 Descripción General

El sistema de ascensos y descensos permite que los jugadores cambien de grupo automáticamente basándose en su rendimiento en la temporada anterior. Este documento explica cómo funcionan estos movimientos y cómo aplicarlos en tu liga.

---

## 📊 Flujo Completo Paso a Paso

### **PASO 1: Finalizar la Temporada**

Cuando una temporada llega a su fin:

1. Accede a **http://localhost:4173/admin/seasons**
2. Verifica que la fecha de fin de la temporada sea anterior a hoy
3. El botón **"Movimientos"** debería estar activo (naranja oscuro)

```
Estado de botones:
✓ Naranja oscuro = Temporada finalizada (puedes hacer clic)
✗ Naranja claro deshabilitado = Temporada aún activa
```

---

### **PASO 2: Ver Propuesta de Ascensos/Descensos**

1. Haz clic en el botón **"Movimientos"** para una temporada finalizada
2. Se abre **http://localhost:4173/admin/seasons/{seasonId}/proposals**

En esta página verás:

#### **📈 Resumen Estadístico**
- **Total Jugadores**: Cuántos jugadores están en la temporada
- **Ascensos 📈**: Jugadores que suben a un grupo superior
- **Descensos 📉**: Jugadores que bajan a un grupo inferior
- **Mantienen ➡️**: Jugadores que se quedan en el mismo grupo

#### **📝 Detalles por Grupo**
Cada grupo muestra:
- `#N` = Posición final (1 es primero)
- Nombre del jugador
- `🏆 X` = Cantidad de partidos ganados
- Selector de movimiento (Mantiene/Asciende/Desciende)

---

### **PASO 3: Editar Movimientos (Opcional)**

Si quieres cambiar manualmente el movimiento de un jugador:

1. Haz clic en el selector de movimiento (dropdown) del jugador
2. Elige:
   - **Mantiene ➡️** = Se queda en el mismo grupo
   - **Asciende 📈** = Sube al grupo superior
   - **Desciende 📉** = Baja al grupo inferior
3. Haz clic en **"Guardar Cambios"** (aparece cuando cambias algo)

**Reglas automáticas** (si no cambias nada):
- Los **2 primeros** de cada grupo ascienden (excepto en grupo superior)
- Los **2 últimos** de cada grupo descienden (excepto en grupo inferior)
- El **resto mantiene**

```
Ejemplo:
┌─────────┐
│ Grupo A │ (Superior)
├─────────┤
│  1. Juan│ → MANTIENE (no hay grupo superior)
│  2. Ana │ → MANTIENE
│  3. Luis│ → MANTIENE
│ ...     │ → DESCIENDE (últimos 2)
└─────────┘
         ↓
┌─────────┐
│ Grupo B │ (Intermedio)
├─────────┤
│  1. Pau │ → ASCIENDE (top 2)
│  2. Eva │ → ASCIENDE
│  3. Tom │ → MANTIENE
│ ...     │ → DESCIENDE (últimos 2)
└─────────┘
```

---

### **PASO 4: Aprobar la Propuesta**

1. Revisa que todos los movimientos sean correctos
2. Haz clic en **"Aprobar Propuesta"**
3. Sistema confirmará: "¿Estás seguro? Esto aplicará los movimientos..."
4. Confirma con OK

#### Qué sucede al aprobar:
✅ Se registra el movimiento en el historial del jugador
✅ Se crea un registro en `PlayerGroupHistory` con el grupo destino
✅ La propuesta pasa a estado `APPROVED`

---

### **PASO 5: Generar la Siguiente Temporada**

Después de aprobar, el botón cambia a **"Generar Siguiente Temporada"**

1. Haz clic en **"Generar Siguiente Temporada"**
2. Sistema confirmará: "¿Generar la siguiente temporada importando estos jugadores?"
3. Confirma con OK

#### Qué sucede automáticamente:
✅ Se crea una nueva temporada (fechas +3 meses)
✅ Se clonan los grupos con los mismos nombres
✅ Se asignan jugadores a su nuevo grupo según el movimiento:
   - Ascensos → Grupo superior
   - Descensos → Grupo inferior
   - Mantienen → Mismo grupo
✅ Los jugadores están listos para la nueva temporada

---

## 📊 Ejemplo Completo

### Escenario: Temporada Otoño 2024 finaliza

**Grupos actuales:**
- Grupo A: Juan, Ana, Luis (3 jugadores)
- Grupo B: Pau, Eva, Tom, Mar (4 jugadores)

**Después de jugar toda la temporada:**
```
Grupo A (Ranking final):
  1. Juan  → 8 victorias
  2. Ana   → 7 victorias
  3. Luis  → 5 victorias

Grupo B (Ranking final):
  1. Pau   → 9 victorias (ASCIENDE a Grupo A)
  2. Eva   → 8 victorias (ASCIENDE a Grupo A)
  3. Tom   → 4 victorias
  4. Mar   → 3 victorias (DESCIENDE a Grupo C)
```

**Haces clic en "Movimientos":**
- Sistema calcula automáticamente los ascensos/descensos
- Propone: Pau y Eva ↑, Mar ↓, otros mantienen

**Haces clic en "Aprobar Propuesta":**
- Se registran los movimientos
- Se actualiza historial de cada jugador

**Haces clic en "Generar Siguiente Temporada":**
- Se crea "Invierno 2024-2025"
- Grupo A: Juan, Ana, Luis, Pau, Eva (5 jugadores)
- Grupo B: Tom, Mar
- Grupo C: (vacío o con nuevos jugadores)

**¡La siguiente temporada está lista!**

---

## 🔍 Datos Importantes

### Campo "🏆 Victorias"
Muestra cuántos partidos ganó cada jugador en esa temporada.
Se calcula automáticamente a partir de:
- Partidos jugados en su grupo en esa temporada
- Solo cuenta partidos con estado "PLAYED"

### Posición "#N"
Es el ranking final del jugador en su grupo.
Se calcula basado en:
1. **Partidos ganados** (primero)
2. **Sets ganados** (desempate)
3. **Promedio de sets** (último desempate)

### Historial (PlayerGroupHistory)
Cada movimiento queda registrado:
- Jugador
- Temporada
- Grupo anterior
- Grupo nuevo
- Tipo de movimiento (PROMOTION/RELEGATION/STAY)
- Posición final

---

## ⚙️ Casos Especiales

### **¿Qué pasa si apruebo pero no genero siguiente temporada?**
- Los movimientos están guardados ✓
- Los jugadores ven su movimiento en su perfil ✓
- Puedes generar la temporada más tarde cuando quieras

### **¿Puedo editar después de aprobar?**
- No, la propuesta está locked
- Si necesitas cambiar, vuelve atrás y elimina la temporada

### **¿Qué pasa con jugadores nuevos?**
- Se crean sin grupo al registrarse
- Debes asignarlos manualmente a un grupo antes de que jueguen
- En la siguiente temporada, si no tienen movimiento, se mantienen en el mismo grupo

### **¿Cómo veo el historial de un jugador?**
1. Ve a **http://localhost:4173/admin/users**
2. Abre la pestaña **"Historial de Jugadores"**
3. Busca el jugador
4. Verás su historial de cambios entre grupos

---

## 🎓 Resumen Rápido

| Acción | Resultado |
|--------|-----------|
| **Ver Movimientos** | Abre propuesta de cambios |
| **Editar Movimientos** | Cambia manualmente quién sube/baja |
| **Guardar Cambios** | Guarda tus ediciones |
| **Aprobar Propuesta** | Registra movimientos en historial |
| **Generar Siguiente Temporada** | Crea nueva temporada con jugadores reasignados |

---

## 🐛 Solución de Problemas

### Botón "Movimientos" está deshabilitado
- ✓ Verifica que la fecha de fin sea anterior a hoy
- ✓ Refresca la página

### Aparecen 0 victorias
- ✓ Asegúrate de que hay partidos registrados en esa temporada
- ✓ Los partidos deben estar marcados como "PLAYED"

### Al generar siguiente temporada, falta gente
- ✓ Solo se importan jugadores que tenían movimiento aprobado
- ✓ Nuevos jugadores se agregan manualmente después

---

## 📝 Notas Finales

Este sistema está diseñado para:
- ✅ Automatizar cambios de grupo
- ✅ Mantener historial completo
- ✅ Permitir ajustes manuales
- ✅ Crear nuevas temporadas sin perder datos

**¡Tu liga está lista para gestionar ascensos y descensos de forma profesional!** 🎾
