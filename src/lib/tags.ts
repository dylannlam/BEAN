import { Tag, TagCategory } from "../data/types";

export const TAGS: Tag[] = [
  { id: "study", label: "Study", category: "vibe", icon: "book-outline", activityLabel: "studying" },
  { id: "work", label: "Work", category: "vibe", icon: "laptop-outline", activityLabel: "working" },
  {
    id: "coffee-chat",
    label: "Coffee Chat",
    category: "vibe",
    icon: "chatbubbles-outline",
    activityLabel: "coffee chats",
  },
  { id: "date", label: "Date", category: "vibe", icon: "heart-outline", activityLabel: "a date" },
  { id: "solo", label: "Solo", category: "vibe", icon: "person-outline", activityLabel: "going solo" },
  { id: "groups", label: "Groups", category: "vibe", icon: "people-outline", activityLabel: "groups" },
  {
    id: "quick-grab",
    label: "Quick Grab",
    category: "vibe",
    icon: "flash-outline",
    activityLabel: "a quick stop",
  },

  { id: "coffee", label: "Coffee", category: "type", icon: "cafe-outline" },
  { id: "food", label: "Food", category: "type", icon: "fast-food-outline" },
  { id: "brunch", label: "Brunch", category: "type", icon: "restaurant-outline" },
  { id: "bakery", label: "Bakery", category: "type", icon: "storefront-outline" },

  { id: "wifi", label: "Wifi", category: "practical", icon: "wifi-outline" },
  { id: "outlets", label: "Outlets", category: "practical", icon: "power-outline" },
  { id: "outdoor", label: "Outdoor Seating", category: "practical", icon: "leaf-outline" },
  { id: "pet-friendly", label: "Pet Friendly", category: "practical", icon: "paw-outline" },
];

export const TAG_CATEGORY_LABEL: Record<TagCategory, string> = {
  vibe: "Good For",
  type: "Type",
  practical: "Practical",
};

export function getTagById(id: string): Tag | undefined {
  return TAGS.find((t) => t.id === id);
}

export function getTagsByCategory(category: TagCategory): Tag[] {
  return TAGS.filter((t) => t.category === category);
}

export function groupTagsByCategory(): Record<TagCategory, Tag[]> {
  return {
    vibe: getTagsByCategory("vibe"),
    type: getTagsByCategory("type"),
    practical: getTagsByCategory("practical"),
  };
}

export function joinActivityLabels(tags: Tag[]): string {
  const labels = tags.map((t) => t.activityLabel ?? t.label.toLowerCase());
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(", ")} or ${labels[labels.length - 1]}`;
}
