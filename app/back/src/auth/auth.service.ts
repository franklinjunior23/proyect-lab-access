import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const admin = await this.authRepository.findByUsername(dto.username);
    if (!admin) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, admin.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({ sub: admin.id, username: admin.username });
    return { accessToken: token };
  }

  async register(dto: LoginDto) {
    const hashed = await bcrypt.hash(dto.password, 10);
    const admin = await this.authRepository.create(dto.username, hashed);
    return { id: admin.id, username: admin.username };
  }
}
