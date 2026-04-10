import type { VercelRequest, VercelResponse } from '@vercel/node';
import { enforceBrowserOrigin, enforceSensitiveApiEnabled } from '../../_security';
import { getFilingProvider, listAvailableFilingProviders } from '@/services/filing/providers';
import { parseJsonBody } from '@/services/filing/http';
import { buildMatter, ensureFilingTables, upsertFilingMatter } from '@/services/filing/supabase';
import type { CreateMatterInput, FilingProviderKey } from '@/types/filing';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    if (!enforceSensitiveApiEnabled(res)) return;
    if (!enforceBrowserOrigin(req, res)) return;
    return res.status(200).json({
      providers: listAvailableFilingProviders(),
      defaultProvider: 'manual',
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET,POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!enforceSensitiveApiEnabled(res)) return;
  if (!enforceBrowserOrigin(req, res)) return;

  const body = parseJsonBody<CreateMatterInput & { provider?: FilingProviderKey }>(req);
  if (!body?.internalMatterId || !body.caseType || !body.county || !body.partyInfo?.petitionerName) {
    return res.status(400).json({ error: 'internalMatterId, caseType, county, and partyInfo.petitionerName are required' });
  }

  await ensureFilingTables();

  const providerKey = body.provider ?? 'manual';
  const provider = getFilingProvider(providerKey);
  const result = await provider.createMatter(body);

  const matter = await upsertFilingMatter(
    buildMatter({
      id: body.internalMatterId,
      userId: body.internalMatterId,
      caseType: body.caseType,
      county: body.county,
      court: body.court,
      provider: providerKey,
      providerMatterId: result.providerMatterId,
      partyInfo: body.partyInfo,
      status: result.status,
    })
  );

  return res.status(200).json({
    provider: providerKey,
    matter,
    result,
  });
}
