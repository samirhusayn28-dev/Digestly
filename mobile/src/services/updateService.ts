import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Notifications from 'expo-notifications';
import {
  CURRENT_APP_VERSION,
  CURRENT_APP_VERSION_CODE,
  GITHUB_LATEST_RELEASE_API,
  GITHUB_RELEASES_PAGE,
  GITHUB_DIRECT_APK_URL,
} from '../config/version';

export interface AppUpdateInfo {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseTitle: string;
  releaseNotes: string;
  downloadUrl: string;
  releasePageUrl: string;
  publishedAt: string;
}

const STORAGE_DISMISSED_VERSION_KEY = '@digestly_dismissed_update_v1';
const STORAGE_LAST_CHECK_KEY = '@digestly_last_update_check_v1';

/**
 * Compare two semver strings (e.g., '1.6.1' vs '1.6.0')
 * Returns:
 *   1 if v1 > v2
 *  -1 if v1 < v2
 *   0 if equal
 */
export function compareVersions(v1: string, v2: string): number {
  const clean1 = v1.replace(/^[vV]/, '').trim();
  const clean2 = v2.replace(/^[vV]/, '').trim();

  const parts1 = clean1.split('.').map((p) => parseInt(p, 10) || 0);
  const parts2 = clean2.split('.').map((p) => parseInt(p, 10) || 0);

  const maxLen = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < maxLen; i++) {
    const p1 = parts1[i] ?? 0;
    const p2 = parts2[i] ?? 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

/**
 * Checks GitHub Releases API for a newer version of Digestly
 */
export async function checkForAppUpdate(): Promise<AppUpdateInfo> {
  const defaultResult: AppUpdateInfo = {
    updateAvailable: false,
    currentVersion: CURRENT_APP_VERSION,
    latestVersion: CURRENT_APP_VERSION,
    releaseTitle: 'Latest Version',
    releaseNotes: '',
    downloadUrl: GITHUB_DIRECT_APK_URL,
    releasePageUrl: GITHUB_RELEASES_PAGE,
    publishedAt: new Date().toISOString(),
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(GITHUB_LATEST_RELEASE_API, {
      signal: controller.signal,
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Digestly-App',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return defaultResult;
    }

    const data = await res.json();
    const tag = (data.tag_name || '').replace(/^[vV]/, '').trim();
    if (!tag) {
      return defaultResult;
    }

    const isNewer = compareVersions(tag, CURRENT_APP_VERSION) > 0;

    // Find direct APK asset if uploaded to release
    let apkDownloadUrl = GITHUB_DIRECT_APK_URL;
    if (Array.isArray(data.assets) && data.assets.length > 0) {
      const apkAsset = data.assets.find((a: any) =>
        (a.name || '').toLowerCase().endsWith('.apk')
      );
      if (apkAsset && apkAsset.browser_download_url) {
        apkDownloadUrl = apkAsset.browser_download_url;
      }
    }

    const updateInfo: AppUpdateInfo = {
      updateAvailable: isNewer,
      currentVersion: CURRENT_APP_VERSION,
      latestVersion: tag,
      releaseTitle: data.name || `Digestly v${tag}`,
      releaseNotes: cleanReleaseNotes(data.body || ''),
      downloadUrl: apkDownloadUrl,
      releasePageUrl: data.html_url || GITHUB_RELEASES_PAGE,
      publishedAt: data.published_at || new Date().toISOString(),
    };

    // If an update is available, trigger a local push notification if not dismissed
    if (isNewer) {
      const dismissed = await AsyncStorage.getItem(STORAGE_DISMISSED_VERSION_KEY);
      if (dismissed !== tag) {
        notifyUserOfUpdate(updateInfo);
      }
    }

    await AsyncStorage.setItem(STORAGE_LAST_CHECK_KEY, Date.now().toString());
    return updateInfo;
  } catch (err) {
    console.warn('Update check failed (network/offline):', err);
    return defaultResult;
  }
}

/**
 * Determines whether the update modal should appear automatically
 */
export async function shouldShowUpdatePrompt(info: AppUpdateInfo): Promise<boolean> {
  if (!info.updateAvailable) return false;

  try {
    const dismissed = await AsyncStorage.getItem(STORAGE_DISMISSED_VERSION_KEY);
    // If the user already dismissed this specific version, don't show the modal popup automatically
    if (dismissed === info.latestVersion) {
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

/**
 * Dismiss an update version for now
 */
export async function dismissUpdate(version: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_DISMISSED_VERSION_KEY, version);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Opens browser / downloader to install the APK update
 */
export async function downloadAndInstallUpdate(targetUrl?: string): Promise<void> {
  const url = targetUrl || GITHUB_DIRECT_APK_URL;
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      await WebBrowser.openBrowserAsync(url);
    }
  } catch (err) {
    console.warn('Could not launch direct download URL, opening release page:', err);
    try {
      await WebBrowser.openBrowserAsync(GITHUB_RELEASES_PAGE);
    } catch {
      // Ignore
    }
  }
}

/**
 * Fires a local notification when an update is available
 */
export async function notifyUserOfUpdate(info: AppUpdateInfo) {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🚀 Digestly Update v${info.latestVersion} Available`,
        body: `A new version with the latest news engine & improvements is ready. Tap to update!`,
        data: { type: 'app_update', url: info.downloadUrl },
      },
      trigger: null, // deliver immediately
    });
  } catch (e) {
    console.warn('Could not schedule local update notification:', e);
  }
}

/**
 * Clean markdown boilerplate from GitHub release descriptions
 */
function cleanReleaseNotes(body: string): string {
  if (!body) return 'Performance improvements, bug fixes, and latest news wire updates.';
  return body
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim()
    .slice(0, 400);
}
