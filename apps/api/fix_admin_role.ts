import { prisma } from '@freesquash/database';

async function fixAdminRole() {
    try {
        console.log('Cambiando rol de admin@freesquash.com a ADMIN...\n');

        const updated = await prisma.user.update({
            where: { email: 'admin@freesquash.com' },
            data: { role: 'ADMIN' },
            include: { player: true }
        });

        console.log('✓ Usuario actualizado:');
        console.log(`  Email: ${updated.email}`);
        console.log(`  Rol: ${updated.role}`);
        console.log(`  Player: ${updated.player?.name}`);
        console.log('\n✓ Ahora puedes hacer login como admin con:');
        console.log('  Email: admin@freesquash.com');
        console.log('  Password: password123');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixAdminRole();
