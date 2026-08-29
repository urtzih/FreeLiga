# League Rules and Promotions Guide

## 📋 Season Closure Rules

### Overview
When a season ends, the system automatically calculates promotions, relegations, and stays based on final player positions in their groups.

### General Rules

**Group Structure:**
- Groups always have minimum 8 players
- Groups are ordered hierarchically (Group 1 is top, Group 8 is bottom, etc.)

**Promotion/Relegation Logic:**

| Group Type | Promotions | Relegations |
|-----------|-----------|-------------|
| **Top Group (1)** | None (already highest) | 2 players (positions 7-8) → Group 2 |
| **Middle Groups (2-7)** | 2 players (positions 1-2) → Group above | 2 players (positions 7-8) → Group below |
| **Bottom Group** | 2 players (positions 1-2) → Group above | None (no lower group) |

**Vacancies:**
- Players in the freezer or with an inactive account do not occupy a place in the next season.
- Vacancies are filled in ranking order with additional promotions from the immediately lower group until each non-bottom group reaches 8 eligible players.
- If that creates another vacancy, filling continues down the hierarchy. No player can skip a group.
- The bottom group can remain below its previous size when there are not enough eligible players.

**Tie-Breaking Rules** (when players are tied on position):
1. **Head-to-head** (only 2 players)
2. **Mini-league** (3+ players): internal matches between tied players
3. **Internal averages**: set difference in mini-league
4. **Global averages**: total set difference in group
5. **Alphabetical order** (last resort)

## 🎯 Complete Promotion/Demotion Workflow

### Step 1: Finish the Season
1. Go to **http://localhost:4173/admin/seasons**
2. Verify season end date is in the past
3. **"Movimientos"** (Movements) button should be active (dark orange)

### Step 2: View Promotion Proposal
1. Click **"Movimientos"** button
2. Page opens: **http://localhost:4173/admin/seasons/{seasonId}/proposals**

On this page you'll see:

**Statistical Summary:**
- **Total Players**: Players in season
- **Promotions 📈**: Players moving up
- **Relegations 📉**: Players moving down
- **Stays ➡️**: Players staying in group

**Details by Group:**
- `#N` = Final position (1 is first place)
- Player name
- `🏆 X` = Wins count
- Movement selector dropdown
- Current eligible players and projected next-season size
- `cubre vacante` marker for promotions beyond the regular top two

### Step 3: Edit Movements (Optional)
1. Click movement dropdown for any player
2. Choose:
   - **Mantiene ➡️** = Stays in same group
   - **Asciende 📈** = Moves up one group
   - **Desciende 📉** = Moves down one group
3. Click **"Guardar Cambios"** when done

Use **"Recalcular Propuesta"** to discard the pending proposal and generate it again with the current rankings and eligibility. This also discards unsaved manual edits.

**Default Rules** (auto-applied if unchanged):
- **Top 2** of each group promoted (except top group)
- **Bottom 2** of each group relegated (except bottom group)
- **All others** stay in current group
- **Additional ranked players** can promote to fill vacancies left by freezer/inactive players
- The top group never promotes and the bottom group never relegates

### Step 4: Approve Proposal
1. Review all movements
2. Click **"Aprobar Propuesta"** (Approve Proposal)
3. Confirm: "This will apply movements..."

**On approval:**
- ✅ Movements registered in player history
- ✅ `PlayerGroupHistory` records created
- ✅ Proposal marked as APPROVED

### Step 5: Generate Next Season
After approval, button changes to **"Generar Siguiente Temporada"** (Generate Next Season)

1. Click **"Generar Siguiente Temporada"**
2. Confirm: "Generate next season importing these players?"

**Automatically creates:**
- ✅ New season (dates +3 months forward)
- ✅ Cloned groups with same names
- ✅ Players reassigned based on movements:
   - Promotions → Higher group
   - Relegations → Lower group
   - Stays → Same group
- ✅ Ready for new season

## 📊 Example Scenario

**Current Season Status:**
```
Group A (Top):
  1. Juan   → 8 wins
  2. Ana    → 7 wins
  3. Luis   → 5 wins

Group B (Middle):
  1. Pau    → 9 wins (PROMOTE to Group A)
  2. Eva    → 8 wins (PROMOTE to Group A)
  3. Tom    → 4 wins
  4. Mar    → 3 wins (RELEGATE to Group C)
```

**After Clicking "Movimientos":**
- System auto-proposes: Pau & Eva ↑, Mar ↓, others →

**After "Aprobar Propuesta":**
- Movements registered in each player's history

**After "Generar Siguiente Temporada":**
```
New Season Created:
Group A: Juan, Ana, Luis, Pau, Eva (5 players)
Group B: Tom, Mar
Group C: (empty or new players)
```

## 🔍 Important Fields

**Wins (🏆):**
- Shows matches won in season
- Auto-calculated from played matches
- Only counts matches with status "PLAYED"

**Position (#N):**
- Final group ranking
- Based on:
  1. Matches won (primary)
  2. Sets won (tiebreaker)
  3. Average sets (secondary tiebreaker)

**Player Group History:**
- Permanent record of each movement:
  - Player
  - Season
  - Source group
  - Destination group
  - Movement type (PROMOTION/RELEGATION/STAY)
  - Final position

## ⚙️ Special Cases

**Approved but no next season generated?**
- Movements saved ✓
- Players see movement in profile ✓
- Generate season anytime later

**Can I edit after approval?**
- No, proposal is locked
- Go back and delete season if changes needed

**New players?**
- Created without group on registration
- Manually assign to group before play
- In next season, stay in same group if no movement

**View player history?**
1. Go to **http://localhost:4173/admin/users**
2. Tab: **"Historial de Jugadores"**
3. Search player name
4. See group change history

## 🎓 Quick Reference

| Action | Result |
|--------|--------|
| **Ver Movimientos** | Open movement proposal |
| **Editar Movimientos** | Change who promotes/relegates |
| **Guardar Cambios** | Save your edits |
| **Aprobar Propuesta** | Register movements in history |
| **Generar Siguiente Temporada** | Create new season with reassigned players |

## 🐛 Troubleshooting

**"Movimientos" button disabled?**
- ✓ Verify end date is in the past
- ✓ Refresh page

**Showing 0 wins?**
- ✓ Verify matches exist in season
- ✓ Matches must be marked "PLAYED"

**Missing players in next season?**
- ✓ Only imported players with recorded movements
- ✓ Add new players manually after season creation

## 📝 API Endpoints

### POST `/api/seasons/:id/closure/preview`
- Generate (or regenerate) PENDING closure
- Recalculates rankings for all groups
- Returns closure with all entries

### POST `/api/seasons/:id/closure/approve`
- Approve PENDING closure, mark as APPROVED
- Apply movements (create `PlayerGroupHistory` records)
- Returns approved closure with all entries

## 🔧 Implementation Details

**Logic Location:** `ranking.service.ts` → `computeSeasonClosure`

**Endpoints:** `season.routes.ts`

**Database Models:**
- `SeasonClosure` (record, states: PENDING/APPROVED)
- `SeasonClosureEntry` (per-player entry)
- `PlayerGroupHistory` (participation history per season)
