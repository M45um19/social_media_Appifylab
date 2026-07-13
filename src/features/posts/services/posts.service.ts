import { apiClient } from "@/lib/api-client";
import {
  PresignedUrlInput,
  PresignedUrlResponse,
  CreatePostInput,
  CreatePostResponse,
  GetGlobalFeedQuery,
  GlobalFeedResponse,
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
};
