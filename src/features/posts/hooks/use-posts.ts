import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { postsService } from "../services/posts.service";
import {
  PresignedUrlInput,
  PresignedUrlResponse,
  CreatePostInput,
  CreatePostResponse,
  GetGlobalFeedQuery,
  GlobalFeedResponse,
} from "../types/posts.types";

/**
 * Custom hook to generate a presigned URL for media uploads.
 */
export function useGeneratePresignedUrl() {
  return useMutation<PresignedUrlResponse, Error, PresignedUrlInput>({
    mutationFn: (input) => postsService.generatePresignedUrl(input),
  });
}

/**
 * Custom hook to handle post creation mutation.
 * Automatically invalidates active global feed queries on success.
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation<CreatePostResponse, Error, CreatePostInput>({
    mutationFn: (input) => postsService.createPost(input),
    onSuccess: (data) => {
      if (data.success) {
        // Invalidate both standard and infinite global feed caches to reflect the new post
        queryClient.invalidateQueries({ queryKey: ["globalFeed"] });
      }
    },
  });
}

/**
 * Custom hook to retrieve a standard paginated list of feed posts.
 */
export function useGlobalFeed(query?: GetGlobalFeedQuery) {
  return useQuery<GlobalFeedResponse, Error>({
    queryKey: ["globalFeed", "standard", query],
    queryFn: () => postsService.retrieveGlobalFeed(query),
  });
}

/**
 * Custom hook to retrieve infinite scrolling feed posts using cursors.
 */
export function useGlobalFeedInfinite(limit = 10) {
  return useInfiniteQuery<GlobalFeedResponse, Error>({
    queryKey: ["globalFeed", "infinite", limit],
    queryFn: ({ pageParam }) =>
      postsService.retrieveGlobalFeed({
        limit,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      // Return the cursor for the next page, or undefined if there are no more pages
      return lastPage.data?.nextCursor || undefined;
    },
  });
}
