import { fetchMetarReports } from '@/utils/aviation-weather';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get('ids')?.trim().toUpperCase();

  if (!ids) {
    return Response.json({ error: 'Query parameter "ids" is required (e.g. KMCI).' }, { status: 400 });
  }

  try {
    const reports = await fetchMetarReports(ids);
    return Response.json(reports, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch METAR data.';
    return Response.json({ error: message }, { status: 502 });
  }
}
