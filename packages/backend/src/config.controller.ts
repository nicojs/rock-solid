import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/index.js';

@Controller({ path: 'config' })
export class ConfigController {
  @Get()
  @Public()
  getConfig(): { googleMapsApiKey: string | null } {
    return {
      googleMapsApiKey: process.env['GOOGLE_MAPS_API_KEY'] ?? null,
    };
  }
}
