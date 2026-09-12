import { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Feed: undefined;
  Discover: { initialCategory?: string } | undefined;
  Bookmarks: undefined;
  Settings: undefined;
};

export type Article = {
  id: string;
  title: string;
  summary: string[];
  sourceName: string;
  sourceUrl: string;
  sourceLogo?: string;
  category: string;
  imageUrl?: string;
  body?: string;
  publishedAt: string;
  scrapedAt: string;
  isBreaking?: boolean;
  relatedSources?: {
    sourceName: string;
    sourceUrl: string;
    headline: string;
    angleHighlight?: string;
  }[];
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Interests: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  ArticleDetail: { article: Article };
};
