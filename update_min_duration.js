const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateMinDuration() {
  try {
    const result = await prisma.globalSettings.updateMany({
      where: {
        OR: [
          { minDuration: { not: 1 } },
          { minDuration: null }
        ]
      },
      data: {
        minDuration: 1
      }
    });
    
    console.log(`✅ ${result.count} produits mis à jour avec minDuration = 1`);
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateMinDuration();
