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
import { useAppStore } from '../store/useAppStore';
import { fetchBookmarkedArticles } from '../services/bookmarks';
import { ArticleCard } from '../components/feed/ArticleCard';
import { BookmarksSkeleton } from '../components/common/SkeletonLoader';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Bookmarks'>,
  NativeStackScreenProps<RootStackParamList>
>;

const BOOKMARK_FILTERS = ['All', 'Articles', 'Videos', 'Topics'] as const;

export const BookmarksScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const bookmarkedIds = useAppStore((state) => state.bookmarkedIds);
  const user = useAppStore((state) => state.user);
  const isGuest = useAppStore((state) => state.isGuest);

  const [activeTab, setActiveTab] = useState<(typeof BOOKMARK_FILTERS)[number]>('All');
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

  const filteredArticles = articles.filter((art) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Articles') return true;
    if (activeTab === 'Videos') return false; // Filter for future video briefs
    if (activeTab === 'Topics') return Boolean(art.category);
    return true;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header matching Bookmarks.png */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.librarySubtitle}>YOUR LIBRARY</Text>
          <Text style={styles.title}>Bookmarks</Text>
        </View>

        <View style={styles.countPill}>
          <Text style={styles.countText}>{bookmarkedIds.length} saved</Text>
        </View>
      </View>

      {/* Filter Pills Row */}
      <View style={styles.filterPillsRow}>
        {BOOKMARK_FILTERS.map((tab) => {
          const isSelected = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab(tab);
              }}
              style={[
                styles.filterPill,
                isSelected ? styles.filterPillActive : styles.filterPillInactive,
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  isSelected ? styles.filterPillTextActive : styles.filterPillTextInactive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Saved Locally Sync Info Banner */}
      {(!user || isGuest) && (
        <View style={styles.syncBanner}>
          <View style={styles.syncIconWrap}>
            <Ionicons name="cloud-outline" size={18} color="#38BDF8" />
          </View>
          <View style={styles.syncTextWrap}>
            <Text style={styles.syncTitle}>Saved locally</Text>
            <Text style={styles.syncDesc}>
              Articles are stored on this device. Sign in to sync across devices.
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.syncActionBtn}
          >
            <Text style={styles.syncActionText}>Sign in</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <BookmarksSkeleton />
      ) : filteredArticles.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="bookmark-outline" size={38} color="#64748B" />
          </View>
          <Text style={styles.emptyTitle}>Your Library is Empty</Text>
          <Text style={styles.emptyDesc}>
            Tap the bookmark icon on any card in your feed to save essential stories for offline reading.
          </Text>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => navigation.navigate('Feed')}
            style={styles.exploreBtn}
          >
            <Ionicons name="newspaper-outline" size={16} color="#07090E" style={{ marginRight: 8 }} />
            <Text style={styles.exploreBtnText}>Explore Feed</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredArticles}
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
    backgroundColor: '#07090E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  librarySubtitle: {
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
  countPill: {
    backgroundColor: '#111622',
    borderWidth: 1,
    borderColor: '#1E2638',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  filterPillsRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  filterPillInactive: {
    backgroundColor: '#111622',
    borderColor: '#1E2638',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#07090E',
    fontWeight: '700',
  },
  filterPillTextInactive: {
    color: '#94A3B8',
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111622',
    borderWidth: 1,
    borderColor: '#1E2638',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 18,
    marginBottom: 12,
    borderRadius: 14,
  },
  syncIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  syncTextWrap: {
    flex: 1,
  },
  syncTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  syncDesc: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 15,
  },
  syncActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#1E2638',
    marginLeft: 8,
  },
  syncActionText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#38BDF8',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  cardWrapper: {
    marginBottom: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#111622',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E2638',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 22,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  exploreBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#07090E',
  },
});
