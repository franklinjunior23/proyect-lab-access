import { Test } from '@nestjs/testing';
import { AccessService } from './access.service';
import { AccessRepository } from './access.repository';
import { UsersRepository } from '../users/users.repository';
import { Result } from '../generated/prisma';

const accessRepoMock = { logAccess: jest.fn(), findAll: jest.fn() };
const usersRepoMock = { findByUid: jest.fn() };

const mockUser = { id: 1, name: 'Ana', uid: 'ABC123', active: true, createdAt: new Date() };
const mockLog = {
  id: 1,
  uid: 'ABC123',
  result: Result.ACCESS_GRANTED,
  description: '',
  timestamp: new Date(),
  userId: 1,
};

describe('AccessService', () => {
  let service: AccessService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AccessService,
        { provide: AccessRepository, useValue: accessRepoMock },
        { provide: UsersRepository, useValue: usersRepoMock },
      ],
    }).compile();

    service = module.get(AccessService);
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('grants access when UID belongs to an active user', async () => {
      usersRepoMock.findByUid.mockResolvedValue(mockUser);
      accessRepoMock.logAccess.mockResolvedValue({ ...mockLog, result: Result.ACCESS_GRANTED });

      const result = await service.validate({ uid: 'ABC123' });

      expect(result.granted).toBe(true);
      expect(accessRepoMock.logAccess).toHaveBeenCalledWith(
        'ABC123',
        Result.ACCESS_GRANTED,
        expect.any(String),
        1,
      );
    });

    it('denies access when UID is unknown', async () => {
      usersRepoMock.findByUid.mockResolvedValue(null);
      accessRepoMock.logAccess.mockResolvedValue({ ...mockLog, result: Result.ACCESS_DENIED });

      const result = await service.validate({ uid: 'UNKNOWN' });

      expect(result.granted).toBe(false);
      expect(accessRepoMock.logAccess).toHaveBeenCalledWith(
        'UNKNOWN',
        Result.ACCESS_DENIED,
        expect.any(String),
        undefined,
      );
    });

    it('denies access when user exists but is inactive', async () => {
      usersRepoMock.findByUid.mockResolvedValue({ ...mockUser, active: false });
      accessRepoMock.logAccess.mockResolvedValue({ ...mockLog, result: Result.ACCESS_DENIED });

      const result = await service.validate({ uid: 'ABC123' });

      expect(result.granted).toBe(false);
    });
  });
});
