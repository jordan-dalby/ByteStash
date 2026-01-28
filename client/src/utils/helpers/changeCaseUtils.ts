export function capitalizeFirstLetter(strValue: string) {
  if (!strValue) {
    return '';
  }

  const trimmedValue = strValue.trim();

  return trimmedValue.charAt(0).toUpperCase() + trimmedValue.slice(1);
}