import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

const mockUser = { id: 1, name: 'Ana', uid: 'ABC123', active: true, createdAt: new Date() };

const repoMock = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByUid: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UsersService, { provide: UsersRepository, useValue: repoMock }],
    }).compile();

    service = module.get(UsersService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('returns the user when found', async () => {
      repoMock.findById.mockResolvedValue(mockUser);
      const result = await service.findOne(1);
      expect(result).toEqual(mockUser);
    });

    it('throws NotFoundException when user does not exist', async () => {
      repoMock.findById.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a user when UID is not taken', async () => {
      repoMock.findByUid.mockResolvedValue(null);
      repoMock.create.mockResolvedValue(mockUser);

      const result = await service.create({ name: 'Ana', uid: 'ABC123' });
      expect(result).toEqual(mockUser);
    });

    it('throws ConflictException when UID already exists', async () => {
      repoMock.findByUid.mockResolvedValue(mockUser);
      await expect(service.create({ name: 'Ana', uid: 'ABC123' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('toggle', () => {
    it('flips active from true to false', async () => {
      repoMock.findById.mockResolvedValue(mockUser);
      repoMock.update.mockResolvedValue({ ...mockUser, active: false });

      const result = await service.toggle(1);
      expect(repoMock.update).toHaveBeenCalledWith(1, { active: false });
      expect(result.active).toBe(false);
    });
  });
});
