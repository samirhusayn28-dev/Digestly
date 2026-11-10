import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import {
  checkForAppUpdate,
  shouldShowUpdatePrompt,
  dismissUpdate,
  downloadAndInstallUpdate,
  AppUpdateInfo,
} from '../../services/updateService';
import { CURRENT_APP_VERSION } from '../../config/version';

interface Props {
  forceVisible?: boolean;
  onClose?: () => void;
}

export const UpdateModal: React.FC<Props> = ({ forceVisible, onClose }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Check for updates shortly after app opens (2.5s delay for smooth startup)
    const timer = setTimeout(async () => {
      try {
        const info = await checkForAppUpdate();
        if (!isMounted) return;

        setUpdateInfo(info);
        if (forceVisible) {
          setModalVisible(true);
        } else {
          const shouldShow = await shouldShowUpdatePrompt(info);
          if (shouldShow && isMounted) {
            setModalVisible(true);
          }
        }
      } catch (e) {
        console.warn('Update check error in UpdateModal:', e);
      }
    }, 2500);

    // Listen for notification taps
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data && data.type === 'app_update' && typeof data.url === 'string') {
        downloadAndInstallUpdate(data.url);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timer);
      subscription.remove();
    };
  }, [forceVisible]);

  const handleUpdateNow = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsDownloading(true);
    try {
      await downloadAndInstallUpdate(updateInfo?.downloadUrl);
    } finally {
      setIsDownloading(false);
      setModalVisible(false);
      onClose?.();
    }
  };

  const handleLater = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (updateInfo?.latestVersion) {
      await dismissUpdate(updateInfo.latestVersion);
    }
    setModalVisible(false);
    onClose?.();
  };

  if (!modalVisible || !updateInfo) {
    return null;
  }

  return (
    <Modal
      animationType="fade"
      transparent
      visible={modalVisible}
      onRequestClose={handleLater}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header Graphic */}
          <View style={styles.headerGraphic}>
            <View style={styles.iconCircle}>
              <Ionicons name="sparkles" size={26} color="#38BDF8" />
            </View>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>NEW UPDATE</Text>
            </View>
          </View>

          {/* Title & Version info */}
          <Text style={styles.title}>Digestly Upgrade Ready</Text>
          <View style={styles.versionRow}>
            <View style={styles.versionChip}>
              <Text style={styles.versionCurrent}>Current: v{updateInfo.currentVersion}</Text>
            </View>
            <Ionicons name="arrow-forward" size={14} color="#64748B" style={{ marginHorizontal: 6 }} />
            <View style={[styles.versionChip, styles.versionChipNew]}>
              <Text style={styles.versionNew}>New: v{updateInfo.latestVersion}</Text>
            </View>
          </View>

          {/* Release Notes */}
          <View style={styles.notesContainer}>
            <Text style={styles.notesHeading}>What's New:</Text>
            <ScrollView style={styles.notesScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.notesText}>
                {updateInfo.releaseNotes ||
                  '• Real-Time Hybrid News Feed (In-App RSS)\n• 24/7 Automated News Synthesis\n• Instant Pull-to-Refresh with live wire stories\n• Verified 17 news publishers with photo coverage'}
              </Text>
            </ScrollView>
          </View>

          {/* Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleUpdateNow}
              disabled={isDownloading}
              style={styles.updateBtn}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color="#07090E" />
              ) : (
                <>
                  <Ionicons name="cloud-download-outline" size={18} color="#07090E" style={{ marginRight: 8 }} />
                  <Text style={styles.updateBtnText}>Update Now (Download APK)</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleLater}
              style={styles.laterBtn}
            >
              <Text style={styles.laterBtnText}>Remind Me Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 11, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0E1422',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20,
  },
  headerGraphic: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    gap: 8,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  badgePill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  versionChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#1E293B',
  },
  versionChipNew: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    borderWidth: 1,
  },
  versionCurrent: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  versionNew: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '700',
  },
  notesContainer: {
    width: '100%',
    backgroundColor: '#07090E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E2638',
    padding: 12,
    marginBottom: 18,
  },
  notesHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  notesScroll: {
    maxHeight: 110,
  },
  notesText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#CBD5E1',
  },
  buttonGroup: {
    width: '100%',
    gap: 8,
  },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38BDF8',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  updateBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#07090E',
    letterSpacing: -0.2,
  },
  laterBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  laterBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
});
