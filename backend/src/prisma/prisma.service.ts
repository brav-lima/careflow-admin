import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient, Prisma } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { types } from 'pg'

// Decimal.toJSON() returns a string by default ("1499.99"). Override to return a number so
// JSON.stringify always produces a numeric JSON value instead of a string or internal {s,e,d} structure.
;(Prisma.Decimal.prototype as unknown as { toJSON: () => number }).toJSON = function (this: Prisma.Decimal) {
  return this.toNumber()
}

// PrismaPg returns DateTime fields as Date objects that serialize as {} in JSON.
// Configuring pg type parsers to return ISO strings fixes serialization for all DateTime fields.
types.setTypeParser(types.builtins.TIMESTAMP, (val: string) => new Date(val).toISOString())
types.setTypeParser(types.builtins.TIMESTAMPTZ, (val: string) => new Date(val).toISOString())

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_ADMIN_URL! }) })
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
