import { Follow } from "../types";
import { CURRENT_USER_ID } from "./users";

export const MOCK_FOLLOWS: Follow[] = [
  { followerId: CURRENT_USER_ID, followingId: "user-2" },
  { followerId: CURRENT_USER_ID, followingId: "user-3" },
  { followerId: CURRENT_USER_ID, followingId: "user-4" },
  { followerId: CURRENT_USER_ID, followingId: "user-5" },
];
