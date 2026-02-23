import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding admin database...')

  // Planos padrão
  const plans = [
    {
      name: 'Básico',
      priceMonthly: 97,
      maxUsers: 3,
      maxPatients: 200,
      features: { nfse: false, whatsapp: false, reports: true },
    },
    {
      name: 'Profissional',
      priceMonthly: 197,
      maxUsers: 10,
      maxPatients: 1000,
      features: { nfse: true, whatsapp: false, reports: true },
    },
    {
      name: 'Clínica',
      priceMonthly: 397,
      maxUsers: 999,
      maxPatients: 999999,
      features: { nfse: true, whatsapp: true, reports: true },
    },
  ]

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.name },
      update: {},
      create: plan,
    })
  }

  console.log(`✅ ${plans.length} planos criados`)

  // Super admin inicial
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@careflow.com.br'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'changeme123'

  const passwordHash = await bcrypt.hash(adminPassword, 12)

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Super Admin',
      email: adminEmail,
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  })

  console.log(`✅ Admin criado: ${adminEmail}`)
  console.log('⚠️  Troque a senha do admin após o primeiro login!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
