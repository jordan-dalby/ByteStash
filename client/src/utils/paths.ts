export const getAssetPath = (path: string) => {
  const basePath = (window as any).__BASE_PATH__ || '';
  return `${basePath}${path}`;
}; 