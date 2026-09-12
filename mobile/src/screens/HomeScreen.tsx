import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { BentoCard } from '../components/feed/BentoCard';
import { DigestlyLogo } from '../components/common/DigestlyLogo';
import { ReturningUserLoader } from '../components/common/ReturningUserLoader';
import { ArticleCardSkeleton } from '../components/common/SkeletonLoader';
import { CustomRefreshHeader } from '../components/feed/CustomRefreshHeader';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Feed'>,
  NativeStackScreenProps<RootStackParamList>
>;

const FEED_CATEGORIES = [
  'For You',
  'Top Stories',
  'Politics',
  'Business',
  'Finance',
  'Tech',
  'AI',
  'Science',
  'Health',
  'Sports',
  'World',
  'Entertainment',
  'Culture',
  'Lifestyle',
  'Education',
  'Environment',
  'Travel',
  'Food',
  'Automotive',
];

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors, typography, isDark } = useTheme();

  const selectedInterests = useAppStore((state) => state.selectedInterests);
  const newsLanguage = useAppStore((state) => state.newsLanguage);
  const setNewsLanguage = useAppStore((state) => state.setNewsLanguage);

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
  const [showLoader, setShowLoader] = useState(true);

  const isTablet = width >= 768;
  const isUrdu = newsLanguage === 'ur';

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
          pageSize: 8,
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

  const handleToggleLanguage = () => {
    Haptics.selectionAsync();
    setNewsLanguage(newsLanguage === 'en' ? 'ur' : 'en');
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

  // Bento layout separation for For You / Top Stories
  const showBento =
    (activeFilter === 'For You' || activeFilter === 'Top Stories') &&
    articles.length >= 3;

  const heroArticle = showBento ? articles[0] : null;
  const secondaryArticles = showBento ? [articles[1], articles[2]] : [];
  const feedArticles = showBento ? articles.slice(3) : articles;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colors.statusBarStyle} />

      {/* Editorial Header */}
      <View style={[styles.topBar, { borderBottomColor: colors.borderLight }]}>
        <View style={styles.headerLeft}>
          <Text style={[typography.caption, { color: colors.textTertiary, textTransform: 'uppercase', fontSize: 10.5 }]}>
            {currentDate} • Pakistan Radar
          </Text>
          <View style={styles.brandRow}>
            <DigestlyLogo size="sm" />
            <Text style={[typography.h1, { color: colors.textPrimary, letterSpacing: -0.5, marginLeft: 8 }]}>
              Digestly
            </Text>

            {/* Quick Language Toggle Pill */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleToggleLanguage}
              style={[
                styles.languagePill,
                {
                  backgroundColor: isUrdu ? colors.accent : colors.surfaceSubtle,
                  borderColor: isUrdu ? colors.accent : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  typography.badge,
                  {
                    color: isUrdu ? (isDark ? '#000000' : '#FFFFFF') : colors.textPrimary,
                    fontSize: 10.5,
                  },
                ]}
              >
                {isUrdu ? 'اردو' : 'EN'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity
            onPress={handleRefresh}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.actionIconBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderLight }]}
          >
            <Ionicons name="sync-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Discover')}
            style={[
              styles.actionIconBtn,
              { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderLight, marginLeft: 8 },
            ]}
          >
            <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Breaking News Ticker */}
      {breakingArticle && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('ArticleDetail', { article: breakingArticle })}
          style={[styles.breakingTicker, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
        >
          <View style={styles.tickerBadge}>
            <Ionicons name="flash" size={12} color="#DC2626" />
            <Text style={[typography.badge, { color: '#DC2626', marginLeft: 3, fontSize: 9.5 }]}>
              BREAKING
            </Text>
          </View>
          <Text
            numberOfLines={1}
            style={[typography.bodySmall, { color: '#991B1B', flex: 1, fontWeight: '600' }]}
          >
            {breakingArticle.title}
          </Text>
          <Ionicons name="chevron-forward" size={13} color="#DC2626" />
        </TouchableOpacity>
      )}

      {/* 18-Category Horizontal Filter Bar */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FEED_CATEGORIES.map((f) => {
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
                    size={11}
                    color={isSelected ? (isDark ? '#000000' : '#FFFFFF') : colors.accent}
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text
                  style={[
                    typography.badge,
                    {
                      color: isSelected ? (isDark ? '#000000' : '#FFFFFF') : colors.textSecondary,
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
            <Ionicons name="cloud-offline-outline" size={36} color="#DC2626" />
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
            <Ionicons
              name="refresh"
              size={15}
              color={isDark ? '#000000' : '#FFFFFF'}
              style={{ marginRight: 6 }}
            />
            <Text style={[typography.button, { color: isDark ? '#000000' : '#FFFFFF' }]}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      ) : articles.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyCircle, { backgroundColor: colors.surfaceSubtle }]}>
            <Ionicons name="newspaper-outline" size={36} color={colors.textTertiary} />
          </View>
          <Text style={[typography.h2, styles.emptyTitle, { color: colors.textPrimary }]}>
            No stories in {activeFilter}
          </Text>
          <Text style={[typography.body, styles.emptyDesc, { color: colors.textSecondary }]}>
            Check back shortly or explore other categories.
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
          data={feedArticles}
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
          onScroll={onScroll}
          scrollEventThrottle={16}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            showBento && heroArticle ? (
              <View style={styles.bentoSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[typography.badge, { color: colors.textTertiary, textTransform: 'uppercase' }]}>
                    Radar Highlights
                  </Text>
                  <View style={[styles.sectionDivider, { backgroundColor: colors.borderLight }]} />
                </View>

                {/* Hero Bento Card */}
                <BentoCard
                  article={heroArticle}
                  variant="hero"
                  onPress={() => navigation.navigate('ArticleDetail', { article: heroArticle })}
                />

                {/* Secondary 2-Column Bento Cards */}
                <View style={[styles.secondaryBentoRow, { gap: 12 }]}>
                  {secondaryArticles.map((item) => (
                    <View key={item.id} style={{ flex: 1 }}>
                      <BentoCard
                        article={item}
                        variant="secondary"
                        onPress={() => navigation.navigate('ArticleDetail', { article: item })}
                      />
                    </View>
                  ))}
                </View>

                <View style={[styles.sectionHeaderRow, { marginTop: 14, marginBottom: 12 }]}>
                  <Text style={[typography.badge, { color: colors.textTertiary, textTransform: 'uppercase' }]}>
                    Latest Dispatches
                  </Text>
                  <View style={[styles.sectionDivider, { backgroundColor: colors.borderLight }]} />
                </View>
              </View>
            ) : null
          }
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
          style={[
            styles.scrollTopBtn,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              bottom: insets.bottom + 65,
            },
          ]}
        >
          <Ionicons name="arrow-up" size={17} color={colors.accent} />
        </TouchableOpacity>
      )}

      {/* Returning User Soft Sweep Loader */}
      {showLoader && (
        <ReturningUserLoader
          accentColorChoice="yellow"
          onFinish={() => setShowLoader(false)}
        />
      )}
    </View>
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
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  languagePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    marginLeft: 10,
    borderWidth: 1,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  breakingTicker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderBottomWidth: 1,
    gap: 8,
  },
  tickerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  filterSection: {
    paddingVertical: 9,
  },
  filterScroll: {
    paddingHorizontal: 18,
    gap: 7,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  bentoSection: {
    marginBottom: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
  },
  secondaryBentoRow: {
    flexDirection: 'row',
  },
  skeletonContainer: {
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 4,
  },
  footerLoader: {
    marginTop: 6,
  },
  endOfFeed: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  errorDesc: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
    marginBottom: 20,
  },
  resetFilterBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  scrollTopBtn: {
    position: 'absolute',
    right: 18,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
});
