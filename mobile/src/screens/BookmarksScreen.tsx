import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
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
  const { colors, typography } = useTheme();
  const bookmarkedIds = useAppStore((state) => state.bookmarkedIds);
  const toggleBookmark = useAppStore((state) => state.toggleBookmark);
  const user = useAppStore((state) => state.user);

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleRemove = (articleId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    toggleBookmark(articleId);

    if (user) {
      syncBookmarkToFirestore(user.uid, articleId, false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBarStyle} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <View>
          <Text style={[typography.caption, { color: colors.textTertiary, textTransform: 'uppercase' }]}>
            Personal Library
          </Text>
          <Text style={[typography.h1, { color: colors.textPrimary, letterSpacing: -0.5 }]}>
            Bookmarks
          </Text>
        </View>

        <View style={[styles.countPill, { backgroundColor: colors.accentSubtle }]}>
          <Text style={[styles.countText, { color: colors.accent }]}>
            {bookmarkedIds.length} {bookmarkedIds.length === 1 ? 'Saved' : 'Saved'}
          </Text>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.skeletonContainer}>
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
        </View>
      ) : articles.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconCircle, { backgroundColor: colors.surfaceSubtle }]}>
            <Ionicons name="bookmark-outline" size={44} color={colors.textTertiary} />
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
            <Ionicons name="newspaper-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={[typography.button, { color: '#FFFFFF' }]}>Explore Today's Feed</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
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
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  countPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
  skeletonContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyDesc: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  cardWrapper: {
    marginBottom: 2,
  },
});
