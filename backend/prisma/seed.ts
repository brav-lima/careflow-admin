import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as bcrypt from 'bcrypt'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_ADMIN_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding admin database...')

  // Planos padrão
  const plans = [
    {
      name: 'Trial',
      priceMonthly: 0,
      maxUsers: 3,
      maxPatients: 50,
      features: { nfse: false, whatsapp: false, reports: false, trial: true },
    },
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
      where: { name: plan.name },
      update: {},
      create: plan,
    })
  }

  console.log(`✅ ${plans.length} planos criados (inclui Trial)`)

  // Super admin inicial
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@soupelvi.com.br'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD

  if (!adminPassword) {
    throw new Error('SEED_ADMIN_PASSWORD env var is required')
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12)

  const existing = await prisma.adminUser.findUnique({ where: { email: adminEmail }, select: { id: true } })

  if (existing) {
    console.log(`✅ Admin já existe: ${adminEmail} (senha não alterada)`)
  } else {
    await prisma.adminUser.create({
      data: { name: 'Super Admin', email: adminEmail, passwordHash, role: 'SUPER_ADMIN' },
    })
    console.log(`✅ Admin criado: ${adminEmail}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
