import { User } from "../types";

export const CURRENT_USER_ID = "user-1";

export const MOCK_USERS: User[] = [
  {
    id: "user-1",
    username: "you",
    displayName: "You",
    avatarUrl: "https://api.dicebear.com/9.x/notionists/png?seed=you",
    joinedAt: "2026-01-10T09:00:00.000Z",
  },
  {
    id: "user-2",
    username: "priya.k",
    displayName: "Priya K",
    avatarUrl: "https://api.dicebear.com/9.x/notionists/png?seed=priya",
    joinedAt: "2025-11-02T09:00:00.000Z",
  },
  {
    id: "user-3",
    username: "tomh",
    displayName: "Tom H",
    avatarUrl: "https://api.dicebear.com/9.x/notionists/png?seed=tom",
    joinedAt: "2025-09-21T09:00:00.000Z",
  },
  {
    id: "user-4",
    username: "amelia.rw",
    displayName: "Amelia RW",
    avatarUrl: "https://api.dicebear.com/9.x/notionists/png?seed=amelia",
    joinedAt: "2025-12-15T09:00:00.000Z",
  },
  {
    id: "user-5",
    username: "danny.o",
    displayName: "Danny O",
    avatarUrl: "https://api.dicebear.com/9.x/notionists/png?seed=danny",
    joinedAt: "2026-02-01T09:00:00.000Z",
  },
];
