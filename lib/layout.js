// Screen sizes. On a phone the app is one column with tabs at the bottom; from 900px wide the
// tabs become a menu card down the left, and from 1260px a live column joins on the right.
import { useWindowDimensions } from 'react-native';

export const SIDEBAR = 248;
export const RAIL = 330;
export const COLUMN_MAX = 980;

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const wide = width >= 900;
  const rail = width >= 1260;
  const column = Math.min(COLUMN_MAX, width - (wide ? SIDEBAR : 0) - (rail ? RAIL : 0));
  return { width, height, wide, rail, column };
}
