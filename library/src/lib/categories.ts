import type { Category } from '../types';

export const categories: Category[] = [
  { id: 'criminal-law', slug: 'criminal-law', name: 'Уголовное право', description: 'Законодательство, наука и практика' },
  { id: 'civil-law', slug: 'civil-law', name: 'Гражданское право', description: 'Обязательства, отношения и споры' },
  { id: 'constitutional-law', slug: 'constitutional-law', name: 'Конституционное право', description: 'Конституционный строй и права' },
  { id: 'administrative-law', slug: 'administrative-law', name: 'Административное право', description: 'Управление и ответственность' },
  { id: 'legal-theory', slug: 'legal-theory', name: 'Теория государства и права', description: 'Фундаментальные концепции' },
  { id: 'criminalistics', slug: 'criminalistics', name: 'Криминалистика', description: 'Расследование и экспертизы' },
  { id: 'judicial-practice', slug: 'judicial-practice', name: 'Судебная практика', description: 'Решения, обзоры и анализ' },
  { id: 'scientific-literature', slug: 'scientific-literature', name: 'Научная литература', description: 'Исследования и публикации' },
  { id: 'textbooks', slug: 'textbooks', name: 'Учебники', description: 'Учебная литература' },
  { id: 'monographs', slug: 'monographs', name: 'Монографии', description: 'Научные исследования' },
];

export function categoryName(slug: string) {
  return categories.find((category) => category.slug === slug)?.name ?? 'Без категории';
}
