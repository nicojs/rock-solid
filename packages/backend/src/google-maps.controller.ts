import { Controller, Get, Query } from '@nestjs/common';

interface ReistijdResponse {
  minSeconds: number | null;
  maxSeconds: number | null;
  reason?: string;
}

type RoutesApiResponse = {
  routes?: { duration?: string }[];
};

@Controller({ path: 'google-maps' })
export class GoogleMapsController {
  @Get('reistijd')
  async getReistijd(
    @Query('origin') origin: string,
    @Query('destination') destination: string,
    @Query('aankomstTijd') aankomstTijd?: string,
  ): Promise<ReistijdResponse> {
    const apiKey = process.env['GOOGLE_MAPS_API_KEY'];
    if (!apiKey) {
      return { minSeconds: null, maxSeconds: null, reason: 'no_api_key' };
    }

    const body = (trafficModel: string) =>
      JSON.stringify({
        origin: { address: origin },
        destination: { address: destination },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
        ...(aankomstTijd ? { departureTime: aankomstTijd } : {}),
        trafficModel,
      });

    const headers = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'routes.duration',
    };

    const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';

    const parseDuration = (data: RoutesApiResponse): number | null => {
      const raw = data.routes?.[0]?.duration;
      if (!raw) return null;
      return parseInt(raw.replace('s', ''), 10);
    };

    try {
      const [optimisticRes, pessimisticRes] = await Promise.all([
        fetch(url, { method: 'POST', headers, body: body('OPTIMISTIC') }),
        fetch(url, { method: 'POST', headers, body: body('PESSIMISTIC') }),
      ]);

      const [optimistic, pessimistic] = await Promise.all([
        optimisticRes.json() as Promise<RoutesApiResponse>,
        pessimisticRes.json() as Promise<RoutesApiResponse>,
      ]);

      return {
        minSeconds: parseDuration(optimistic),
        maxSeconds: parseDuration(pessimistic),
      };
    } catch {
      return { minSeconds: null, maxSeconds: null };
    }
  }
}
