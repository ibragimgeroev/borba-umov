export type ViewMode = 'grid' | 'list';
export type LibrarySection = 'catalog' | 'my' | 'favorites' | 'notes' | 'profile';
export type HighlightKind = 'highlight' | 'underline' | 'strikeout';
export type HighlightColor = 'yellow' | 'green' | 'red' | 'blue' | 'purple';

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  year: number | null;
  keywords: string[];
  pageCount: number;
  coverUrl: string | null;
  filePath: string | null;
  coverPath: string | null;
  createdAt: string;
  published: boolean;
  owned: boolean;
}

export interface ReadingProgress {
  bookId: string;
  page: number;
  percent: number;
  lastReadAt: string;
}

export interface Bookmark {
  id: string;
  bookId: string;
  page: number;
  title: string;
  createdAt: string;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Highlight {
  id: string;
  bookId: string;
  page: number;
  kind: HighlightKind;
  color: HighlightColor;
  text: string;
  rects: Rect[];
  createdAt: string;
}

export interface Annotation {
  id: string;
  bookId: string;
  page: number;
  highlightId?: string;
  kind: 'note' | 'comment' | 'ink';
  content: string;
  strokes?: { color: string; points: { x: number; y: number }[] }[];
  createdAt: string;
}

export interface BookDraft {
  title: string;
  author: string;
  description: string;
  category: string;
  year: number | null;
  keywords: string[];
  published: boolean;
}

export interface LibraryState {
  books: Book[];
  favorites: string[];
  library: string[];
  progress: Record<string, ReadingProgress>;
  bookmarks: Bookmark[];
  highlights: Highlight[];
  annotations: Annotation[];
  searchHistory: string[];
  displayName: string;
}
