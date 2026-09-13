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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList, RootStackParamList, Article } from '../navigation/types';
import { fetchArticlesFromFirestore } from '../services/articles';
import { DiscoverSkeleton } from '../components/common/SkeletonLoader';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Discover'>,
  NativeStackScreenProps<RootStackParamList>
>;

const CATEGORY_ICONS = [
  { id: 'All', label: 'All', icon: 'sparkles-outline' as const },
  { id: 'Politics', label: 'Politics', icon: 'megaphone-outline' as const },
  { id: 'Business & Economy', label: 'Business', icon: 'trending-up-outline' as const },
  { id: 'Technology & AI', label: 'Tech', icon: 'hardware-chip-outline' as const },
  { id: 'Sports', label: 'Sports', icon: 'football-outline' as const },
  { id: 'World', label: 'World', icon: 'globe-outline' as const },
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

  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const isTablet = width >= 768;

  useEffect(() => {
    async function loadCategoryArticles() {
      setLoading(true);
      try {
        const res = await fetchArticlesFromFirestore({
          category: selectedCategory === 'All' ? 'All' : selectedCategory,
          pageSize: 20,
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

  const filteredArticles = articles.filter((item) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      item.title.toLowerCase().includes(query) ||
      item.sourceName.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.summary.some((s) => s.toLowerCase().includes(query))
    );
  });

  const highlightPair = filteredArticles.slice(0, 2);
  const restArticles = filteredArticles.slice(2);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
          onPress={() => setSelectedCategory('All')}
          style={styles.sliderFilterBtn}
        >
          <Ionicons name="options-outline" size={20} color="#F8FAFC" />
        </TouchableOpacity>
      </View>

      {/* Category Icons Row (6 Circles with Icons) */}
      <View style={styles.categoryGridSection}>
        <View style={styles.categoryIconRow}>
          {CATEGORY_ICONS.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => handleCategoryPress(cat.id)}
                style={styles.categoryIconItem}
              >
                <View
                  style={[
                    styles.categoryCircle,
                    isSelected ? styles.categoryCircleActive : styles.categoryCircleInactive,
                  ]}
                >
                  <Ionicons
                    name={cat.icon}
                    size={20}
                    color={isSelected ? '#07090E' : '#94A3B8'}
                  />
                </View>
                <Text
                  style={[
                    styles.categoryIconLabel,
                    isSelected ? styles.categoryIconLabelActive : styles.categoryIconLabelInactive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

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
                        {art.imageUrl ? (
                          <Image
                            source={{ uri: art.imageUrl }}
                            style={styles.splitCardImage}
                            contentFit="cover"
                            transition={200}
                          />
                        ) : (
                          <View style={styles.splitFallback}>
                            <Ionicons name="newspaper-outline" size={24} color="#64748B" />
                          </View>
                        )}
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

              {item.imageUrl && (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.listItemThumbnail}
                  contentFit="cover"
                  transition={200}
                />
              )}
            </TouchableOpacity>
          )}
        />
      )}
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
});
