import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { postsService } from "../services/posts.service";
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

/**
 * Custom hook to toggle a like on a post.
 */
export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation<ToggleLikeResponse, Error, string>({
    mutationFn: (postId) => postsService.toggleLike(postId),
    onSuccess: (data, postId) => {
      if (data.success && data.data) {
        const isLiked = data.data.liked;
        queryClient.setQueriesData<any>({ queryKey: ["globalFeed"] }, (oldData: any) => {
          if (!oldData) return oldData;
          if (oldData.pages) {
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => {
                if (!page.data?.posts) return page;
                return {
                  ...page,
                  data: {
                    ...page.data,
                    posts: page.data.posts.map((post: any) => {
                      if (post.id === postId) {
                        let newLikesCount = post.likesCount;
                        if (isLiked && !post.isLiked) {
                          newLikesCount = (post.likesCount || 0) + 1;
                        } else if (!isLiked && post.isLiked) {
                          newLikesCount = Math.max(0, (post.likesCount || 0) - 1);
                        }
                        return {
                          ...post,
                          isLiked: isLiked,
                          likesCount: newLikesCount,
                        };
                      }
                      return post;
                    }),
                  },
                };
              }),
            };
          }
          if (oldData.data?.posts) {
            return {
              ...oldData,
              data: {
                ...oldData.data,
                posts: oldData.data.posts.map((post: any) => {
                  if (post.id === postId) {
                    let newLikesCount = post.likesCount;
                    if (isLiked && !post.isLiked) {
                      newLikesCount = (post.likesCount || 0) + 1;
                    } else if (!isLiked && post.isLiked) {
                      newLikesCount = Math.max(0, (post.likesCount || 0) - 1);
                    }
                    return {
                      ...post,
                      isLiked: isLiked,
                      likesCount: newLikesCount,
                    };
                  }
                  return post;
                }),
              },
            };
          }
          return oldData;
        });
      }
    },
  });
}

/**
 * Custom hook to add a comment to a post.
 */
export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation<CreateCommentResponse, Error, { postId: string; input: CreateCommentInput }>({
    mutationFn: ({ postId, input }) => postsService.addComment(postId, input),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["globalFeed"] });
      }
    },
  });
}
