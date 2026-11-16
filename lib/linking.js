// Web addresses for every screen, so the browser's back / forward buttons and refresh work
// (e.g. /app/dish/abc123, /app/passport). The app lives in an "app" folder that can sit anywhere
// on the site, so the part of the address before it is kept as a base and left alone.
import { Platform } from 'react-native';
import { getPathFromState, getStateFromPath } from '@react-navigation/native';

const web = Platform.OS === 'web' && typeof window !== 'undefined';
const BASE = web ? (window.location.pathname.match(/^(.*?\/app)(?=\/|$)/)?.[1] ?? '') : '';

// the screens every tab can open, under that tab's own address
const details = (prefix) => ({
  Place: `${prefix}place/:placeId`,
  Dish: `${prefix}dish/:dishId`,
  Friend: `${prefix}friend/:uid`,
});

const config = {
  screens: {
    Login: 'login',
    SignUp: 'signup',
    Onboarding: 'welcome',
    Main: {
      screens: {
        TodayTab: {
          screens: {
            Today: '',
            ...details(''),
            Mood: 'mood/:mood',
            Feed: 'feed',
            Deals: 'deals',
            AddDeal: 'deals/new',
            Decider: 'decide',
          },
        },
        ExploreTab: { screens: { Explore: 'explore', ...details('explore/') } },
        ReviewTab: {
          screens: { PickDish: 'rate', AddDish: 'rate/new-dish', WriteReview: 'rate/:dishId', Compare: 'rate/compare' },
        },
        ListTab: { screens: { MyList: 'list', ...details('list/') } },
        MeTab: {
          screens: {
            Profile: 'me',
            Settings: 'me/school',
            Friends: 'me/friends',
            Passport: 'passport',
            ...details('me/'),
          },
        },
      },
    },
    Wrapped: 'wrapped',
  },
};

// the screen you land on remembers the address it came from and reuses it, so put the base back on
const withBase = (state) =>
  state && {
    ...state,
    routes: state.routes.map((r) => ({
      ...r,
      ...(r.path ? { path: BASE + r.path } : null),
      ...(r.state ? { state: withBase(r.state) } : null),
    })),
  };

export const linking = web
  ? {
      prefixes: [],
      config,
      getStateFromPath: (path, options) =>
        withBase(getStateFromPath(path.startsWith(BASE) ? path.slice(BASE.length) || '/' : path, options)),
      getPathFromState: (state, options) => BASE + getPathFromState(state, options),
    }
  : undefined;
