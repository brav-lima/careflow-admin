import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as bcrypt from 'bcrypt'
import { randomBytes } from 'crypto'

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
  const DEFAULT_PASSWORD = 'changeme123'
  const rawPassword = process.env.SEED_ADMIN_PASSWORD ?? DEFAULT_PASSWORD
  const isDefault = rawPassword === DEFAULT_PASSWORD

  const adminPassword = isDefault ? randomBytes(16).toString('hex') : rawPassword
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
  if (isDefault) {
    console.log('🔑 Uma senha aleatória foi gerada automaticamente para o admin.')
    console.log('⚠️  Defina/rotacione a senha por um canal seguro antes de uso em produção.')
  } else {
    console.log('⚠️  Troque a senha do admin após o primeiro login!')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
