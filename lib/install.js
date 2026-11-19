// "Add to Home Screen" on the website. Chrome/Edge/Android hand us an install prompt we can show from a
// button; iPhones don't, so there we explain the Share menu instead. Nothing shows once it's installed.
import { Platform } from 'react-native';

const web = Platform.OS === 'web' && typeof window !== 'undefined';
let prompt = null;
const listeners = new Set();

if (web) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    prompt = e;
    listeners.forEach((f) => f());
  });
  window.addEventListener('appinstalled', () => {
    prompt = null;
    listeners.forEach((f) => f());
  });
}

export const onInstallChange = (f) => {
  listeners.add(f);
  return () => listeners.delete(f);
};

export const installed = () =>
  web && (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);

export const isIPhone = () => web && /iPhone|iPad|iPod/.test(window.navigator.userAgent);

export const canPrompt = () => !!prompt;

export async function promptInstall() {
  if (!prompt) return false;
  prompt.prompt();
  const { outcome } = await prompt.userChoice;
  prompt = null;
  return outcome === 'accepted';
}
