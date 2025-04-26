import { useTranslation } from '../contexts/LanguageContext';

/**
 * Formats a distance value in meters to a user-friendly string
 * @param distanceInMeters - The distance in meters
 * @param useAbbreviation - Whether to use abbreviated units (m, km) instead of full words
 * @returns Formatted distance string (e.g. "750 meters", "1.2 kilometers", "750 m", or "1.2 km")
 */
export const formatDistance = (
  distanceInMeters: number | undefined | null,
  useAbbreviation = false
): string => {
  const { t } = useTranslation();
  
  if (distanceInMeters === undefined || distanceInMeters === null) {
    return '';
  }

  // For distances less than 1km, show in meters
  if (distanceInMeters < 1000) {
    const unit = useAbbreviation ? t('distance.m') : t('distance.meters');
    return `${Math.round(distanceInMeters)} ${unit}`;
  }
  
  // For distances 1km or greater, show in kilometers with one decimal place
  const distanceInKm = distanceInMeters / 1000;
  const formattedDistance = distanceInKm.toFixed(1);
  
  // Remove decimal if it ends in .0
  const finalDistance = formattedDistance.endsWith('.0') 
    ? formattedDistance.slice(0, -2) 
    : formattedDistance;
    
  const unit = useAbbreviation ? t('distance.km') : t('distance.kilometers');
  
  return `${finalDistance} ${unit}`;
}; 