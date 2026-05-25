import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as bcrypt from 'bcrypt'
import { randomBytes } from 'crypto'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_ADMIN_URL! })
const prisma = new PrismaClient({ adapter })

const FEATURE_DEFINITIONS = [
  { key: 'AGENDA',              label: 'Agenda',                              description: 'Agendamento de consultas com visões dia/semana/mês e drag-and-drop',       sortOrder: 1 },
  { key: 'PATIENTS',            label: 'Pacientes (ilimitados)',               description: 'Cadastro e gestão completa de pacientes com histórico clínico',            sortOrder: 2 },
  { key: 'FINANCIAL_BASIC',     label: 'Financeiro básico',                   description: 'Registro de receitas e despesas vinculadas a consultas e pacientes',       sortOrder: 3 },
  { key: 'FINANCIAL_ADVANCED',  label: 'Relatórios financeiros avançados',    description: 'Resumos mensais, extratos e análises financeiras avançadas',               sortOrder: 4 },
  { key: 'PERINEAL_ASSESSMENT', label: 'Avaliação perineal',                  description: 'Wizard de avaliação do assoalho pélvico em 6 etapas com dados flexíveis',  sortOrder: 5 },
  { key: 'TREATMENT_PACKAGES',  label: 'Pacotes de tratamento',               description: 'Criação e controle de pacotes de sessões por paciente',                    sortOrder: 6 },
  { key: 'ANAMNESIS',           label: 'Anamnese personalizada',              description: 'Formulários de anamnese com estrutura livre em JSON por clínica',          sortOrder: 7 },
  { key: 'EVOLUTIONS',          label: 'Prontuários e evoluções',             description: 'Linha do tempo de evoluções clínicas vinculadas a consultas',              sortOrder: 8 },
  { key: 'ROLES',               label: 'Perfis por função',                   description: 'Controle de acesso por papel: Admin, Profissional e Recepcionista',        sortOrder: 9 },
  { key: 'MULTI_PROFESSIONAL',  label: 'Múltiplos profissionais',             description: 'Gestão de equipe com vários profissionais na mesma clínica',               sortOrder: 10 },
  { key: 'MULTI_CLINIC',        label: 'Multi-clínica',                       description: 'Um usuário administrador gerenciando múltiplas unidades',                  sortOrder: 11 },
  { key: 'PRIORITY_SUPPORT',    label: 'Suporte prioritário',                 description: 'Atendimento prioritário por canais dedicados',                             sortOrder: 12 },
  { key: 'DOCUMENTS',           label: 'Módulo de Documentos',                description: 'Geração e armazenamento de documentos PDF para pacientes',                 sortOrder: 13 },
]

async function main() {
  console.log('🌱 Seeding admin database...')

  // Feature definitions — single source of truth para features disponíveis no sistema
  for (const feature of FEATURE_DEFINITIONS) {
    await prisma.planFeatureDefinition.upsert({
      where: { key: feature.key },
      update: { label: feature.label, description: feature.description, sortOrder: feature.sortOrder },
      create: feature,
    })
  }
  console.log(`✅ ${FEATURE_DEFINITIONS.length} feature definitions sincronizadas`)

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
