import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList, RootStackParamList, Article } from '../navigation/types';
import { useTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { fetchBookmarkedArticles, syncBookmarkToFirestore } from '../services/bookmarks';
import { ArticleCard } from '../components/feed/ArticleCard';
import { ArticleCardSkeleton } from '../components/common/SkeletonLoader';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Bookmarks'>,
  NativeStackScreenProps<RootStackParamList>
>;

export const BookmarksScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors, typography, isDark } = useTheme();

  const bookmarkedIds = useAppStore((state) => state.bookmarkedIds);
  const toggleBookmark = useAppStore((state) => state.toggleBookmark);
  const user = useAppStore((state) => state.user);
  const isGuest = useAppStore((state) => state.isGuest);

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const isTablet = width >= 768;

  const loadSavedArticles = useCallback(async () => {
    setLoading(true);
    try {
      const fetched = await fetchBookmarkedArticles(bookmarkedIds);
      setArticles(fetched);
    } catch (e) {
      console.warn('Error loading bookmarked articles:', e);
    } finally {
      setLoading(false);
    }
  }, [bookmarkedIds]);

  useEffect(() => {
    loadSavedArticles();
  }, [loadSavedArticles]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colors.statusBarStyle} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <View>
          <Text style={[typography.caption, { color: colors.textTertiary, textTransform: 'uppercase', fontSize: 10.5 }]}>
            Personal Library
          </Text>
          <Text style={[typography.h1, { color: colors.textPrimary, letterSpacing: -0.4 }]}>
            Bookmarks
          </Text>
        </View>

        <View style={[styles.countPill, { backgroundColor: colors.accentSubtle }]}>
          <Text style={[styles.countText, { color: colors.textPrimary }]}>
            {bookmarkedIds.length} {bookmarkedIds.length === 1 ? 'saved' : 'saved'}
          </Text>
        </View>
      </View>

      {/* Guest Mode Cloud Sync Banner */}
      {(!user || isGuest) && bookmarkedIds.length > 0 && (
        <View style={[styles.guestBanner, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderLight }]}>
          <Ionicons name="cloud-upload-outline" size={18} color={colors.accent} style={{ marginRight: 8 }} />
          <Text style={[typography.bodySmall, { color: colors.textSecondary, flex: 1 }]}>
            Bookmarks saved locally on this device. Sign in anytime to sync across devices.
          </Text>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={[styles.skeletonContainer, { maxWidth: isTablet ? 740 : '100%', alignSelf: 'center', width: '100%' }]}>
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
        </View>
      ) : articles.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconCircle, { backgroundColor: colors.surfaceSubtle }]}>
            <Ionicons name="bookmark-outline" size={38} color={colors.textTertiary} />
          </View>
          <Text style={[typography.h2, styles.emptyTitle, { color: colors.textPrimary }]}>
            Your Library is Empty
          </Text>
          <Text style={[typography.body, styles.emptyDesc, { color: colors.textSecondary }]}>
            Tap the bookmark icon on any card in your feed to save essential stories for offline reading and research.
          </Text>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => navigation.navigate('Feed')}
            style={[styles.exploreBtn, { backgroundColor: colors.accent }]}
          >
            <Ionicons
              name="newspaper-outline"
              size={16}
              color={isDark ? '#000000' : '#FFFFFF'}
              style={{ marginRight: 8 }}
            />
            <Text style={[typography.button, { color: isDark ? '#000000' : '#FFFFFF' }]}>
              Explore Dispatches
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            {
              maxWidth: isTablet ? 740 : '100%',
              alignSelf: 'center',
              width: '100%',
              paddingBottom: insets.bottom + 85,
            },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <ArticleCard
                article={item}
                onPress={() => navigation.navigate('ArticleDetail', { article: item })}
              />
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 18,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  skeletonContainer: {
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDesc: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  cardWrapper: {
    marginBottom: 2,
  },
});
