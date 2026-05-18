import { Href } from 'expo-router';

export type FlightDetailsPreview = {
  id: string;
  aircraft_type?: string;
  aircraft_registration?: string;
  origin_iata?: string;
  destination_iata?: string;
  block_time?: string;
  flight_date?: string;
  pic_name?: string;
  co_pilot_name?: string;
};

export function flightDetailsHref(preview: FlightDetailsPreview): Href {
  return {
    pathname: '/flight-details/[id]',
    params: {
      id: preview.id,
      preview_aircraft_type: preview.aircraft_type ?? '',
      preview_aircraft_registration: preview.aircraft_registration ?? '',
      preview_origin_iata: preview.origin_iata ?? '',
      preview_destination_iata: preview.destination_iata ?? '',
      preview_block_time: preview.block_time ?? '',
      preview_flight_date: preview.flight_date ?? '',
      preview_pic_name: preview.pic_name ?? '',
      preview_co_pilot_name: preview.co_pilot_name ?? '',
    },
  };
}

export function parseFlightDetailsPreview(params: Record<string, string | string[] | undefined>): FlightDetailsPreview {
  const str = (key: string) => {
    const value = params[key];
    return typeof value === 'string' ? value : '';
  };

  return {
    id: str('id'),
    aircraft_type: str('preview_aircraft_type') || undefined,
    aircraft_registration: str('preview_aircraft_registration') || undefined,
    origin_iata: str('preview_origin_iata') || undefined,
    destination_iata: str('preview_destination_iata') || undefined,
    block_time: str('preview_block_time') || undefined,
    flight_date: str('preview_flight_date') || undefined,
    pic_name: str('preview_pic_name') || undefined,
    co_pilot_name: str('preview_co_pilot_name') || undefined,
  };
}
