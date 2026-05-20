import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as bcrypt from 'bcrypt'
import { randomBytes } from 'crypto'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_ADMIN_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding admin database...')

  // Planos padrão — features como array de PlanFeatureKey (alinhado com pelvi-ui)
  const plans = [
    {
      name: 'Trial',
      priceMonthly: 0,
      maxUsers: 4,
      maxPatients: 999999,
      isActive: true,
      visibleToClinic: false,
      features: [
        'AGENDA', 'PATIENTS', 'FINANCIAL_BASIC',
        'PERINEAL_ASSESSMENT', 'TREATMENT_PACKAGES', 'EVOLUTIONS',
        'FINANCIAL_ADVANCED', 'ANAMNESIS', 'ROLES', 'MULTI_PROFESSIONAL',
      ],
    },
    {
      name: 'Solo',
      priceMonthly: 89,
      maxUsers: 1,
      maxPatients: 999999,
      features: [
        'AGENDA', 'PATIENTS', 'FINANCIAL_BASIC',
        'PERINEAL_ASSESSMENT', 'TREATMENT_PACKAGES', 'EVOLUTIONS',
      ],
    },
    {
      name: 'Clínica',
      priceMonthly: 179,
      maxUsers: 4,
      maxPatients: 999999,
      features: [
        'AGENDA', 'PATIENTS', 'FINANCIAL_BASIC', 'FINANCIAL_ADVANCED',
        'PERINEAL_ASSESSMENT', 'TREATMENT_PACKAGES', 'ANAMNESIS',
        'EVOLUTIONS', 'ROLES', 'MULTI_PROFESSIONAL',
      ],
    },
    {
      name: 'Rede',
      priceMonthly: 349,
      maxUsers: 10,
      maxPatients: 999999,
      features: [
        'AGENDA', 'PATIENTS', 'FINANCIAL_BASIC', 'FINANCIAL_ADVANCED',
        'PERINEAL_ASSESSMENT', 'TREATMENT_PACKAGES', 'ANAMNESIS',
        'EVOLUTIONS', 'ROLES', 'MULTI_PROFESSIONAL',
        'MULTI_CLINIC', 'PRIORITY_SUPPORT',
      ],
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
