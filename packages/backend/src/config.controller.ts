import { Controller, Get } from '@nestjs/common';

@Controller({ path: 'config' })
export class ConfigController {
  @Get()
  getConfig(): { googleMapsApiKey: string | null } {
    return {
      googleMapsApiKey: process.env['GOOGLE_MAPS_API_KEY'] ?? null,
    };
  }
}
