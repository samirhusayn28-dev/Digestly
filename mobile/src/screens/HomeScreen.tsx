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
import { DigestlyWordmark } from '../components/common/DigestlyWordmark';
import { FeedSkeleton, ArticleCardSkeleton } from '../components/common/SkeletonLoader';
import { CustomRefreshHeader } from '../components/feed/CustomRefreshHeader';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Feed'>,
  NativeStackScreenProps<RootStackParamList>
>;

const FEED_CATEGORIES = [
  'All',
  'Politics',
  'Business & Economy',
  'Technology & AI',
  'Sports',
  'World',
  'Health',
  'Entertainment',
  'Education',
  'Environment & Climate',
  'Science',
];

interface SourceFilterItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const SOURCE_FILTERS: SourceFilterItem[] = [
  { id: 'all', label: 'All Sources', icon: 'globe-outline' },
  { id: 'Dawn', label: 'Dawn', icon: 'newspaper-outline' },
  { id: 'Tribune', label: 'Tribune', icon: 'newspaper-outline' },
  { id: 'Geo News', label: 'Geo News', icon: 'tv-outline' },
  { id: 'BBC World', label: 'BBC World', icon: 'radio-outline' },
  { id: 'Al Jazeera', label: 'Al Jazeera', icon: 'earth-outline' },
];

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors, typography, isDark } = useTheme();

  const selectedInterests = useAppStore((state) => state.selectedInterests);
  const newsLanguage = useAppStore((state) => state.newsLanguage);
  const setNewsLanguage = useAppStore((state) => state.setNewsLanguage);

  const flatListRef = useRef<FlatList>(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [newsSubFilter, setNewsSubFilter] = useState<'all' | 'breaking' | 'analysis'>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [articles, setArticles] = useState<Article[]>([]);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

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

        await seedFirestoreArticlesIfEmpty();

        const categoryParam = activeFilter === 'All' ? 'All' : activeFilter;
        const res = await fetchArticlesFromFirestore({
          category: categoryParam,
          pageSize: 12,
          userInterests: selectedInterests,
        });

        setArticles(res.articles);
        setLastDoc(res.lastDoc);
        setHasMore(res.hasMore);
      } catch (err: any) {
        console.warn('Error loading feed articles:', err);
        setError('Could not connect to news feed.');
      } finally {
        setLoadingInitial(false);
        setRefreshing(false);
      }
    },
    [activeFilter, selectedInterests]
  );

  useEffect(() => {
    loadArticles(false);
  }, [loadArticles]);

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loadArticles(true);
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || !lastDoc) return;
    try {
      setLoadingMore(true);
      const res = await fetchArticlesFromFirestore({
        category: activeFilter === 'All' ? 'All' : activeFilter,
        pageSize: 6,
        lastDoc,
        userInterests: selectedInterests,
      });

      setArticles((prev) => [...prev, ...res.articles]);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch {
      // Ignore load more error
    } finally {
      setLoadingMore(false);
    }
  };

  const handleFilterSelect = (filter: string) => {
    Haptics.selectionAsync();
    setActiveFilter(filter);
  };

  const handleToggleLanguage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNewsLanguage(isUrdu ? 'en' : 'ur');
  };

  const handleScrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    setShowScrollTop(offsetY > 400);
  };

  const now = new Date();
  const dateFormatted = now
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    .toUpperCase();

  const sourceFilteredArticles = React.useMemo(() => {
    if (selectedSource === 'all') return articles;
    return articles.filter((a) => {
      const src = a.sourceName.toLowerCase();
      if (selectedSource === 'Dawn') return src.includes('dawn');
      if (selectedSource === 'Tribune') return src.includes('tribune');
      if (selectedSource === 'Geo News') return src.includes('geo');
      if (selectedSource === 'BBC World') return src.includes('bbc');
      if (selectedSource === 'Al Jazeera') return src.includes('jazeera');
      return src.includes(selectedSource.toLowerCase());
    });
  }, [articles, selectedSource]);

  const heroArticle = sourceFilteredArticles.length > 0 ? sourceFilteredArticles[0] : null;
  const highlightArticles = sourceFilteredArticles.slice(1, 4);
  const remainingArticles = sourceFilteredArticles.slice(4);

  const filteredNewsArticles = remainingArticles.filter((art) => {
    if (newsSubFilter === 'breaking') return art.isBreaking;
    if (newsSubFilter === 'analysis') return (art.summary?.length || 0) >= 3;
    return true;
  });

  const multiSourceStory =
    sourceFilteredArticles.find((a) => a.relatedSources && a.relatedSources.length > 0) ||
    heroArticle;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

      {/* Editorial Header matching Feed.png */}
      <View style={[styles.topBar, { borderBottomColor: colors.borderLight }]}>
        <View style={styles.headerLeft}>
          <View style={styles.dateRow}>
            <Text style={styles.dateText}>{dateFormatted}</Text>
            <View style={styles.radarBadge}>
              <Text style={styles.radarBadgeText}>RADAR</Text>
            </View>
          </View>

          <View style={styles.brandRow}>
            <DigestlyWordmark size="lg" />
          </View>
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Discover')}
            style={styles.actionIconBtn}
          >
            <Ionicons name="search-outline" size={18} color="#94A3B8" />
          </TouchableOpacity>



          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleToggleLanguage}
            style={styles.langBadgePill}
          >
            <Text style={styles.langBadgeText}>{isUrdu ? 'اردو' : 'EN'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Pills Row */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FEED_CATEGORIES.map((cat) => {
            const isSelected = activeFilter === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => handleFilterSelect(cat)}
                style={[
                  styles.filterChip,
                  isSelected ? [styles.filterChipActive, { backgroundColor: colors.accent, borderColor: colors.accent }] : [styles.filterChipInactive, { backgroundColor: colors.surface, borderColor: colors.border }],
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected ? [styles.filterChipTextActive, { color: isDark ? '#07090E' : '#FFFFFF' }] : [styles.filterChipTextInactive, { color: colors.textSecondary }],
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Source Filter Control Row */}
      <View style={[styles.sourceFilterSection, { borderBottomColor: colors.borderLight }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sourceFilterScroll}
        >
          {SOURCE_FILTERS.map((src) => {
            const isSelected = selectedSource === src.id;
            return (
              <TouchableOpacity
                key={src.id}
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedSource(src.id);
                }}
                style={[
                  styles.sourceChip,
                  isSelected ? [styles.sourceChipActive, { backgroundColor: colors.accent, borderColor: colors.accent }] : [styles.sourceChipInactive, { backgroundColor: colors.surface, borderColor: colors.border }],
                ]}
              >
                <Ionicons
                  name={src.icon}
                  size={12}
                  color={isSelected ? '#07090E' : '#94A3B8'}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.sourceChipText,
                    isSelected ? [styles.sourceChipTextActive, { color: isDark ? '#07090E' : '#FFFFFF' }] : [styles.sourceChipTextInactive, { color: colors.textSecondary }],
                  ]}
                >
                  {src.label}
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
        <FeedSkeleton />
      ) : error ? (
        <View style={styles.errorState}>
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
      ) : sourceFilteredArticles.length === 0 ? (
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
          data={filteredNewsArticles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            {
              maxWidth: isTablet ? 740 : '100%',
              alignSelf: 'center',
              width: '100%',
              paddingBottom: insets.bottom + 90,
            },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            <View>
              {/* Large Hero Card */}
              {heroArticle && (
                <View style={styles.heroWrap}>
                  <BentoCard
                    article={heroArticle}
                    variant="hero"
                    onPress={() => navigation.navigate('ArticleDetail', { article: heroArticle })}
                  />
                </View>
              )}

              {/* Today's Highlights 3-Column Section */}
              {highlightArticles.length > 0 && (
                <View style={styles.highlightsSection}>
                  <Text style={styles.highlightsHeaderTitle}>Today's Highlights</Text>
                  <View style={styles.highlightsRow}>
                    {highlightArticles.map((art) => (
                      <TouchableOpacity
                        key={art.id}
                        activeOpacity={0.88}
                        onPress={() => navigation.navigate('ArticleDetail', { article: art })}
                        style={styles.highlightColCard}
                      >
                        <View style={styles.highlightBadge}>
                          <Text style={styles.highlightBadgeText} numberOfLines={1}>
                            {art.category}
                          </Text>
                        </View>
                        <Text style={styles.highlightTitleText} numberOfLines={3}>
                          {art.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Latest News Section Header & Sub-filter tabs */}
              <View style={styles.latestNewsHeaderRow}>
                <Text style={styles.latestNewsTitle}>Latest News</Text>
                <View style={styles.subFilterGroup}>
                  {(['all', 'breaking', 'analysis'] as const).map((sub) => (
                    <TouchableOpacity
                      key={sub}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setNewsSubFilter(sub);
                      }}
                      style={[
                        styles.subFilterPill,
                        newsSubFilter === sub && styles.subFilterPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.subFilterText,
                          newsSubFilter === sub && styles.subFilterTextActive,
                        ]}
                      >
                        {sub === 'all' ? 'All Stories' : sub === 'breaking' ? 'Breaking' : 'Analysis'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          }
          ListFooterComponent={
            <View style={styles.footerWrap}>
              {/* Comparison CTA Banner */}
              {multiSourceStory && (
                <View style={styles.comparisonCtaCard}>
                  <View style={styles.ctaBadge}>
                    <Ionicons name="git-compare-outline" size={13} color="#38BDF8" style={{ marginRight: 5 }} />
                    <Text style={styles.ctaBadgeText}>MULTI-SOURCE RADAR</Text>
                  </View>
                  <Text style={styles.ctaTitle}>Get a wider perspective</Text>
                  <Text style={styles.ctaSub}>
                    Compare how Dawn, Tribune, and Geo report this breaking national story.
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() => navigation.navigate('ArticleDetail', { article: multiSourceStory })}
                    style={styles.ctaBtn}
                  >
                    <Text style={styles.ctaBtnText}>Explore Comparison</Text>
                    <Ionicons name="arrow-forward" size={15} color="#07090E" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
              )}

              {loadingMore ? (
                <View style={styles.footerLoader}>
                  <ArticleCardSkeleton />
                </View>
              ) : (
                <View style={styles.endOfFeed}>
                  <Text style={styles.endOfFeedText}>
                    You're up to date • Scanned across Pakistan & Global wires
                  </Text>
                </View>
              )}
            </View>
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
          style={[styles.scrollTopBtn, { bottom: insets.bottom + 65 }]}
        >
          <Ionicons name="arrow-up" size={17} color="#F8FAFC" />
        </TouchableOpacity>
      )}


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2638',
  },
  headerLeft: {
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1.2,
  },
  radarBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  radarBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  brandTitleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.4,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111622',
    borderWidth: 1,
    borderColor: '#1E2638',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langBadgePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: '#111622',
    borderWidth: 1,
    borderColor: '#1E2638',
  },
  langBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  sourceFilterSection: {
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2638',
  },
  sourceFilterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  sourceChipActive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F8FAFC',
  },
  sourceChipInactive: {
    backgroundColor: '#111622',
    borderColor: '#1E2638',
  },
  sourceChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sourceChipTextActive: {
    color: '#07090E',
    fontWeight: '700',
  },
  sourceChipTextInactive: {
    color: '#94A3B8',
  },
  filterSection: {
    paddingVertical: 10,
  },
  filterScroll: {
    paddingHorizontal: 18,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipActive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F8FAFC',
  },
  filterChipInactive: {
    backgroundColor: '#111622',
    borderColor: '#1E2638',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#07090E',
    fontWeight: '700',
  },
  filterChipTextInactive: {
    color: '#94A3B8',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  heroWrap: {
    marginBottom: 16,
  },
  highlightsSection: {
    marginBottom: 20,
  },
  highlightsHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  highlightsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  highlightColCard: {
    flex: 1,
    backgroundColor: '#111622',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E2638',
    padding: 10,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  highlightBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 5,
    marginBottom: 8,
  },
  highlightBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#38BDF8',
  },
  highlightTitleText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#F8FAFC',
    lineHeight: 16,
  },
  latestNewsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 4,
  },
  latestNewsTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  subFilterGroup: {
    flexDirection: 'row',
    backgroundColor: '#111622',
    borderRadius: 16,
    padding: 2,
    borderWidth: 1,
    borderColor: '#1E2638',
  },
  subFilterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  subFilterPillActive: {
    backgroundColor: '#1E2638',
  },
  subFilterText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  subFilterTextActive: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  footerWrap: {
    paddingTop: 10,
  },
  comparisonCtaCard: {
    backgroundColor: '#111622',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2A364F',
    padding: 16,
    marginBottom: 16,
  },
  ctaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ctaBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.8,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  ctaSub: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
    marginBottom: 12,
  },
  ctaBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  ctaBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#07090E',
  },
  footerLoader: {
    marginTop: 6,
  },
  endOfFeed: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  endOfFeedText: {
    fontSize: 11.5,
    color: '#64748B',
    letterSpacing: 0.2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#07090E',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollTopBtn: {
    position: 'absolute',
    right: 18,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#111622',
    borderWidth: 1,
    borderColor: '#2A364F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
});
