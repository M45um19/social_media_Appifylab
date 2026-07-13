import { z } from "zod";
import { ApiResponse } from "@/types/api.types";

// ============================================================================
// Presigned URL Validation Schema & Types
// ============================================================================

export const presignedUrlSchema = z
  .object({
    resourceType: z.enum(["image", "video"], {
      message: "resourceType must be either 'image' or 'video'",
    }),
    size: z.number().positive("size must be positive"),
    format: z.string(),
  })
  .refine(
    (data) => {
      const format = data.format.toLowerCase();
      if (data.resourceType === "image") {
        return ["jpeg", "jpg", "png", "webp"].includes(format);
      }
      if (data.resourceType === "video") {
        return ["mp4", "mkv"].includes(format);
      }
      return false;
    },
    {
      message: "Invalid file format. Allowed formats: image: jpeg, jpg, png, webp; video: mp4, mkv",
      path: ["format"],
    }
  )
  .refine(
    (data) => {
      if (data.resourceType === "image") {
        return data.size <= 10 * 1024 * 1024; // 10MB
      }
      if (data.resourceType === "video") {
        return data.size <= 50 * 1024 * 1024; // 50MB
      }
      return false;
    },
    {
      message: "File size exceeds limit. Max 10MB for images, 50MB for videos",
      path: ["size"],
    }
  );

export type PresignedUrlInput = z.infer<typeof presignedUrlSchema>;

export interface PresignedUrlData {
  signature: string;
  timestamp: number;
  folder: string;
  publicId: string;
  resourceType: "image" | "video";
  apiKey: string;
  cloudName: string;
}

export type PresignedUrlResponse = ApiResponse<PresignedUrlData>;

// ============================================================================
// Post Creation Validation Schema & Types
// ============================================================================

export const createPostSchema = z.object({
  content: z.string().min(1, "Post content cannot be empty"),
  mediaUrls: z.array(z.string().url("Invalid media URL")).optional().default([]),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export interface PostUser {
  firstName: string;
  lastName: string;
  profilePicture?: string;
}

export interface PostLiker {
  id: string;
  name: string;
  pic?: string;
}

export interface PostRecentCommentReply {
  userId: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  text: string;
}

export interface PostRecentComment {
  userId: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  text: string;
  reply?: PostRecentCommentReply | null;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  mediaUrls: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  user: PostUser;
  recentLikers?: PostLiker[];
  recentComment?: PostRecentComment | null;
  isLiked?: boolean;
}

export type CreatePostResponse = ApiResponse<Post>;

// ============================================================================
// Comment Types & Schemas
// ============================================================================

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment content cannot be empty"),
  parentId: z.string().optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateCommentResponse = ApiResponse<PostComment>;

// ============================================================================
// Like Types & Responses
// ============================================================================

export interface ToggleLikeData {
  liked: boolean;
}

export type ToggleLikeResponse = ApiResponse<ToggleLikeData>;

// ============================================================================
// Retrieve Global Feed Schema & Types
// ============================================================================

export const getGlobalFeedQuerySchema = z.object({
  limit: z.number().min(1).max(100).optional().default(10),
  cursor: z.string().optional(),
});

export type GetGlobalFeedQuery = z.infer<typeof getGlobalFeedQuerySchema>;

export interface GlobalFeedData {
  posts: Post[];
  nextCursor?: string;
}

export type GlobalFeedResponse = ApiResponse<GlobalFeedData>;
