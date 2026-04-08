import type { FilingProvider, FilingProviderKey } from '@/types/filing';
import { ManualFilingProvider } from './manual';
import { OneLegalFilingProvider } from './onelegal';

const providers: Partial<Record<FilingProviderKey, FilingProvider>> = {
  manual: new ManualFilingProvider(),
  onelegal: new OneLegalFilingProvider(),
};

export function getFilingProvider(provider: FilingProviderKey | undefined | null): FilingProvider {
  if (!provider || provider === 'none') {
    return providers.manual as FilingProvider;
  }

  const resolved = providers[provider];
  if (!resolved) {
    return providers.manual as FilingProvider;
  }

  return resolved;
}

export function listAvailableFilingProviders(): FilingProviderKey[] {
  return Object.keys(providers) as FilingProviderKey[];
}
