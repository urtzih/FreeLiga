import { prisma } from '@freesquash/database';

async function removeAdminFromGroups() {
    try {
        console.log('Buscando usuario admin...');

        const adminUser = await prisma.user.findUnique({
            where: { email: 'admin@freesquash.com' },
            include: {
                player: {
                    include: {
                        groupPlayers: true
                    }
                }
            }
        });

        if (!adminUser) {
            console.log('❌ Usuario admin no encontrado');
            return;
        }

        console.log(`✓ Usuario encontrado: ${adminUser.email}`);
        console.log(`  Rol: ${adminUser.role}`);
        console.log(`  Player ID: ${adminUser.player?.id}`);
        console.log(`  Grupos asignados: ${adminUser.player?.groupPlayers?.length || 0}`);

        if (adminUser.player && adminUser.player.groupPlayers.length > 0) {
            console.log('\n🔧 Eliminando admin de todos los grupos...');

            for (const gp of adminUser.player.groupPlayers) {
                await prisma.groupPlayer.delete({
                    where: { id: gp.id }
                });
                console.log(`  ✓ Eliminado de grupo ${gp.groupId}`);
            }

            // Also clear currentGroupId
            await prisma.player.update({
                where: { id: adminUser.player.id },
                data: { currentGroupId: null }
            });
            console.log('  ✓ currentGroupId limpiado');
        }

        console.log('\n✅ Admin limpiado correctamente');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

removeAdminFromGroups();
