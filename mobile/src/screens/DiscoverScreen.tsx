import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StatusBar,
} from 'react-native';
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

const CATEGORIES = ['All', 'Politics', 'Business', 'Tech', 'Sports', 'World', 'Entertainment'];

export const DiscoverScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors, typography, categoryColors, isDark } = useTheme();
  const initialCat = route.params?.initialCategory || 'All';

  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [isGridView, setIsGridView] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategoryArticles() {
      setLoading(true);
      try {
        const res = await fetchArticlesFromFirestore({
          category: selectedCategory === 'All' ? 'All' : selectedCategory,
          pageSize: 15,
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBarStyle} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[typography.h1, { color: colors.textPrimary }]}>Discover</Text>
        <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
          Filter by topic or search across Pakistani coverage
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
          <Ionicons name="search" size={18} color={colors.textTertiary} style={{ marginRight: 10 }} />
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
            name={isGridView ? 'list' : 'grid'}
            size={20}
            color={colors.accent}
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
          {CATEGORIES.map((cat) => {
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
                      color: isSelected ? '#FFFFFF' : colors.textSecondary,
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
            <Ionicons name="search-outline" size={38} color={colors.textTertiary} />
          </View>
          <Text style={[typography.h3, styles.emptyTitle, { color: colors.textPrimary }]}>
            No results for "{searchQuery}"
          </Text>
          <Text style={[typography.bodySmall, styles.emptyDesc, { color: colors.textSecondary }]}>
            Try searching for terms like "SBP", "Cricket", "Tech", or clear your search query.
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
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={isGridView ? styles.gridColumnWrapper : undefined}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const catStyle = categoryColors[item.category] || {
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
                      transition={300}
                    />
                  ) : (
                    <View style={[styles.gridImageFallback, { backgroundColor: colors.accentSubtle }]}>
                      <Ionicons name="newspaper-outline" size={24} color={colors.accent} />
                    </View>
                  )}

                  <View style={styles.gridCardBody}>
                    <View style={styles.gridMetaRow}>
                      <Text style={[typography.badge, { color: isDark ? catStyle.darkText : catStyle.text, fontSize: 9.5 }]}>
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

                {item.imageUrl && (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.listThumbnail}
                    contentFit="cover"
                    transition={250}
                  />
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  viewToggleBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipsWrapper: {
    marginVertical: 4,
  },
  categoryChipsContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  loaderContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 12,
  },
  listCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 16,
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
    marginBottom: 6,
  },
  categoryPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  listTitle: {
    lineHeight: 22,
  },
  listThumbnail: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  gridColumnWrapper: {
    gap: 12,
  },
  gridCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  gridImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#E2E8F0',
  },
  gridImageFallback: {
    width: '100%',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCardBody: {
    padding: 12,
    flex: 1,
  },
  gridMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  gridTitle: {
    lineHeight: 19,
    marginBottom: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  emptyCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
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
    marginBottom: 20,
  },
  clearBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
});
