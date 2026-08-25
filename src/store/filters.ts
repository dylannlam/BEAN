import { create } from "zustand";
import { PriceLevel } from "../data/types";

interface FiltersState {
  selectedTagIds: string[];
  maxPrice: PriceLevel | null;
  query: string;
  nearMe: boolean;
  openNow: boolean;
  toggleTag: (tagId: string) => void;
  clearTags: () => void;
  setMaxPrice: (price: PriceLevel | null) => void;
  setQuery: (query: string) => void;
  toggleNearMe: () => void;
  toggleOpenNow: () => void;
  reset: () => void;
}

export const useFiltersStore = create<FiltersState>((set) => ({
  selectedTagIds: [],
  maxPrice: null,
  query: "",
  nearMe: false,
  openNow: false,
  toggleTag: (tagId) =>
    set((state) => ({
      selectedTagIds: state.selectedTagIds.includes(tagId)
        ? state.selectedTagIds.filter((id) => id !== tagId)
        : [...state.selectedTagIds, tagId],
    })),
  clearTags: () => set({ selectedTagIds: [] }),
  setMaxPrice: (maxPrice) => set({ maxPrice }),
  setQuery: (query) => set({ query }),
  toggleNearMe: () => set((state) => ({ nearMe: !state.nearMe })),
  toggleOpenNow: () => set((state) => ({ openNow: !state.openNow })),
  reset: () => set({ selectedTagIds: [], maxPrice: null, query: "", nearMe: false, openNow: false }),
}));
