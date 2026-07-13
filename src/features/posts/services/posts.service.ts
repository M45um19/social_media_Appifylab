import { apiClient } from "@/lib/api-client";
import {
  PresignedUrlInput,
  PresignedUrlResponse,
  CreatePostInput,
  CreatePostResponse,
  GetGlobalFeedQuery,
  GlobalFeedResponse,
  ToggleLikeResponse,
  CreateCommentInput,
  CreateCommentResponse,
} from "../types/posts.types";

export const postsService = {
  /**
   * Generates a Cloudinary presigned upload signature and metadata.
   */
  async generatePresignedUrl(input: PresignedUrlInput): Promise<PresignedUrlResponse> {
    const response = await apiClient.post<PresignedUrlResponse>("/posts/presigned-url", input);
    return response.data;
  },

  /**
   * Creates a new post with content and media.
   */
  async createPost(input: CreatePostInput): Promise<CreatePostResponse> {
    const response = await apiClient.post<CreatePostResponse>("/posts", input);
    return response.data;
  },

  /**
   * Retrieves the paginated global posts feed.
   */
  async retrieveGlobalFeed(query?: GetGlobalFeedQuery): Promise<GlobalFeedResponse> {
    const response = await apiClient.get<GlobalFeedResponse>("/posts", {
      params: query,
    });
    return response.data;
  },

  /**
   * Toggles a like on a specific post.
   */
  async toggleLike(postId: string): Promise<ToggleLikeResponse> {
    const response = await apiClient.post<ToggleLikeResponse>(`/posts/${postId}/like`);
    return response.data;
  },

  /**
   * Adds a new comment to a specific post.
   */
  async addComment(postId: string, input: CreateCommentInput): Promise<CreateCommentResponse> {
    const response = await apiClient.post<CreateCommentResponse>(`/posts/${postId}/comments`, input);
    return response.data;
  },
};
