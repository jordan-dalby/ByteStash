interface EmbedParams {
  shareId: string;
  showTitle: boolean;
  showDescription: boolean;
  showFileHeaders: boolean;
  showPoweredBy: boolean;
  theme: string;
  fragmentIndex?: number;
}

export const generateEmbedId = (params: EmbedParams): string => {
  const paramsString = `${params.shareId}-${params.showTitle}-${params.showDescription}-${params.showFileHeaders}-${params.showPoweredBy}-${params.fragmentIndex ?? 'all'}`;
  
  let hash = 0;
  for (let i = 0; i < paramsString.length; i++) {
    const char = paramsString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const hashStr = Math.abs(hash).toString(16).padStart(16, '0').slice(0, 16);
  return hashStr;
};
