import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StatusBar,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList, RootStackParamList, Article } from '../navigation/types';
import { fetchArticlesFromFirestore, REALISTIC_SEED_ARTICLES } from '../services/articles';
import { useTheme } from '../theme';
import { DiscoverSkeleton } from '../components/common/SkeletonLoader';
import { getArticleImageUri } from '../utils/imageHelper';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Discover'>,
  NativeStackScreenProps<RootStackParamList>
>;

const ALL_CATEGORIES = [
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

interface SourceOption {
  id: string;
  label: string;
}

const ALL_SOURCES: SourceOption[] = [
  { id: 'all', label: 'All Sources' },
  { id: 'Dawn', label: 'Dawn' },
  { id: 'Tribune', label: 'Express Tribune' },
  { id: 'Geo News', label: 'Geo News' },
  { id: 'The News', label: 'The News' },
  { id: 'Business Recorder', label: 'Business Recorder' },
  { id: 'ARY News', label: 'ARY News' },
  { id: 'Samaa TV', label: 'Samaa TV' },
  { id: 'Dunya News', label: 'Dunya News' },
  { id: '92 News', label: '92 News' },
  { id: 'Pakistan Today', label: 'Pakistan Today' },
  { id: 'Daily Times', label: 'Daily Times' },
  { id: 'The Nation', label: 'The Nation' },
  { id: 'BBC World', label: 'BBC World' },
  { id: 'Al Jazeera', label: 'Al Jazeera' },
  { id: 'Reuters', label: 'Reuters' },
  { id: 'Associated Press', label: 'Associated Press' },
  { id: 'CNN', label: 'CNN' },
];

const TRENDING_TOPICS = [
  { tag: '#StateBankRate', reads: '14.2k reads', category: 'Business & Economy' },
  { tag: '#ChampionsTrophy', reads: '28.5k reads', category: 'Sports' },
  { tag: '#TechExports', reads: '9.8k reads', category: 'Technology & AI' },
  { tag: '#ElectoralReform', reads: '11.4k reads', category: 'Politics' },
];

export const DiscoverScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const initialCat = route.params?.initialCategory || 'All';

  const { colors, isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState('all');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Advanced Filter Sheet State (Point 4)
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'multi' | 'breaking'>('latest');
  const [timeRange, setTimeRange] = useState<'all' | '24h' | '7d'>('all');

  const isTablet = width >= 768;

  useEffect(() => {
    async function loadCategoryArticles() {
      setLoading(true);
      try {
        const res = await fetchArticlesFromFirestore({
          category: selectedCategory === 'All' ? 'All' : selectedCategory,
          pageSize: 60,
        });
        setArticles(res.articles);
      } catch (err) {
        console.warn('Discover load error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCategoryArticles();
  }, [selectedCategory]);

  const handleCategoryPress = (cat: string) => {
    Haptics.selectionAsync();
    setSelectedCategory(cat);
  };

  const hasActiveFilters =
    selectedCategory !== 'All' ||
    selectedSource !== 'all' ||
    sortBy !== 'latest' ||
    timeRange !== 'all';

  const filteredArticles = React.useMemo(() => {
    let list = articles.filter((item) => {
      // 1. Category Filter
      if (selectedCategory !== 'All') {
        const itemCat = item.category.toLowerCase().replace(/&/g, 'and').trim();
        const selCat = selectedCategory.toLowerCase().replace(/&/g, 'and').trim();
        if (!itemCat.includes(selCat) && !selCat.includes(itemCat)) return false;
      }

      // 2. Source Filter
      if (selectedSource !== 'all') {
        const itemSrc = item.sourceName.toLowerCase();
        const targetSrc = selectedSource.toLowerCase();

        const normItem = itemSrc.replace(/^(the\s+)/, '').replace(/\s+(news|tv|hd|international|today|times)\b/g, '').trim();
        const normTarget = targetSrc.replace(/^(the\s+)/, '').replace(/\s+(news|tv|hd|international|today|times)\b/g, '').trim();

        const matches =
          itemSrc.includes(targetSrc) ||
          targetSrc.includes(itemSrc) ||
          normItem.includes(normTarget) ||
          normTarget.includes(normItem);

        if (!matches) return false;
      }

      // 3. Time range filter
      if (timeRange === '24h') {
        const pub = (item.publishedAt || '').toLowerCase();
        if (pub.includes('d ago') || pub.includes('w ago')) return false;
      } else if (timeRange === '7d') {
        const pub = (item.publishedAt || '').toLowerCase();
        if (pub.includes('w ago') || pub.includes('m ago')) return false;
      }

      // 4. Search query filter
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        const matchesQuery =
          item.title.toLowerCase().includes(query) ||
          item.sourceName.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          (item.summary && item.summary.some((s) => s.toLowerCase().includes(query))) ||
          (item.paragraphSummary && item.paragraphSummary.toLowerCase().includes(query));
        if (!matchesQuery) return false;
      }

      return true;
    });

    // 5. Fallback if specific source yielded 0 results from active batch
    if (list.length === 0 && selectedSource !== 'all') {
      const targetSrc = selectedSource.toLowerCase();
      const normTarget = targetSrc.replace(/^(the\s+)/, '').replace(/\s+(news|tv|hd|international|today|times)\b/g, '').trim();
      list = REALISTIC_SEED_ARTICLES.filter((item) => {
        const itemSrc = item.sourceName.toLowerCase();
        const normItem = itemSrc.replace(/^(the\s+)/, '').replace(/\s+(news|tv|hd|international|today|times)\b/g, '').trim();
        return (
          itemSrc.includes(targetSrc) ||
          targetSrc.includes(itemSrc) ||
          normItem.includes(normTarget) ||
          normTarget.includes(normItem)
        );
      });
    }

    // 6. Sorting
    if (sortBy === 'multi') {
      list = [...list].sort((a, b) => (b.relatedSources?.length || 0) - (a.relatedSources?.length || 0));
    } else if (sortBy === 'breaking') {
      list = [...list].sort((a, b) => (b.isBreaking ? 1 : 0) - (a.isBreaking ? 1 : 0));
    }

    return list;
  }, [articles, selectedCategory, selectedSource, timeRange, searchQuery, sortBy]);

  const highlightPair = filteredArticles.slice(0, 2);
  const restArticles = filteredArticles.slice(2);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header with globe accent */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.exploreSubtitle}>EXPLORE PERSPECTIVES</Text>
          <Text style={styles.title}>Discover</Text>
        </View>

        {/* Decorative crescent/globe icon top-right */}
        <View style={styles.globeGraphicWrap}>
          <Ionicons name="globe-outline" size={44} color="rgba(56, 189, 248, 0.15)" />
        </View>
      </View>

      {/* Search Input Bar with Filter Slider Button */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={17} color="#64748B" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search topics, sources, keywords..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsFilterModalVisible(true);
          }}
          style={[styles.sliderFilterBtn, hasActiveFilters && { backgroundColor: '#38BDF8' }]}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={hasActiveFilters ? '#07090E' : '#F8FAFC'}
          />
        </TouchableOpacity>
      </View>

      {/* Consolidated Active Filters Bar (Shown only when non-default filters are active) */}
      {hasActiveFilters && (
        <View style={styles.activeFiltersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeFiltersScroll}
          >
            {selectedCategory !== 'All' && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedCategory('All')}
                style={styles.activeFilterPill}
              >
                <Text style={styles.activeFilterPillText}>Topic: {selectedCategory}</Text>
                <Ionicons name="close" size={13} color="#38BDF8" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}

            {selectedSource !== 'all' && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedSource('all')}
                style={styles.activeFilterPill}
              >
                <Text style={styles.activeFilterPillText}>Source: {selectedSource}</Text>
                <Ionicons name="close" size={13} color="#38BDF8" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}

            {timeRange !== 'all' && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setTimeRange('all')}
                style={styles.activeFilterPill}
              >
                <Text style={styles.activeFilterPillText}>Time: {timeRange === '24h' ? 'Past 24h' : 'Past 7d'}</Text>
                <Ionicons name="close" size={13} color="#38BDF8" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}

            {sortBy !== 'latest' && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSortBy('latest')}
                style={styles.activeFilterPill}
              >
                <Text style={styles.activeFilterPillText}>Sort: {sortBy === 'multi' ? 'Multi-Source' : 'Breaking'}</Text>
                <Ionicons name="close" size={13} color="#38BDF8" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedCategory('All');
                setSelectedSource('all');
                setTimeRange('all');
                setSortBy('latest');
              }}
              style={styles.clearAllFiltersBtn}
            >
              <Text style={styles.clearAllFiltersText}>Reset All</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <DiscoverSkeleton />
      ) : filteredArticles.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={36} color="#64748B" />
          <Text style={styles.emptyTitle}>No results for "{searchQuery}"</Text>
          <Text style={styles.emptyDesc}>
            Try searching for "Economy", "Cricket", "Tech", or select another topic.
          </Text>
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={restArticles}
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
          ListHeaderComponent={
            <View>
              {/* Today's Highlights Split 2-Card Row */}
              {highlightPair.length > 0 && (
                <View style={styles.splitHighlightsSection}>
                  <Text style={styles.sectionTitle}>Today's Highlights</Text>
                  <View style={styles.splitRow}>
                    {highlightPair.map((art) => (
                      <TouchableOpacity
                        key={art.id}
                        activeOpacity={0.88}
                        onPress={() => navigation.navigate('ArticleDetail', { article: art })}
                        style={styles.splitCard}
                      >
                        <Image
                          source={{ uri: getArticleImageUri(art) }}
                          style={styles.splitCardImage}
                          contentFit="cover"
                          transition={200}
                        />
                        <View style={styles.splitCardContent}>
                          <View style={styles.splitBadge}>
                            <Text style={styles.splitBadgeText}>{art.category}</Text>
                          </View>
                          <Text style={styles.splitCardTitle} numberOfLines={2}>
                            {art.title}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Trending Topics with Read Counts */}
              <View style={styles.trendingSection}>
                <Text style={styles.sectionTitle}>Trending Topics</Text>
                <View style={styles.trendingList}>
                  {TRENDING_TOPICS.map((topic) => (
                    <TouchableOpacity
                      key={topic.tag}
                      onPress={() => setSelectedCategory(topic.category)}
                      style={styles.trendingRow}
                    >
                      <View style={styles.trendingTagLeft}>
                        <Ionicons name="trending-up" size={15} color="#38BDF8" style={{ marginRight: 8 }} />
                        <Text style={styles.trendingTagName}>{topic.tag}</Text>
                      </View>
                      <Text style={styles.trendingReads}>{topic.reads}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Latest From Across Pakistan Title */}
              <Text style={[styles.sectionTitle, { marginTop: 18, marginBottom: 12 }]}>
                Latest from across Pakistan
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('ArticleDetail', { article: item })}
              style={styles.listItemCard}
            >
              <View style={styles.listItemLeft}>
                <View style={styles.listItemMeta}>
                  <View style={styles.itemCategoryBadge}>
                    <Text style={styles.itemCategoryText}>{item.category}</Text>
                  </View>
                  <Text style={styles.itemSourceText}>{item.sourceName}</Text>
                  <Text style={styles.itemDot}>•</Text>
                  <Text style={styles.itemTimeText}>{item.publishedAt}</Text>
                </View>

                <Text style={styles.listItemTitle} numberOfLines={2}>
                  {item.title}
                </Text>
              </View>

              <Image
                source={{ uri: getArticleImageUri(item) }}
                style={styles.listItemThumbnail}
                contentFit="cover"
                transition={200}
              />
            </TouchableOpacity>
          )}
        />
      )}

      {/* Advanced Filter Bottom Sheet Modal (Point 4) */}
      <Modal
        visible={isFilterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsFilterModalVisible(false)}
          />

          <View style={[styles.modalSheet, { backgroundColor: isDark ? '#111622' : '#FFFFFF', borderColor: isDark ? '#1E2638' : '#E2E8F0' }]}>
            {/* Sheet Handle */}
            <View style={styles.modalHandle} />

            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.modalTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                  Filter & Sort
                </Text>
                <Text style={styles.modalSubtitle}>
                  Refine feed order, time window & multiple sources
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedCategory('All');
                  setSelectedSource('all');
                  setSortBy('latest');
                  setTimeRange('all');
                }}
              >
                <Text style={styles.modalResetText}>Reset All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
              {/* Section 1: Category / Topic */}
              <Text style={styles.modalSectionLabel}>CATEGORY / TOPIC</Text>
              <View style={styles.modalChipRow}>
                {ALL_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedCategory(cat);
                      }}
                      style={[
                        styles.modalOptionChip,
                        isSelected ? styles.modalOptionChipActive : styles.modalOptionChipInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.modalOptionChipText,
                          isSelected ? styles.modalOptionChipTextActive : styles.modalOptionChipTextInactive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Section 2: News Sources */}
              <Text style={styles.modalSectionLabel}>NEWS SOURCE</Text>
              <View style={styles.modalChipRow}>
                {ALL_SOURCES.map((src) => {
                  const isSelected = selectedSource === src.id;
                  return (
                    <TouchableOpacity
                      key={src.id}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedSource(src.id);
                      }}
                      style={[
                        styles.modalOptionChip,
                        isSelected ? styles.modalOptionChipActive : styles.modalOptionChipInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.modalOptionChipText,
                          isSelected ? styles.modalOptionChipTextActive : styles.modalOptionChipTextInactive,
                        ]}
                      >
                        {src.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Section 3: Sort By */}
              <Text style={styles.modalSectionLabel}>SORT ORDER</Text>
              <View style={styles.modalChipRow}>
                {[
                  { id: 'latest', label: 'Latest First', icon: 'time-outline' },
                  { id: 'multi', label: 'Multi-Source First', icon: 'git-network-outline' },
                  { id: 'breaking', label: 'Breaking News', icon: 'flash-outline' },
                ].map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSortBy(s.id as any);
                    }}
                    style={[
                      styles.modalOptionChip,
                      sortBy === s.id ? styles.modalOptionChipActive : styles.modalOptionChipInactive,
                    ]}
                  >
                    <Ionicons
                      name={s.icon as any}
                      size={14}
                      color={sortBy === s.id ? '#07090E' : '#94A3B8'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.modalOptionChipText,
                        sortBy === s.id ? styles.modalOptionChipTextActive : styles.modalOptionChipTextInactive,
                      ]}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Section 4: Time Range */}
              <Text style={styles.modalSectionLabel}>TIME RANGE</Text>
              <View style={styles.modalChipRow}>
                {[
                  { id: 'all', label: 'All Time' },
                  { id: '24h', label: 'Past 24 Hours' },
                  { id: '7d', label: 'Past 7 Days' },
                ].map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setTimeRange(t.id as any);
                    }}
                    style={[
                      styles.modalOptionChip,
                      timeRange === t.id ? styles.modalOptionChipActive : styles.modalOptionChipInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalOptionChipText,
                        timeRange === t.id ? styles.modalOptionChipTextActive : styles.modalOptionChipTextInactive,
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Apply Button */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setIsFilterModalVisible(false);
              }}
              style={styles.modalApplyBtn}
            >
              <Text style={styles.modalApplyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 4,
  },
  headerLeft: {
    flex: 1,
  },
  exploreSubtitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1.8,
    marginBottom: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.4,
  },
  globeGraphicWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#111622',
    borderWidth: 1,
    borderColor: '#1E2638',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 13.5,
    height: '100%',
  },
  sliderFilterBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#111622',
    borderWidth: 1,
    borderColor: '#1E2638',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFiltersContainer: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#151B27',
  },
  activeFiltersScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 16,
  },
  activeFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: '#38BDF8',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  activeFilterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38BDF8',
  },
  clearAllFiltersBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  clearAllFiltersText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  categoryGridSection: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  categoryIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryIconItem: {
    alignItems: 'center',
    width: '16%',
  },
  categoryCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
  },
  categoryCircleActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  categoryCircleInactive: {
    backgroundColor: '#111622',
    borderColor: '#1E2638',
  },
  categoryIconLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  categoryIconLabelActive: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  categoryIconLabelInactive: {
    color: '#94A3B8',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sourceFilterSection: {
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#151B27',
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
  splitHighlightsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  splitRow: {
    flexDirection: 'row',
    gap: 10,
  },
  splitCard: {
    flex: 1,
    height: 155,
    borderRadius: 16,
    backgroundColor: '#111622',
    borderWidth: 1,
    borderColor: '#1E2638',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  splitCardImage: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  },
  splitFallback: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#151C2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitCardContent: {
    padding: 10,
    backgroundColor: 'rgba(7, 9, 14, 0.85)',
  },
  splitBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  splitBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#38BDF8',
  },
  splitCardTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#F8FAFC',
    lineHeight: 15,
  },
  trendingSection: {
    marginBottom: 16,
  },
  trendingList: {
    backgroundColor: '#111622',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E2638',
    paddingVertical: 4,
  },
  trendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#182030',
  },
  trendingTagLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendingTagName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  trendingReads: {
    fontSize: 11.5,
    color: '#64748B',
  },
  listItemCard: {
    flexDirection: 'row',
    backgroundColor: '#111622',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E2638',
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  listItemLeft: {
    flex: 1,
    marginRight: 10,
  },
  listItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  itemCategoryBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemCategoryText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#38BDF8',
  },
  itemSourceText: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  itemDot: {
    fontSize: 10,
    color: '#64748B',
  },
  itemTimeText: {
    fontSize: 10.5,
    color: '#64748B',
  },
  listItemTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#F8FAFC',
    lineHeight: 18,
  },
  listItemThumbnail: {
    width: 68,
    height: 68,
    borderRadius: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  clearBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#07090E',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 34,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#64748B',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  modalResetText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
    marginTop: 2,
  },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 8,
  },
  modalChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalOptionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  modalOptionChipActive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F8FAFC',
  },
  modalOptionChipInactive: {
    backgroundColor: '#161E2E',
    borderColor: '#243048',
  },
  modalOptionChipText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  modalOptionChipTextActive: {
    color: '#07090E',
    fontWeight: '700',
  },
  modalOptionChipTextInactive: {
    color: '#94A3B8',
  },
  modalApplyBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  modalApplyBtnText: {
    color: '#07090E',
    fontSize: 15,
    fontWeight: '700',
  },
});
