import { prisma } from '@freesquash/database';
import { computeSeasonClosure } from '../services/ranking.service';

(async () => {
  try {
    const season = await prisma.season.findFirst({ include: { groups: true }});
    if (!season) {
      console.log('No season found');
      return;
    }
    const closure = await computeSeasonClosure(season.id);
    if (!closure) {
      console.log('No closure generated');
      return;
    }
    console.log('Season:', season.name);
    console.log('Closure status:', closure.status);
    console.log('Total entries:', closure.entries.length);

    // Group and summarize by movement type
    const promotions = closure.entries.filter(e => e.movementType === 'PROMOTION');
    const relegations = closure.entries.filter(e => e.movementType === 'RELEGATION');
    const stays = closure.entries.filter(e => e.movementType === 'STAY');

    console.log('\nPromotions:', promotions.length);
    console.log('Relegations:', relegations.length);
    console.log('Stays:', stays.length);

    const orderedGroups = [...season.groups].sort((a,b) => a.name.localeCompare(b.name));
    console.log('\nGroups (sorted):', orderedGroups.map(g => g.name));

    // Show sample promotions
    if (promotions.length > 0) {
      console.log('\nFirst promotion sample:');
      const p = promotions[0];
      const fromGroup = orderedGroups.find(g => g.id === p.fromGroupId);
      const toGroup = orderedGroups.find(g => g.id === p.toGroupId);
      console.log(`  Player ${p.playerId} from ${fromGroup?.name} (rank ${p.finalRank}) => ${toGroup?.name}`);
    }

    // Show sample relegations
    if (relegations.length > 0) {
      console.log('\nFirst relegation sample:');
      const r = relegations[0];
      const fromGroup = orderedGroups.find(g => g.id === r.fromGroupId);
      const toGroup = orderedGroups.find(g => g.id === r.toGroupId);
      console.log(`  Player ${r.playerId} from ${fromGroup?.name} (rank ${r.finalRank}) => ${toGroup?.name}`);
    }

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
