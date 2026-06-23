import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';

const mockAdmin = { id: 1, username: 'admin', password: '', createdAt: new Date() };

const authRepoMock = {
  findByUsername: jest.fn(),
  create: jest.fn(),
};

const jwtServiceMock = { sign: jest.fn().mockReturnValue('token') };

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: authRepoMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('returns accessToken when credentials are valid', async () => {
      const hashed = await bcrypt.hash('secret', 10);
      authRepoMock.findByUsername.mockResolvedValue({ ...mockAdmin, password: hashed });

      const result = await service.login({ username: 'admin', password: 'secret' });

      expect(result.accessToken).toBe('token');
    });

    it('throws UnauthorizedException when user does not exist', async () => {
      authRepoMock.findByUsername.mockResolvedValue(null);

      await expect(service.login({ username: 'x', password: 'y' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      const hashed = await bcrypt.hash('correct', 10);
      authRepoMock.findByUsername.mockResolvedValue({ ...mockAdmin, password: hashed });

      await expect(service.login({ username: 'admin', password: 'wrong' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('register', () => {
    it('creates admin and returns id and username', async () => {
      authRepoMock.create.mockResolvedValue({ id: 1, username: 'admin' });

      const result = await service.register({ username: 'admin', password: 'pass' });

      expect(result.username).toBe('admin');
      expect(authRepoMock.create).toHaveBeenCalledTimes(1);
    });
  });
});
