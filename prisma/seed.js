import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const password = 'Password123!'

  const users = [
    { email: 'client.prive@pretbank.com', password, role: 'CLIENT_PRIVE', name: 'Jean Souleymane' },
    { email: 'client.public@pretbank.com', password, role: 'CLIENT_PUBLIC', name: 'Marie Kouadio' },
    { email: 'gestionnaire@pretbank.com', password, role: 'GESTIONNAIRE', name: 'Gestionnaire PrêtBank' },
    { email: 'dg@pretbank.com', password, role: 'DG', name: 'Directeur Général' }
  ]

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    })
  }

  const settings = [
    { productName: 'CRÉDIT FLASH', rate: 11, minAmount: 100000, maxAmount: 3000000, minDuration: 1, maxDuration: 24 },
    { productName: 'PRÊT CONSO', rate: 9, minAmount: 500000, maxAmount: 10000000, minDuration: 1, maxDuration: 60 },
    { productName: 'PRÊT SCOLAIRE', rate: 7.5, minAmount: 100000, maxAmount: 5000000, minDuration: 1, maxDuration: 12 },
  ]

  for (const setting of settings) {
    await prisma.globalSettings.upsert({
      where: { productName: setting.productName },
      update: setting,
      create: setting,
    })
  }

  console.log('Seed completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
