import { prisma } from '@freesquash/database';
import bcrypt from 'bcrypt';

async function verifyAndFixLogin() {
    try {
        console.log('=== Verificando usuarios ===\n');

        const adminEmail = 'admin@freesquash.com';
        const oierEmail = 'oier.quesada@freesquash.com';

        // Check admin
        const admin = await prisma.user.findUnique({
            where: { email: adminEmail },
            include: { player: true }
        });

        if (admin) {
            console.log(`✓ Usuario admin encontrado: ${admin.email}`);
            console.log(`  Rol: ${admin.role}`);
            console.log(`  Player: ${admin.player?.name || 'N/A'}`);

            // Test current password
            const matchesOld = await bcrypt.compare('password123', admin.password);
            console.log(`  Password 'password123' funciona: ${matchesOld}`);

            if (!matchesOld) {
                console.log('  ⚠ Reseteando password...');
                const newHash = await bcrypt.hash('password123', 10);
                await prisma.user.update({
                    where: { id: admin.id },
                    data: { password: newHash }
                });
                console.log('  ✓ Password actualizada a: password123');
            }
        } else {
            console.log(`✗ Usuario admin NO encontrado`);
        }

        console.log('');

        // Check oier
        const oier = await prisma.user.findUnique({
            where: { email: oierEmail },
            include: { player: true }
        });

        if (oier) {
            console.log(`✓ Usuario oier encontrado: ${oier.email}`);
            console.log(`  Rol: ${oier.role}`);
            console.log(`  Player: ${oier.player?.name || 'N/A'}`);

            const matchesOld = await bcrypt.compare('password123', oier.password);
            console.log(`  Password 'password123' funciona: ${matchesOld}`);

            if (!matchesOld) {
                console.log('  ⚠ Reseteando password...');
                const newHash = await bcrypt.hash('password123', 10);
                await prisma.user.update({
                    where: { id: oier.id },
                    data: { password: newHash }
                });
                console.log('  ✓ Password actualizada a: password123');
            }
        } else {
            console.log(`✗ Usuario oier NO encontrado`);
        }

        console.log('\n=== Verificación completa ===');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyAndFixLogin();
