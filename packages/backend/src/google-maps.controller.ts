import { Body, Controller, Get, Post, Query } from '@nestjs/common';

interface ReistijdResponse {
  minSeconds: number | null;
  maxSeconds: number | null;
  reason?: string;
}

type LatLng = { latitude?: number; longitude?: number };
type RoutesApiResponse = {
  routes?: {
    duration?: string;
    polyline?: { encodedPolyline?: string };
    legs?: {
      duration?: string;
      distanceMeters?: number;
      startLocation?: { latLng?: LatLng };
      endLocation?: { latLng?: LatLng };
    }[];
  }[];
};

interface RouteRequest {
  origin: string;
  destination: string;
  waypoints: string[];
}

interface RouteResponse {
  encodedPolyline?: string;
  legs: {
    durationSeconds: number;
    distanceMeters: number;
    startLocation?: { lat: number; lng: number };
    endLocation?: { lat: number; lng: number };
  }[];
}

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

      if (optimisticRes.status === 400 || pessimisticRes.status === 400) {
        const errorBody = (await (
          optimisticRes.status === 400 ? optimisticRes : pessimisticRes
        ).json()) as { error?: { message?: string } };
        if (errorBody.error?.message?.includes('future time')) {
          return { minSeconds: null, maxSeconds: null, reason: 'past_date' };
        }
        return {
          minSeconds: null,
          maxSeconds: null,
          reason: 'invalid_request',
        };
      }

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

  @Post('route')
  async computeRoute(@Body() req: RouteRequest): Promise<RouteResponse | null> {
    const apiKey = process.env['GOOGLE_MAPS_API_KEY'];
    if (!apiKey) return null;

    const intermediates = req.waypoints.map((address) => ({
      address,
    }));

    const body = JSON.stringify({
      origin: { address: req.origin },
      destination: { address: req.destination },
      intermediates,
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      polylineEncoding: 'ENCODED_POLYLINE',
    });

    const headers = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'routes.polyline.encodedPolyline,routes.legs.duration,routes.legs.distanceMeters,routes.legs.startLocation,routes.legs.endLocation',
    };

    const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';

    try {
      const res = await fetch(url, { method: 'POST', headers, body });
      const data = (await res.json()) as RoutesApiResponse;
      const route = data.routes?.[0];
      if (!route) return null;
      return {
        encodedPolyline: route.polyline?.encodedPolyline,
        legs: (route.legs ?? []).map((leg) => ({
          durationSeconds: leg.duration
            ? parseInt(leg.duration.replace('s', ''), 10)
            : 0,
          distanceMeters: leg.distanceMeters ?? 0,
          startLocation: leg.startLocation?.latLng
            ? {
                lat: leg.startLocation.latLng.latitude!,
                lng: leg.startLocation.latLng.longitude!,
              }
            : undefined,
          endLocation: leg.endLocation?.latLng
            ? {
                lat: leg.endLocation.latLng.latitude!,
                lng: leg.endLocation.latLng.longitude!,
              }
            : undefined,
        })),
      };
    } catch {
      return null;
    }
  }
}
