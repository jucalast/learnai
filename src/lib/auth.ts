/**
 * 🔐 SERVIÇOS DE AUTENTICAÇÃO
 * Sistema completo de autenticação com JWT, bcrypt e validações
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

// Tipos para autenticação
export interface AuthUser {
  id: string;
  email?: string;
  username?: string;
  name?: string;
  userType: 'anonymous' | 'registered' | 'admin';
  isVerified: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

// Configurações JWT
const JWT_SECRET = process.env.JWT_SECRET || 'learnai-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'learnai-refresh-secret';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// ===================================
// 🔧 UTILITÁRIOS DE CRIPTOGRAFIA
// ===================================

/**
 * Hash da senha com bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verifica senha contra hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Gera tokens JWT
 */
export function generateTokens(userId: string): { accessToken: string; refreshToken: string } {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
}

/**
 * Verifica token JWT
 */
export function verifyToken(token: string, type: 'access' | 'refresh' = 'access'): { userId: string } | null {
  try {
    const secret = type === 'access' ? JWT_SECRET : JWT_REFRESH_SECRET;
    const decoded = jwt.verify(token, secret) as any;
    
    if (decoded.type === type) {
      return { userId: decoded.userId };
    }
    return null;
  } catch (error) {
    return null;
  }
}

// ===================================
// 🔐 SERVIÇO DE AUTENTICAÇÃO
// ===================================

export class AuthService {
  /**
   * Registra novo usuário
   */
  static async register(data: RegisterData): Promise<AuthResponse> {
    console.log('🔐 Registrando novo usuário...', { email: data.email });

    // Verifica se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('Email já está em uso');
    }

    // Hash da senha
    const hashedPassword = await hashPassword(data.password);

    // Cria usuário
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        userType: 'registered',
        isVerified: false
      }
    });

    // Gera tokens
    const tokens = generateTokens(user.id);

    // Salva refresh token no banco
    await prisma.authToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        type: 'refresh',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
      }
    });

    // Atualiza último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    console.log('✅ Usuário registrado com sucesso:', user.id);

    return {
      user: {
        id: user.id,
        email: user.email!,
        name: user.name!,
        userType: user.userType as 'registered',
        isVerified: user.isVerified
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  /**
   * Login do usuário
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('🔐 Fazendo login...', { email: credentials.email });

    // Busca usuário
    const user = await prisma.user.findUnique({
      where: { email: credentials.email }
    });

    if (!user || !user.password) {
      throw new Error('Credenciais inválidas');
    }

    // Verifica senha
    const isValidPassword = await verifyPassword(credentials.password, user.password);
    if (!isValidPassword) {
      throw new Error('Credenciais inválidas');
    }

    // Gera tokens
    const tokens = generateTokens(user.id);

    // Remove tokens antigos e salva novo
    await prisma.authToken.deleteMany({
      where: { userId: user.id, type: 'refresh' }
    });

    await prisma.authToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        type: 'refresh',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Atualiza último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    console.log('✅ Login realizado com sucesso:', user.id);

    return {
      user: {
        id: user.id,
        email: user.email!,
        name: user.name!,
        userType: user.userType as 'registered',
        isVerified: user.isVerified
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  /**
   * Refresh token
   */
  static async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const decoded = verifyToken(refreshToken, 'refresh');
    if (!decoded) {
      throw new Error('Token inválido');
    }

    // Verifica se token existe no banco e não foi usado
    const tokenRecord = await prisma.authToken.findFirst({
      where: {
        token: refreshToken,
        type: 'refresh',
        isUsed: false,
        expiresAt: { gt: new Date() }
      }
    });

    if (!tokenRecord) {
      throw new Error('Token inválido ou expirado');
    }

    // Marca token como usado
    await prisma.authToken.update({
      where: { id: tokenRecord.id },
      data: { isUsed: true }
    });

    // Gera novos tokens
    const newTokens = generateTokens(decoded.userId);

    // Salva novo refresh token
    await prisma.authToken.create({
      data: {
        userId: decoded.userId,
        token: newTokens.refreshToken,
        type: 'refresh',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    return newTokens;
  }

  /**
   * Logout
   */
  static async logout(refreshToken: string): Promise<void> {
    await prisma.authToken.updateMany({
      where: { token: refreshToken },
      data: { isUsed: true }
    });
  }

  /**
   * Busca usuário pelo ID
   */
  static async getUserById(userId: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || undefined,
      username: user.username || undefined,
      name: user.name || undefined,
      userType: user.userType as 'anonymous' | 'registered' | 'admin',
      isVerified: user.isVerified
    };
  }

  /**
   * Converte usuário anônimo em registrado
   */
  static async convertAnonymousUser(
    anonymousUserId: string,
    registerData: RegisterData
  ): Promise<AuthResponse> {
    console.log('🔄 Convertendo usuário anônimo...', { anonymousUserId });

    // Verifica se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: registerData.email }
    });

    if (existingUser) {
      throw new Error('Email já está em uso');
    }

    // Hash da senha
    const hashedPassword = await hashPassword(registerData.password);

    // Atualiza usuário anônimo
    const user = await prisma.user.update({
      where: { id: anonymousUserId },
      data: {
        email: registerData.email,
        name: registerData.name,
        password: hashedPassword,
        userType: 'registered',
        isVerified: false,
        lastLogin: new Date()
      }
    });

    // Gera tokens
    const tokens = generateTokens(user.id);

    // Salva refresh token
    await prisma.authToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        type: 'refresh',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    console.log('✅ Usuário convertido com sucesso:', user.id);

    return {
      user: {
        id: user.id,
        email: user.email!,
        name: user.name!,
        userType: 'registered',
        isVerified: user.isVerified
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  /**
   * Gera token de verificação de email
   */
  static async generateEmailVerificationToken(userId: string): Promise<string> {
    const token = jwt.sign(
      { userId, type: 'email_verification' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await prisma.authToken.create({
      data: {
        userId,
        token,
        type: 'email_verification',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    return token;
  }

  /**
   * Verifica email
   */
  static async verifyEmail(token: string): Promise<boolean> {
    const decoded = verifyToken(token);
    if (!decoded) {
      return false;
    }

    const tokenRecord = await prisma.authToken.findFirst({
      where: {
        token,
        type: 'email_verification',
        isUsed: false,
        expiresAt: { gt: new Date() }
      }
    });

    if (!tokenRecord) {
      return false;
    }

    // Marca email como verificado
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { isVerified: true }
    });

    // Marca token como usado
    await prisma.authToken.update({
      where: { id: tokenRecord.id },
      data: { isUsed: true }
    });

    return true;
  }
}

// ===================================
// 🛡️ MIDDLEWARE DE AUTENTICAÇÃO
// ===================================

export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export async function authenticateRequest(authHeader?: string): Promise<AuthUser | null> {
  const token = extractTokenFromHeader(authHeader);
  if (!token) {
    return null;
  }

  const decoded = verifyToken(token, 'access');
  if (!decoded) {
    return null;
  }

  return await AuthService.getUserById(decoded.userId);
}
