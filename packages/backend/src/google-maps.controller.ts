import { Controller, Get, Query } from '@nestjs/common';

interface ReistijdResponse {
  durationSeconds: number | null;
  reason?: string;
}

@Controller({ path: 'google-maps' })
export class GoogleMapsController {
  @Get('reistijd')
  async getReistijd(
    @Query('origin') origin: string,
    @Query('destination') destination: string,
    @Query('vertrekTijd') vertrekTijd?: string,
  ): Promise<ReistijdResponse> {
    const apiKey = process.env['GOOGLE_MAPS_API_KEY'];
    if (!apiKey) {
      return { durationSeconds: null, reason: 'no_api_key' };
    }

    const params = new URLSearchParams({
      origin,
      destination,
      key: apiKey,
    });
    if (vertrekTijd) {
      params.set('departure_time', vertrekTijd);
    }

    const url = `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`;
    const response = await fetch(url);
    const data = (await response.json()) as {
      status: string;
      routes?: { legs?: { duration?: { value: number } }[] }[];
    };

    if (data.status !== 'OK' || !data.routes?.[0]?.legs?.[0]?.duration) {
      return { durationSeconds: null };
    }

    return { durationSeconds: data.routes[0].legs[0].duration.value };
  }
}
