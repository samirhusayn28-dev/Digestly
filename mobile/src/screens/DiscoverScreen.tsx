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
import { useTheme } from '../theme';
import { fetchArticlesFromFirestore } from '../services/articles';
import { ArticleCardSkeleton } from '../components/common/SkeletonLoader';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Discover'>,
  NativeStackScreenProps<RootStackParamList>
>;

const DISCOVER_CATEGORIES = [
  'All',
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

export const DiscoverScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors, typography, categoryColors, isDark } = useTheme();
  const initialCat = route.params?.initialCategory || 'All';

  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [isGridView, setIsGridView] = useState(false);
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

  const handleToggleView = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsGridView(!isGridView);
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colors.statusBarStyle} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[typography.h1, { color: colors.textPrimary, letterSpacing: -0.4 }]}>
          Discover
        </Text>
        <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
          18 topics & intelligent search across Pakistani news
        </Text>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search" size={17} color={colors.textTertiary} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search headlines, sources, topics..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* List / Grid Toggle */}
        <TouchableOpacity
          onPress={handleToggleView}
          style={[
            styles.viewToggleBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons
            name={isGridView ? 'list-outline' : 'grid-outline'}
            size={19}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Horizontal Category Chips */}
      <View style={styles.categoryChipsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChipsContainer}
        >
          {DISCOVER_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => handleCategoryPress(cat)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? colors.accent : colors.surface,
                    borderColor: isSelected ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.badge,
                    {
                      color: isSelected ? (isDark ? '#000000' : '#FFFFFF') : colors.textSecondary,
                      fontSize: 11,
                    },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content Feed (List or Grid) */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
        </View>
      ) : filteredArticles.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyCircle, { backgroundColor: colors.surfaceSubtle }]}>
            <Ionicons name="search-outline" size={36} color={colors.textTertiary} />
          </View>
          <Text style={[typography.h3, styles.emptyTitle, { color: colors.textPrimary }]}>
            No results for "{searchQuery}"
          </Text>
          <Text style={[typography.bodySmall, styles.emptyDesc, { color: colors.textSecondary }]}>
            Try searching for "Economy", "Cricket", "Tech", or clear your search.
          </Text>
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={[styles.clearBtn, { backgroundColor: colors.accentSubtle }]}
          >
            <Text style={[typography.button, { color: colors.accent }]}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          key={isGridView ? 'grid-2' : 'list-1'}
          data={filteredArticles}
          keyExtractor={(item) => item.id}
          numColumns={isGridView ? 2 : 1}
          contentContainerStyle={[
            styles.listContent,
            {
              maxWidth: isTablet ? 740 : '100%',
              alignSelf: 'center',
              width: '100%',
              paddingBottom: insets.bottom + 80,
            },
          ]}
          columnWrapperStyle={isGridView ? styles.gridColumnWrapper : undefined}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const catStyle = categoryColors[item.category] || categoryColors['Top Stories'] || {
              bg: colors.surfaceSubtle,
              text: colors.accent,
              darkBg: '#1E293B',
              darkText: colors.accent,
            };

            if (isGridView) {
              return (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('ArticleDetail', { article: item })}
                  style={[
                    styles.gridCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      shadowColor: colors.cardShadow,
                    },
                  ]}
                >
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.gridImage}
                      contentFit="cover"
                      transition={250}
                    />
                  ) : (
                    <View style={[styles.gridImageFallback, { backgroundColor: isDark ? '#1E2536' : '#F1F5F9' }]}>
                      <Ionicons name="newspaper-outline" size={24} color={colors.textTertiary} />
                      <Text style={[styles.fallbackPublisher, { color: colors.textTertiary }]}>
                        {item.sourceName}
                      </Text>
                    </View>
                  )}

                  <View style={styles.gridCardBody}>
                    <View style={styles.gridMetaRow}>
                      <Text
                        style={[
                          typography.badge,
                          { color: isDark ? catStyle.darkText : catStyle.accentColor, fontSize: 9.5 },
                        ]}
                      >
                        {item.category}
                      </Text>
                      <Text style={[typography.caption, { color: colors.textTertiary, fontSize: 10 }]}>
                        {item.sourceName}
                      </Text>
                    </View>

                    <Text
                      numberOfLines={3}
                      style={[typography.h4, styles.gridTitle, { color: colors.textPrimary }]}
                    >
                      {item.title}
                    </Text>

                    <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 'auto' }]}>
                      {item.publishedAt}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }

            // List Item Layout
            return (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('ArticleDetail', { article: item })}
                style={[
                  styles.listCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    shadowColor: colors.cardShadow,
                  },
                ]}
              >
                <View style={styles.listCardContent}>
                  <View style={styles.listMetaRow}>
                    <View
                      style={[
                        styles.categoryPill,
                        { backgroundColor: isDark ? catStyle.darkBg : catStyle.bg },
                      ]}
                    >
                      <Text
                        style={[
                          typography.badge,
                          { color: isDark ? catStyle.darkText : catStyle.text, fontSize: 10 },
                        ]}
                      >
                        {item.category}
                      </Text>
                    </View>

                    <Text style={[typography.caption, { color: colors.textTertiary, marginHorizontal: 6 }]}>
                      •
                    </Text>

                    <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '600' }]}>
                      {item.sourceName}
                    </Text>
                  </View>

                  <Text
                    numberOfLines={2}
                    style={[typography.h3, styles.listTitle, { color: colors.textPrimary }]}
                  >
                    {item.title}
                  </Text>

                  <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 4 }]}>
                    {item.publishedAt}
                  </Text>
                </View>

                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.listThumbnail}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View
                    style={[
                      styles.listThumbnail,
                      styles.thumbnailFallback,
                      { backgroundColor: isDark ? '#1E2536' : '#F1F5F9', borderColor: colors.borderLight },
                    ]}
                  >
                    <Ionicons name="newspaper-outline" size={20} color={colors.textTertiary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
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
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 6,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
    gap: 9,
  },
  searchBar: {
    flex: 1,
    height: 42,
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    height: '100%',
  },
  viewToggleBtn: {
    width: 42,
    height: 42,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipsWrapper: {
    marginVertical: 4,
  },
  categoryChipsContainer: {
    paddingHorizontal: 18,
    gap: 7,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  loaderContainer: {
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    gap: 11,
  },
  listCard: {
    flexDirection: 'row',
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  listCardContent: {
    flex: 1,
    marginRight: 12,
  },
  listMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  categoryPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  listTitle: {
    lineHeight: 20,
    fontSize: 14.5,
    fontWeight: '600',
  },
  listThumbnail: {
    width: 68,
    height: 68,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  thumbnailFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  gridColumnWrapper: {
    gap: 11,
  },
  gridCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  gridImage: {
    width: '100%',
    height: 95,
    backgroundColor: '#E2E8F0',
  },
  gridImageFallback: {
    width: '100%',
    height: 95,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  fallbackPublisher: {
    fontSize: 9.5,
    fontWeight: '600',
    marginTop: 3,
  },
  gridCardBody: {
    padding: 10,
    flex: 1,
  },
  gridMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  gridTitle: {
    lineHeight: 18,
    fontSize: 13.5,
    marginBottom: 6,
    fontWeight: '600',
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
    marginBottom: 6,
  },
  emptyDesc: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  clearBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
  },
});
