import { PrismaClient } from '@prisma/client'

// Configuração global do Prisma para ambientes de desenvolvimento e produção
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
})

// Prevenir múltiplas instâncias em desenvolvimento
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Helper function para conexão limpa
export async function connectDB() {
  try {
    await prisma.$connect()
    console.log('✅ Conectado ao PostgreSQL via Prisma')
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco:', error)
    throw error
  }
}

// Helper function para desconexão
export async function disconnectDB() {
  try {
    await prisma.$disconnect()
    console.log('✅ Desconectado do PostgreSQL')
  } catch (error) {
    console.error('❌ Erro ao desconectar do banco:', error)
  }
}

export default prisma
