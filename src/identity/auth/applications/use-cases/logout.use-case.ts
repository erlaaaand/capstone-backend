// application/use-cases/logout.use-case.ts
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class LogoutService {
  private readonly logger = new Logger(LogoutService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Execute logout use case
   * Note: Since we're using stateless JWT, logout is handled client-side
   * This service is for future enhancements (token blacklist, etc.)
   */
  async execute(userId: string): Promise<{ message: string }> {
    this.logger.log(`User logged out: ${userId}`);

    // Future: Add token to blacklist
    // Future: Clear refresh tokens from database

    // Emit logout event for audit/analytics
    this.eventEmitter.emit('user.logged-out', {
      userId,
      timestamp: new Date(),
    });

    return {
      message: 'Logout berhasil',
    };
  }
}