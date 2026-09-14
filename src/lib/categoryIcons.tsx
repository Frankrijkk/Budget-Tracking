import {
  ShoppingCart,
  UtensilsCrossed,
  Car,
  Home,
  Zap,
  ShoppingBag,
  Film,
  Pill,
  Plane,
  PawPrint,
  BookOpen,
  Package,
  Palmtree,
  Gem,
  Baby,
  GraduationCap,
  Shield,
  Gift,
  type LucideIcon,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  'shopping-cart': ShoppingCart,
  utensils: UtensilsCrossed,
  car: Car,
  home: Home,
  zap: Zap,
  'shopping-bag': ShoppingBag,
  film: Film,
  pill: Pill,
  plane: Plane,
  paw: PawPrint,
  book: BookOpen,
  package: Package,
  'palm-tree': Palmtree,
  gem: Gem,
  baby: Baby,
  'graduation-cap': GraduationCap,
  shield: Shield,
  gift: Gift,
}

export const CATEGORY_ICON_OPTIONS = [
  'shopping-cart',
  'utensils',
  'car',
  'home',
  'zap',
  'shopping-bag',
  'film',
  'pill',
  'plane',
  'paw',
  'book',
  'package',
]

export const GOAL_ICON_OPTIONS = ['palm-tree', 'home', 'car', 'gem', 'baby', 'graduation-cap', 'shield', 'gift']

export const BADGE_COLOR_OPTIONS = [
  '#b8a1ff', // purple
  '#ff8a7a', // coral
  '#f5c563', // mustard
  '#5fe0c4', // teal
  '#f78fc2', // pink
  '#6fb8ff', // blue
  '#a8d88a', // sage
  '#9891a3', // grey
]

/** Renders a category/goal icon by name, falling back to a generic box for legacy emoji data. */
export function CategoryIcon({ name, size = 18, className }: { name: string; size?: number; className?: string }) {
  const Icon = ICON_MAP[name] ?? Package
  return <Icon size={size} className={className} strokeWidth={2} />
}
