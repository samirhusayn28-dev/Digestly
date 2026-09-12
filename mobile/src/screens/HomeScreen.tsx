import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { DocumentSnapshot } from 'firebase/firestore';
import { MainTabParamList, RootStackParamList, Article } from '../navigation/types';
import { useTheme } from '../theme';
import { useAppStore } from '../store/useAppStore';
import {
  fetchArticlesFromFirestore,
  seedFirestoreArticlesIfEmpty,
} from '../services/articles';
import { ArticleCard } from '../components/feed/ArticleCard';
import { ArticleCardSkeleton } from '../components/common/SkeletonLoader';
import { CustomRefreshHeader } from '../components/feed/CustomRefreshHeader';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Feed'>,
  NativeStackScreenProps<RootStackParamList>
>;

const FEED_FILTERS = ['For You', 'Politics', 'Business', 'Tech', 'Sports', 'World', 'Entertainment'];

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const { colors, typography } = useTheme();
  const selectedInterests = useAppStore((state) => state.selectedInterests);

  const flatListRef = useRef<FlatList>(null);
  const [activeFilter, setActiveFilter] = useState('For You');
  const [articles, setArticles] = useState<Article[]>([]);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const isTablet = width >= 768;

  // Load articles
  const loadArticles = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoadingInitial(true);
        }
        setError(null);

        // Ensure database has seed articles
        await seedFirestoreArticlesIfEmpty();

        const categoryParam = activeFilter === 'For You' ? 'All' : activeFilter;
        const result = await fetchArticlesFromFirestore({
          category: categoryParam,
          pageSize: 6,
          userInterests: selectedInterests,
        });

        setArticles(result.articles);
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
      } catch (err: any) {
        console.error('Failed to load articles:', err);
        setError('Unable to load latest dispatches. Please check connection.');
      } finally {
        setLoadingInitial(false);
        setRefreshing(false);
      }
    },
    [activeFilter, selectedInterests]
  );

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadArticles(true);
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || !lastDoc) return;

    try {
      setLoadingMore(true);
      const categoryParam = activeFilter === 'For You' ? 'All' : activeFilter;
      const result = await fetchArticlesFromFirestore({
        category: categoryParam,
        pageSize: 4,
        lastDoc,
        userInterests: selectedInterests,
      });

      if (result.articles.length > 0) {
        setArticles((prev) => [...prev, ...result.articles]);
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.warn('Error loading more articles:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleFilterSelect = (filter: string) => {
    Haptics.selectionAsync();
    setActiveFilter(filter);
  };

  const handleScrollToTop = () => {
    Haptics.selectionAsync();
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    if (scrollY > 350 && !showScrollTop) {
      setShowScrollTop(true);
    } else if (scrollY <= 350 && showScrollTop) {
      setShowScrollTop(false);
    }
  };

  const currentDate = new Date().toLocaleDateString('en-PK', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const breakingArticle = articles.find((a) => a.isBreaking);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBarStyle} />

      {/* Editorial Header */}
      <View style={[styles.topBar, { borderBottomColor: colors.borderLight }]}>
        <View>
          <Text style={[typography.caption, { color: colors.textTertiary, textTransform: 'uppercase' }]}>
            {currentDate} • Pakistan Radar
          </Text>
          <View style={styles.brandRow}>
            <Text style={[typography.h1, { color: colors.textPrimary, letterSpacing: -0.5 }]}>
              Digestly
            </Text>
            <View style={[styles.urduPill, { backgroundColor: colors.accentSubtle }]}>
              <Text style={[styles.urduPillText, { color: colors.accent }]}>مختصر</Text>
            </View>
          </View>
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity
            onPress={handleRefresh}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.actionIconBtn, { backgroundColor: colors.surfaceSubtle }]}
          >
            <Ionicons name="sync-outline" size={19} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Discover')}
            style={[styles.actionIconBtn, { backgroundColor: colors.surfaceSubtle, marginLeft: 8 }]}
          >
            <Ionicons name="search-outline" size={19} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Breaking News Ticker if active */}
      {breakingArticle && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('ArticleDetail', { article: breakingArticle })}
          style={[styles.breakingTicker, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
        >
          <View style={styles.tickerBadge}>
            <Ionicons name="flame" size={13} color="#DC2626" />
            <Text style={[typography.badge, { color: '#DC2626', marginLeft: 3, fontSize: 10 }]}>
              BREAKING
            </Text>
          </View>
          <Text numberOfLines={1} style={[typography.bodySmall, { color: '#991B1B', flex: 1, fontWeight: '600' }]}>
            {breakingArticle.title}
          </Text>
          <Ionicons name="chevron-forward" size={14} color="#DC2626" />
        </TouchableOpacity>
      )}

      {/* Filter Chips Bar */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FEED_FILTERS.map((f) => {
            const isSelected = activeFilter === f;
            return (
              <TouchableOpacity
                key={f}
                onPress={() => handleFilterSelect(f)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? colors.accent : colors.surface,
                    borderColor: isSelected ? colors.accent : colors.border,
                  },
                ]}
              >
                {f === 'For You' && (
                  <Ionicons
                    name="sparkles"
                    size={12}
                    color={isSelected ? '#FFFFFF' : colors.accent}
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text
                  style={[
                    typography.badge,
                    {
                      color: isSelected ? '#FFFFFF' : colors.textSecondary,
                      fontSize: 11,
                    },
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Custom Animated Refresh Banner */}
      <CustomRefreshHeader isRefreshing={refreshing} />

      {/* Feed Content */}
      {loadingInitial ? (
        <View style={[styles.skeletonContainer, { maxWidth: isTablet ? 720 : '100%', alignSelf: 'center', width: '100%' }]}>
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
        </View>
      ) : error ? (
        <View style={styles.errorState}>
          <View style={[styles.errorCircle, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="cloud-offline-outline" size={40} color="#DC2626" />
          </View>
          <Text style={[typography.h2, styles.errorTitle, { color: colors.textPrimary }]}>
            Connection Interrupted
          </Text>
          <Text style={[typography.body, styles.errorDesc, { color: colors.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => loadArticles(false)}
            style={[styles.retryBtn, { backgroundColor: colors.accent }]}
          >
            <Ionicons name="refresh" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={[typography.button, { color: '#FFFFFF' }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : articles.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyCircle, { backgroundColor: colors.surfaceSubtle }]}>
            <Ionicons name="newspaper-outline" size={40} color={colors.textTertiary} />
          </View>
          <Text style={[typography.h2, styles.emptyTitle, { color: colors.textPrimary }]}>
            No stories in {activeFilter}
          </Text>
          <Text style={[typography.body, styles.emptyDesc, { color: colors.textSecondary }]}>
            Check back shortly when the 30-minute Groq scraper runs, or explore other categories.
          </Text>
          <TouchableOpacity
            onPress={() => setActiveFilter('For You')}
            style={[styles.resetFilterBtn, { backgroundColor: colors.accentSubtle }]}
          >
            <Text style={[typography.button, { color: colors.accent }]}>Back to "For You"</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={articles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { maxWidth: isTablet ? 740 : '100%', alignSelf: 'center', width: '100%' },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ArticleCardSkeleton />
              </View>
            ) : (
              <View style={styles.endOfFeed}>
                <Text style={[typography.caption, { color: colors.textTertiary }]}>
                  You're up to date • Scanned from Dawn, Tribune & Geo
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <ArticleCard
              article={item}
              onPress={() => navigation.navigate('ArticleDetail', { article: item })}
            />
          )}
        />
      )}

      {/* Floating Scroll to Top Button */}
      {showScrollTop && (
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleScrollToTop}
          style={[styles.scrollTopBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="arrow-up" size={18} color={colors.accent} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  urduPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  urduPillText: {
    fontSize: 14,
    fontWeight: '700',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakingTicker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  tickerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  filterSection: {
    paddingVertical: 10,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  skeletonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 32,
  },
  footerLoader: {
    marginTop: 8,
  },
  endOfFeed: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  errorCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  errorTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  errorDesc: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  emptyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDesc: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  resetFilterBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  scrollTopBtn: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
});
