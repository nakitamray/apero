// When the web build runs inside the apero website (in the phone mockup), tell the page
// which screen you're on, and let the page send you to a screen when a tour step is clicked.
import { Platform } from 'react-native';

const embedded = Platform.OS === 'web' && typeof window !== 'undefined' && window.parent !== window;

// tour step -> where it lives in the navigator
const STEPS = {
  today: ['TodayTab', { screen: 'Today' }],
  explore: ['ExploreTab', { screen: 'Explore' }],
  rate: ['ReviewTab', { screen: 'PickDish' }],
  decider: ['TodayTab', { screen: 'Decider', initial: false }],
  friends: ['MeTab', { screen: 'Friends', initial: false }],
  deals: ['TodayTab', { screen: 'Deals', initial: false }],
  wrapped: ['Wrapped'],
};

export function reportScreen(name) {
  if (embedded && name) window.parent.postMessage({ source: 'apero', screen: name }, '*');
}

export function listenForSteps(navigationRef) {
  if (!embedded) return () => {};
  const onMessage = (event) => {
    const step = STEPS[event.data?.source === 'apero-site' && event.data.go];
    if (!step || !navigationRef.isReady() || !navigationRef.getRootState()?.routeNames?.includes('Main')) return;
    // Wrapped covers the tabs, so close it before going anywhere else
    if (navigationRef.getCurrentRoute()?.name === 'Wrapped' && step[0] !== 'Wrapped') navigationRef.goBack();
    navigationRef.navigate(...step);
  };
  window.addEventListener('message', onMessage);
  return () => window.removeEventListener('message', onMessage);
}
