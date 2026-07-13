"use client";

import React, { useState, useEffect, useRef } from "react";
import { getCookie } from "@/utils/cookies";
import {
  useGlobalFeedInfinite,
  useCreatePost,
  useGeneratePresignedUrl,
  useToggleLike,
  useAddComment,
} from "@/features/posts/hooks/use-posts";

interface Comment {
  id: number | string;
  name: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
  parentId?: string;
  replies?: Comment[];
}

interface Liker {
  id: string;
  name: string;
  pic?: string;
}

interface Post {
  id: number | string;
  authorName: string;
  authorAvatar: string;
  timeAgo: string;
  visibility: string;
  title: string;
  image?: string;
  reacts: number;
  commentsCount: number;
  sharesCount: number;
  hasLiked: boolean;
  comments: Comment[];
  showDropdown?: boolean;
  recentLikers?: Liker[];
}

export default function MiddleContent() {
  const [newPostText, setNewPostText] = useState("");
  const [activeCommentPostId, setActiveCommentPostId] = useState<number | string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string | number, string>>({});

  const [locallyCreatedPosts, setLocallyCreatedPosts] = useState<Post[]>([]);
  const [deletedPostIds, setDeletedPostIds] = useState<Set<string | number>>(new Set());
  const [localLikesToggle, setLocalLikesToggle] = useState<Record<string | number, boolean>>({});
  const [localComments, setLocalComments] = useState<Record<string | number, Comment[]>>({});
  const [activeDropdownPostId, setActiveDropdownPostId] = useState<number | string | null>(null);
  const [activeReplyCommentId, setActiveReplyCommentId] = useState<number | string | null>(null);
  const [replyInputs, setReplyInputs] = useState<Record<string | number, string>>({});
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  } | null>(null);

  useEffect(() => {
    const userJson = getCookie("user");
    if (userJson) {
      try {
        const parsed = JSON.parse(userJson);
        setTimeout(() => {
          setCurrentUser(parsed);
        }, 0);
      } catch (err) {
        console.error("Failed to parse user cookie", err);
      }
    }
  }, []);

  const {
    data: feedData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGlobalFeedInfinite(10);
  const createPostMutation = useCreatePost();
  const presignedUrlMutation = useGeneratePresignedUrl();
  const toggleLikeMutation = useToggleLike();
  const addCommentMutation = useAddComment();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<"image" | "video">("image");

  const formatTimeAgo = (dateString: string): string => {
    try {
      const now = new Date();
      const date = new Date(dateString);
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (seconds < 60) return "Just now";
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return "Just now";
    }
  };

  // Derive posts directly from infinite query pages
  const queryPosts: Post[] = feedData?.pages
    ? feedData.pages.flatMap((page) => {
      return (page.data?.posts || []).map((p) => {
        // Check local likes override first, fallback to p.isLiked
        const hasLiked = localLikesToggle[p.id] !== undefined
          ? localLikesToggle[p.id]
          : (p.isLiked || false);

        const baseLikes = p.likesCount || 0;
        const diff = localLikesToggle[p.id] !== undefined
          ? (localLikesToggle[p.id] ? (p.isLiked ? 0 : 1) : (p.isLiked ? -1 : 0))
          : 0;
        const reacts = baseLikes + diff;

        // Merge backend comments with local comments
        const commentsList: Comment[] = [
          ...(p.recentComment
            ? [
              {
                id: `recent-${p.id}`,
                name: (p.recentComment.firstName && p.recentComment.lastName)
                  ? `${p.recentComment.firstName} ${p.recentComment.lastName}`
                  : "User",
                avatar: p.recentComment.profilePicture || "/assets/images/comment_img.png",
                text: p.recentComment.text,
                time: "1m",
                likes: 0,
              },
            ]
            : []),
          ...(localComments[p.id] || [])
            .filter((c) => !p.recentComment || p.recentComment.text !== c.text)
            .map((c) => ({
              id: c.id,
              name: c.name,
              avatar: c.avatar,
              text: c.text,
              time: c.time,
              likes: c.likes,
            })),
        ];

        return {
          id: p.id,
          authorName: `${p.user.firstName} ${p.user.lastName}`,
          authorAvatar: p.user.profilePicture || "/assets/images/post_img.png",
          timeAgo: formatTimeAgo(p.createdAt),
          visibility: "Public",
          title: p.content,
          image: p.mediaUrls && p.mediaUrls.length > 0 ? p.mediaUrls[0] : undefined,
          reacts,
          commentsCount: (p.commentsCount || 0) + (localComments[p.id]?.length || 0),
          sharesCount: 122,
          hasLiked,
          comments: commentsList,
          showDropdown: p.id === activeDropdownPostId,
          recentLikers: p.recentLikers,
        };
      });
    })
    : [];

  const visiblePosts = queryPosts.filter((p) => !deletedPostIds.has(p.id));

  const mappedLocallyCreated = locallyCreatedPosts.map((p) => {
    const hasLiked = localLikesToggle[p.id] !== undefined
      ? localLikesToggle[p.id]
      : (p.hasLiked || false);

    const baseLikes = p.reacts || 0;
    const diff = localLikesToggle[p.id] !== undefined
      ? (localLikesToggle[p.id] ? (p.hasLiked ? 0 : 1) : (p.hasLiked ? -1 : 0))
      : 0;
    const reacts = baseLikes + diff;

    const commentsList = [
      ...(localComments[p.id] || []),
    ];

    return {
      ...p,
      reacts,
      commentsCount: (p.commentsCount || 0) + commentsList.length,
      hasLiked,
      comments: commentsList,
      showDropdown: p.id === activeDropdownPostId,
      recentLikers: p.recentLikers || [],
    };
  });

  const posts = [...mappedLocallyCreated, ...visiblePosts];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, posts.length]);

  const handlePhotoClick = (type: "image" | "video") => {
    setUploadType(type);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 0);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const format = file.name.split(".").pop()?.toLowerCase() || "";
    const size = file.size;

    setIsUploading(true);
    try {
      const res = await presignedUrlMutation.mutateAsync({
        resourceType: uploadType,
        size,
        format,
      });

      if (res.success && res.data) {
        const { signature, timestamp, folder, publicId, apiKey, cloudName } = res.data;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp.toString());
        formData.append("signature", signature);
        formData.append("folder", folder);
        formData.append("public_id", publicId);

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/${uploadType}/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        const uploadData = await uploadRes.json();
        if (uploadData.secure_url) {
          setSelectedImageUrl(uploadData.secure_url);
        } else {
          alert(`Failed to upload ${uploadType}: ` + (uploadData.error?.message || "Unknown error"));
        }
      }
    } catch (err) {
      console.error("Presigned URL generation failed:", err);
      alert(`Error uploading ${uploadType}. Allowed formats: image: jpeg, jpg, png, webp; video: mp4, mkv. Max size: 10MB image, 50MB video.`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim() && !selectedImageUrl) return;

    createPostMutation.mutate(
      {
        content: newPostText,
        mediaUrls: selectedImageUrl ? [selectedImageUrl] : [],
      },
      {
        onSuccess: (data) => {
          if (data.success && data.data) {
            const newPost = data.data;
            const mappedNewPost: Post = {
              id: newPost.id,
              authorName: `${newPost.user.firstName} ${newPost.user.lastName}`,
              authorAvatar: newPost.user.profilePicture || "/assets/images/post_img.png",
              timeAgo: "Just now",
              visibility: "Public",
              title: newPost.content,
              image: newPost.mediaUrls && newPost.mediaUrls.length > 0 ? newPost.mediaUrls[0] : undefined,
              reacts: newPost.likesCount || 0,
              commentsCount: newPost.commentsCount || 0,
              sharesCount: 0,
              hasLiked: false,
              comments: [],
            };
            setLocallyCreatedPosts((prev) => [mappedNewPost, ...prev]);
            setNewPostText("");
            setSelectedImageUrl(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }
        },
        onError: (err) => {
          console.error("Failed to create post:", err);
          alert("Failed to create post. Please try again.");
        },
      }
    );
  };

  const handleReactToggle = (postId: number | string) => {
    const postObj = posts.find((p) => p.id === postId);
    const currentlyLiked = postObj ? postObj.hasLiked : false;

    // Toggle state locally (optimistic)
    setLocalLikesToggle((prev) => ({
      ...prev,
      [postId]: !currentlyLiked,
    }));

    // Perform mutation
    toggleLikeMutation.mutate(postId.toString(), {
      onError: (err) => {
        console.error("Failed to toggle like:", err);
        // Rollback optimistic update
        setLocalLikesToggle((prev) => ({
          ...prev,
          [postId]: currentlyLiked,
        }));
      },
    });
  };

  const handlePostDropdownToggle = (postId: number | string) => {
    setActiveDropdownPostId(activeDropdownPostId === postId ? null : postId);
  };

  const handleDeletePost = (postId: number | string) => {
    setDeletedPostIds((prev) => {
      const next = new Set(prev);
      next.add(postId);
      return next;
    });
  };

  const handleAddComment = (postId: number | string, e: React.FormEvent) => {
    e.preventDefault();
    const commentText = commentInputs[postId] || "";
    if (!commentText.trim()) return;

    // Call mutation to persist in database
    addCommentMutation.mutate(
      {
        postId: postId.toString(),
        input: { content: commentText },
      },
      {
        onSuccess: (data) => {
          if (data.success && data.data) {
            const comment = data.data;
            const newComment: Comment = {
              id: comment.id,
              name: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "You",
              avatar: currentUser?.profilePicture || "/assets/images/comment_img.png",
              text: comment.content,
              time: "Just now",
              likes: 0,
            };

            setLocalComments((prev) => ({
              ...prev,
              [postId]: [...(prev[postId] || []), newComment],
            }));
            setCommentInputs({ ...commentInputs, [postId]: "" });
          }
        },
        onError: (err) => {
          console.error("Failed to add comment:", err);
          alert("Failed to post comment. Please try again.");
        },
      }
    );
  };

  const handleAddReply = (postId: number | string, commentId: number | string, e: React.FormEvent) => {
    e.preventDefault();
    const replyText = replyInputs[commentId] || "";
    if (!replyText.trim()) return;

    const parentId = commentId.toString().replace(/^recent-/, "");

    addCommentMutation.mutate(
      {
        postId: postId.toString(),
        input: { content: replyText, parentId },
      },
      {
        onSuccess: (data) => {
          if (data.success && data.data) {
            const comment = data.data;
            const newReply: Comment = {
              id: comment.id,
              name: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "You",
              avatar: currentUser?.profilePicture || "/assets/images/comment_img.png",
              text: comment.content,
              time: "Just now",
              likes: 0,
            };

            setLocalComments((prev) => ({
              ...prev,
              [postId]: [...(prev[postId] || []), newReply],
            }));
            setReplyInputs((prev) => ({ ...prev, [commentId]: "" }));
            setActiveReplyCommentId(null);
          }
        },
        onError: (err) => {
          console.error("Failed to add reply:", err);
          alert("Failed to post reply. Please try again.");
        },
      }
    );
  };

  const handleCommentInputChange = (postId: number | string, val: string) => {
    setCommentInputs({ ...commentInputs, [postId]: val });
  };

  return (
    <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
      <div className="_layout_middle_wrap">
        <div className="_layout_middle_inner">
          {/* Stories for Desktop */}
          <div className="_feed_inner_ppl_card _mar_b16">
            <div className="_feed_inner_story_arrow">
              <button type="button" className="_feed_inner_story_arrow_btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="9" height="8" fill="none" viewBox="0 0 9 8">
                  <path fill="#fff" d="M8 4l.366-.341.318.341-.318.341L8 4zm-7 .5a.5.5 0 010-1v1zM5.566.659l2.8 3-.732.682-2.8-3L5.566.66zm2.8 3.682l-2.8 3-.732-.682 2.8-3 .732.682zM8 4.5H1v-1h7v1z" />
                </svg>
              </button>
            </div>
            <div className="row">
              <div className="col-xl-3 col-lg-3 col-md-4 col-sm-4 col">
                <div className="_feed_inner_profile_story _b_radious6 ">
                  <div className="_feed_inner_profile_story_image">
                    <img src="/assets/images/card_ppl1.png" alt="Image" className="_profile_story_img" />
                    <div className="_feed_inner_story_txt">
                      <div className="_feed_inner_story_btn">
                        <button className="_feed_inner_story_btn_link" type="button">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 10 10">
                            <path stroke="#fff" strokeLinecap="round" d="M.5 4.884h9M4.884 9.5v-9" />
                          </svg>
                        </button>
                      </div>
                      <p className="_feed_inner_story_para">Your Story</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-3 col-md-4 col-sm-4 col">
                <div className="_feed_inner_public_story _b_radious6">
                  <div className="_feed_inner_public_story_image">
                    <img src="/assets/images/card_ppl2.png" alt="Image" className="_public_story_img" />
                    <div className="_feed_inner_pulic_story_txt">
                      <p className="_feed_inner_pulic_story_para">Ryan Roslansky</p>
                    </div>
                    <div className="_feed_inner_public_mini">
                      <img src="/assets/images/mini_pic.png" alt="Image" className="_public_mini_img" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-3 col-md-4 col-sm-4 _custom_mobile_none">
                <div className="_feed_inner_public_story _b_radious6">
                  <div className="_feed_inner_public_story_image">
                    <img src="/assets/images/card_ppl3.png" alt="Image" className="_public_story_img" />
                    <div className="_feed_inner_pulic_story_txt">
                      <p className="_feed_inner_pulic_story_para">Ryan Roslansky</p>
                    </div>
                    <div className="_feed_inner_public_mini">
                      <img src="/assets/images/mini_pic.png" alt="Image" className="_public_mini_img" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-3 col-md-4 col-sm-4 _custom_none">
                <div className="_feed_inner_public_story _b_radious6">
                  <div className="_feed_inner_public_story_image">
                    <img src="/assets/images/card_ppl4.png" alt="Image" className="_public_story_img" />
                    <div className="_feed_inner_pulic_story_txt">
                      <p className="_feed_inner_pulic_story_para">Ryan Roslansky</p>
                    </div>
                    <div className="_feed_inner_public_mini">
                      <img src="/assets/images/mini_pic.png" alt="Image" className="_public_mini_img" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stories for Mobile */}
          <div className="_feed_inner_ppl_card_mobile _mar_b16">
            <div className="_feed_inner_ppl_card_area">
              <ul className="_feed_inner_ppl_card_area_list">
                <li className="_feed_inner_ppl_card_area_item">
                  <a href="#" className="_feed_inner_ppl_card_area_link">
                    <div className="_feed_inner_ppl_card_area_story">
                      <img src="/assets/images/mobile_story_img.png" alt="Image" className="_card_story_img" />
                      <div className="_feed_inner_ppl_btn">
                        <button className="_feed_inner_ppl_btn_link" type="button">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 12 12">
                            <path stroke="#fff" strokeLinecap="round" strokeLinejoin="round" d="M6 2.5v7M2.5 6h7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="_feed_inner_ppl_card_area_link_txt">Your Story</p>
                  </a>
                </li>
                <li className="_feed_inner_ppl_card_area_item">
                  <a href="#" className="_feed_inner_ppl_card_area_link">
                    <div className="_feed_inner_ppl_card_area_story_active">
                      <img src="/assets/images/mobile_story_img1.png" alt="Image" className="_card_story_img1" />
                    </div>
                    <p className="_feed_inner_ppl_card_area_txt">Ryan...</p>
                  </a>
                </li>
                <li className="_feed_inner_ppl_card_area_item">
                  <a href="#" className="_feed_inner_ppl_card_area_link">
                    <div className="_feed_inner_ppl_card_area_story_inactive">
                      <img src="/assets/images/mobile_story_img2.png" alt="Image" className="_card_story_img1" />
                    </div>
                    <p className="_feed_inner_ppl_card_area_txt">Ryan...</p>
                  </a>
                </li>
                <li className="_feed_inner_ppl_card_area_item">
                  <a href="#" className="_feed_inner_ppl_card_area_link">
                    <div className="_feed_inner_ppl_card_area_story_active">
                      <img src="/assets/images/mobile_story_img1.png" alt="Image" className="_card_story_img1" />
                    </div>
                    <p className="_feed_inner_ppl_card_area_txt">Ryan...</p>
                  </a>
                </li>
                <li className="_feed_inner_ppl_card_area_item">
                  <a href="#" className="_feed_inner_ppl_card_area_link">
                    <div className="_feed_inner_ppl_card_area_story_inactive">
                      <img src="/assets/images/mobile_story_img2.png" alt="Image" className="_card_story_img1" />
                    </div>
                    <p className="_feed_inner_ppl_card_area_txt">Ryan...</p>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Post Box */}
          <div className="_feed_inner_text_area _b_radious6 _padd_b24 _padd_t24 _padd_r24 _padd_l24 _mar_b16">
            <div className="_feed_inner_text_area_box">
              <div className="_feed_inner_text_area_box_image">
                <img src="/assets/images/txt_img.png" alt="Image" className="_txt_img" />
              </div>
              <div className="form-floating _feed_inner_text_area_box_form">
                <textarea
                  className="form-control _textarea"
                  placeholder="Write something ..."
                  id="floatingTextarea"
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  style={{ height: "auto" }}
                ></textarea>
                {!newPostText && (
                  <label className="_feed_textarea_label" htmlFor="floatingTextarea">
                    Write something ...
                    <svg xmlns="http://www.w3.org/2000/svg" width="23" height="24" fill="none" viewBox="0 0 23 24">
                      <path fill="#666" d="M19.504 19.209c.332 0 .601.289.601.646 0 .326-.226.596-.52.64l-.081.005h-6.276c-.332 0-.602-.289-.602-.645 0-.327.227-.597.52-.64l.082-.006h6.276zM13.4 4.417c1.139-1.223 2.986-1.223 4.125 0l1.182 1.268c1.14 1.223 1.14 3.205 0 4.427L9.82 19.649a2.619 2.619 0 01-1.916.85h-3.64c-.337 0-.61-.298-.6-.66l.09-3.941a3.019 3.019 0 01.794-1.982l8.852-9.5zm-.688 2.562l-7.313 7.85a1.68 1.68 0 00-.441 1.101l-.077 3.278h3.023c.356 0 .698-.133.968-.376l.098-.096 7.35-7.887-3.608-3.87zm3.962-1.65a1.633 1.633 0 00-2.423 0l-.688.737 3.606 3.87.688-.737c.631-.678.666-1.755.105-2.477l-.105-.124-1.183-1.268z" />
                    </svg>
                  </label>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept={uploadType === "image" ? "image/*" : "video/*"}
                  style={{ display: "none" }}
                  onChange={handleImageUpload}
                />
                {isUploading && (
                  <div style={{ marginTop: "12px", color: "#666", fontSize: "14px" }}>
                    Uploading media...
                  </div>
                )}
                {!isUploading && selectedImageUrl && (
                  <div style={{ position: "relative", marginTop: "12px", maxWidth: "240px" }}>
                    {uploadType === "image" ? (
                      <img
                        src={selectedImageUrl}
                        alt="Upload preview"
                        style={{ width: "100%", borderRadius: "8px", border: "1px solid #eaeaea" }}
                      />
                    ) : (
                      <video
                        src={selectedImageUrl}
                        controls
                        style={{ width: "100%", borderRadius: "8px", border: "1px solid #eaeaea" }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImageUrl(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      style={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                        background: "#ff4d4f",
                        color: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: "20px",
                        height: "20px",
                        fontSize: "12px",
                        lineHeight: "20px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                      }}
                    >
                      &times;
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Post Area Bottom */}
            <div className="_feed_inner_text_area_bottom">
              <div className="_feed_inner_text_area_item">
                <div className="_feed_inner_text_area_bottom_photo _feed_common">
                  <button type="button" className="_feed_inner_text_area_bottom_photo_link" onClick={() => handlePhotoClick("image")}>
                    <span className="_feed_inner_text_area_bottom_photo_iamge _mar_img">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 20 20">
                        <path fill="#666" d="M13.916 0c3.109 0 5.18 2.429 5.18 5.914v8.17c0 3.486-2.072 5.916-5.18 5.916H5.999C2.89 20 .827 17.572.827 14.085v-8.17C.827 2.43 2.897 0 6 0h7.917zm0 1.504H5.999c-2.321 0-3.799 1.735-3.799 4.41v8.17c0 2.68 1.472 4.412 3.799 4.412h7.917c2.328 0 3.807-1.734 3.807-4.411v-8.17c0-2.678-1.478-4.411-3.807-4.411zm.65 8.68l.12.125 1.9 2.147a.803.803 0 01-.016 1.063.642.642 0 01-.894.058l-.076-.074-1.9-2.148a.806.806 0 00-1.205-.028l-.074.087-2.04 2.717c-.722.963-2.02 1.066-2.86.26l-.111-.116-.814-.91a.562.562 0 00-.793-.07l-.075.073-1.4 1.617a.645.645 0 01-.97.029.805.805 0 01-.09-.977l.064-.086 1.4-1.617c.736-.852 1.95-.897 2.734-.137l.114.12.81.905a.587.587 0 00.861.033l.07-.078 2.04-2.718c.81-1.08 2.27-1.19 3.205-.275zM6.831 4.64c1.265 0 2.292 1.125 2.292 2.51 0 1.386-1.027 2.511-2.292 2.511S4.54 8.537 4.54 7.152c0-1.386 1.026-2.51 2.291-2.51zm0 1.504c-.507 0-.918.451-.918 1.007 0 .555.411 1.006.918 1.006.507 0 .919-.451.919-1.006 0-.556-.412-1.007-.919-1.007z" />
                      </svg>
                    </span>
                    Photo
                  </button>
                </div>
                <div className="_feed_inner_text_area_bottom_video _feed_common">
                  <button type="button" className="_feed_inner_text_area_bottom_photo_link" onClick={() => handlePhotoClick("video")}>
                    <span className="_feed_inner_text_area_bottom_photo_iamge _mar_img">
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="24" fill="none" viewBox="0 0 22 24">
                        <path fill="#666" d="M11.485 4.5c2.213 0 3.753 1.534 3.917 3.784l2.418-1.082c1.047-.468 2.188.327 2.271 1.533l.005.141v6.64c0 1.237-1.103 2.093-2.155 1.72l-.121-.047-2.418-1.083c-.164 2.25-1.708 3.785-3.917 3.785H5.76c-2.343 0-3.932-1.72-3.932-4.188V8.688c0-2.47 1.589-4.188 3.932-4.188h5.726zm0 1.5H5.76C4.169 6 3.197 7.05 3.197 8.688v7.015c0 1.636.972 2.688 2.562 2.688h5.726c1.586 0 2.562-1.054 2.562-2.688v-.686-6.329c0-1.636-.973-2.688-2.562-2.688zM18.4 8.57l-.062.02-2.921 1.306v4.596l2.921 1.307c.165.073.343-.036.38-.215l.008-.07V8.876c0-.195-.16-.334-.326-.305z" />
                      </svg>
                    </span>
                    Video
                  </button>
                </div>
                <div className="_feed_inner_text_area_bottom_event _feed_common">
                  <button type="button" className="_feed_inner_text_area_bottom_photo_link">
                    <span className="_feed_inner_text_area_bottom_photo_iamge _mar_img">
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="24" fill="none" viewBox="0 0 22 24">
                        <path fill="#666" d="M14.371 2c.32 0 .585.262.627.603l.005.095v.788c2.598.195 4.188 2.033 4.18 5v8.488c0 3.145-1.786 5.026-4.656 5.026H7.395C4.53 22 2.74 20.087 2.74 16.904V8.486c0-2.966 1.596-4.804 4.187-5v-.788c0-.386.283-.698.633-.698.32 0 .584.262.626.603l.006.095v.771h5.546v-.771c0-.386.284-.698.633-.698zm3.546 8.283H4.004l.001 6.621c0 2.325 1.137 3.616 3.183 3.697l.207.004h7.132c2.184 0 3.39-1.271 3.39-3.63v-6.692zm-3.202 5.853c.349 0 .632.312.632.698 0 .353-.238.645-.546.691l-.086.006c-.357 0-.64-.312-.64-.697 0-.354.237-.645.546-.692l.094-.006zm-3.742 0c.35 0 .632.312.632.698 0 .353-.238.645-.546.691l-.086.006c-.357 0-.64-.312-.64-.697 0-.354.238-.645.546-.692l.094-.006zm-3.75 0c.35 0 .633.312.633.698 0 .353-.238.645-.547.691l-.093.006c-.35 0-.633-.312-.633-.697 0-.354.238-.645.547-.692l.094-.006zm7.492-3.615c.349 0 .632.312.632.697 0 .354-.238.645-.546.692l-.086.006c-.357 0-.64-.312-.64-.698 0-.353.237-.645.546-.691l.094-.006zm-3.742 0c.35 0 .632.312.632.697 0 .354-.238.645-.546.692l-.086.006c-.357 0-.64-.312-.64-.698 0-.353.238-.645.546-.691l.094-.006zm-3.75 0c.35 0 .633.312.633.697 0 .354-.238.645-.547.692l-.093.006c-.35 0-.633-.312-.633-.698 0-.353.238-.645.547-.691l.094-.006zm6.515-7.657H8.192v.895c0 .385-.283.698-.633.698-.32 0-.584-.263-.626-.603l-.006-.095v-.874c-1.886.173-2.922 1.422-2.922 3.6v.402h13.912v-.403c.007-2.181-1.024-3.427-2.914-3.599v.874c0 .385-.283.698-.632.698-.32 0-.585-.263-.627-.603l-.005-.095v-.895z" />
                      </svg>
                    </span>
                    Event
                  </button>
                </div>
                <div className="_feed_inner_text_area_bottom_article _feed_common">
                  <button type="button" className="_feed_inner_text_area_bottom_photo_link">
                    <span className="_feed_inner_text_area_bottom_photo_iamge _mar_img">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="20" fill="none" viewBox="0 0 18 20">
                        <path fill="#666" d="M12.49 0c2.92 0 4.665 1.92 4.693 5.132v9.659c0 3.257-1.75 5.209-4.693 5.209H5.434c-.377 0-.734-.032-1.07-.095l-.2-.041C2 19.371.74 17.555.74 14.791V5.209c0-.334.019-.654.055-.96C1.114 1.564 2.799 0 5.434 0h7.056zm-.008 1.457H5.434c-2.244 0-3.381 1.263-3.381 3.752v9.582c0 2.489 1.137 3.752 3.38 3.752h7.049c2.242 0 3.372-1.263 3.372-3.752V5.209c0-2.489-1.13-3.752-3.372-3.752zm-.239 12.053c.36 0 .652.324.652.724 0 .4-.292.724-.652.724H5.656c-.36 0-.652-.324-.652-.724 0-.4.293-.724.652-.724h6.587zm0-4.239a.643.643 0 01.632.339.806.806 0 010 .78.643.643 0 01-.632.339H5.656c-.334-.042-.587-.355-.587-.729s.253-.688.587-.729h6.587zM8.17 5.042c.335.041.588.355.588.729 0 .373-.253.687-.588.728H5.665c-.336-.041-.589-.355-.589-.728 0-.374.253-.688.589-.729H8.17z" />
                      </svg>
                    </span>
                    Article
                  </button>
                </div>
              </div>
              <div className="_feed_inner_text_area_btn">
                <button type="button" className="_feed_inner_text_area_btn_link" onClick={handleCreatePost}>
                  <svg className="_mar_img" xmlns="http://www.w3.org/2000/svg" width="14" height="13" fill="none" viewBox="0 0 14 13">
                    <path fill="#fff" fillRule="evenodd" d="M6.37 7.879l2.438 3.955a.335.335 0 00.34.162c.068-.01.23-.05.289-.247l3.049-10.297a.348.348 0 00-.09-.35.341.341 0 00-.34-.088L1.75 4.03a.34.34 0 00-.247.289.343.343 0 00.16.347L5.666 7.17 9.2 3.597a.5.5 0 01.712.703L6.37 7.88zM9.097 13c-.464 0-.89-.236-1.14-.641L5.372 8.165l-4.237-2.65a1.336 1.336 0 01-.622-1.331c.074-.536.441-.96.957-1.112L11.774.054a1.347 1.347 0 011.67 1.682l-3.05 10.296A1.332 1.332 0 019.098 13z" clipRule="evenodd" />
                  </svg>
                  <span>Post</span>
                </button>
              </div>
            </div>

            {/* Mobile Post Area Bottom */}
            <div className="_feed_inner_text_area_bottom_mobile">
              <div className="_feed_inner_text_mobile">
                <div className="_feed_inner_text_area_item">
                  <div className="_feed_inner_text_area_bottom_photo _feed_common">
                    <button type="button" className="_feed_inner_text_area_bottom_photo_link" onClick={() => handlePhotoClick("image")}>
                      <span className="_feed_inner_text_area_bottom_photo_iamge _mar_img">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 20 20">
                          <path fill="#666" d="M13.916 0c3.109 0 5.18 2.429 5.18 5.914v8.17c0 3.486-2.072 5.916-5.18 5.916H5.999C2.89 20 .827 17.572.827 14.085v-8.17C.827 2.43 2.897 0 6 0h7.917zm0 1.504H5.999c-2.321 0-3.799 1.735-3.799 4.41v8.17c0 2.68 1.472 4.412 3.799 4.412h7.917c2.328 0 3.807-1.734 3.807-4.411v-8.17c0-2.678-1.478-4.411-3.807-4.411zm.65 8.68l.12.125 1.9 2.147a.803.803 0 01-.016 1.063.642.642 0 01-.894.058l-.076-.074-1.9-2.148a.806.806 0 00-1.205-.028l-.074.087-2.04 2.717c-.722.963-2.02 1.066-2.86.26l-.111-.116-.814-.91a.562.562 0 00-.793-.07l-.075.073-1.4 1.617a.645.645 0 01-.97.029.805.805 0 01-.09-.977l.064-.086 1.4-1.617c.736-.852 1.95-.897 2.734-.137l.114.12.81.905a.587.587 0 00.861.033l.07-.078 2.04-2.718c.81-1.08 2.27-1.19 3.205-.275zM6.831 4.64c1.265 0 2.292 1.125 2.292 2.51 0 1.386-1.027 2.511-2.292 2.511S4.54 8.537 4.54 7.152c0-1.386 1.026-2.51 2.291-2.51zm0 1.504c-.507 0-.918.451-.918 1.007 0 .555.411 1.006.918 1.006.507 0 .919-.451.919-1.006 0-.556-.412-1.007-.919-1.007z" />
                        </svg>
                      </span>
                    </button>
                  </div>
                  <div className="_feed_inner_text_area_bottom_video _feed_common">
                    <button type="button" className="_feed_inner_text_area_bottom_photo_link" onClick={() => handlePhotoClick("video")}>
                      <span className="_feed_inner_text_area_bottom_photo_iamge _mar_img">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="24" fill="none" viewBox="0 0 22 24">
                          <path fill="#666" d="M11.485 4.5c2.213 0 3.753 1.534 3.917 3.784l2.418-1.082c1.047-.468 2.188.327 2.271 1.533l.005.141v6.64c0 1.237-1.103 2.093-2.155 1.72l-.121-.047-2.418-1.083c-.164 2.25-1.708 3.785-3.917 3.785H5.76c-2.343 0-3.932-1.72-3.932-4.188V8.688c0-2.47 1.589-4.188 3.932-4.188h5.726zm0 1.5H5.76C4.169 6 3.197 7.05 3.197 8.688v7.015c0 1.636.972 2.688 2.562 2.688h5.726c1.586 0 2.562-1.054 2.562-2.688v-.686-6.329c0-1.636-.973-2.688-2.562-2.688zM18.4 8.57l-.062.02-2.921 1.306v4.596l2.921 1.307c.165.073.343-.036.38-.215l.008-.07V8.876c0-.195-.16-.334-.326-.305z" />
                        </svg>
                      </span>
                    </button>
                  </div>
                  <div className="_feed_inner_text_area_bottom_event _feed_common">
                    <button type="button" className="_feed_inner_text_area_bottom_photo_link">
                      <span className="_feed_inner_text_area_bottom_photo_iamge _mar_img">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="24" fill="none" viewBox="0 0 22 24">
                          <path fill="#666" d="M14.371 2c.32 0 .585.262.627.603l.005.095v.788c2.598.195 4.188 2.033 4.18 5v8.488c0 3.145-1.786 5.026-4.656 5.026H7.395C4.53 22 2.74 20.087 2.74 16.904V8.486c0-2.966 1.596-4.804 4.187-5v-.788c0-.386.283-.698.633-.698.32 0 .584.262.626.603l.006.095v.771h5.546v-.771c0-.386.284-.698.633-.698zm3.546 8.283H4.004l.001 6.621c0 2.325 1.137 3.616 3.183 3.697l.207.004h7.132c2.184 0 3.39-1.271 3.39-3.63v-6.692zm-3.202 5.853c.349 0 .632.312.632.698 0 .353-.238.645-.546.691l-.086.006c-.357 0-.64-.312-.64-.697 0-.354.237-.645.546-.692l.094-.006zm-3.742 0c.35 0 .632.312.632.698 0 .353-.238.645-.546.691l-.086.006c-.357 0-.64-.312-.64-.697 0-.354.238-.645.546-.692l.094-.006zm-3.75 0c.35 0 .633.312.633.698 0 .353-.238.645-.547.691l-.093.006c-.35 0-.633-.312-.633-.697 0-.354.238-.645.547-.692l.094-.006zm7.492-3.615c.349 0 .632.312.632.697 0 .354-.238.645-.546.692l-.086.006c-.357 0-.64-.312-.64-.698 0-.353.237-.645.546-.691l.094-.006zm-3.742 0c.35 0 .632.312.632.697 0 .354-.238.645-.546.692l-.086.006c-.357 0-.64-.312-.64-.698 0-.353.238-.645.546-.691l.094-.006zm-3.75 0c.35 0 .633.312.633.697 0 .354-.238.645-.547.692l-.093.006c-.35 0-.633-.312-.633-.698 0-.353.238-.645.547-.691l.094-.006zm6.515-7.657H8.192v.895c0 .385-.283.698-.633.698-.32 0-.584-.263-.626-.603l-.006-.095v-.874c-1.886.173-2.922 1.422-2.922 3.6v.402h13.912v-.403c.007-2.181-1.024-3.427-2.914-3.599v.874c0 .385-.283.698-.632.698-.32 0-.585-.263-.627-.603l-.005-.095v-.895z" />
                        </svg>
                      </span>
                    </button>
                  </div>
                  <div className="_feed_inner_text_area_bottom_article _feed_common">
                    <button type="button" className="_feed_inner_text_area_bottom_photo_link">
                      <span className="_feed_inner_text_area_bottom_photo_iamge _mar_img">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="20" fill="none" viewBox="0 0 18 20">
                          <path fill="#666" d="M12.49 0c2.92 0 4.665 1.92 4.693 5.132v9.659c0 3.257-1.75 5.209-4.693 5.209H5.434c-.377 0-.734-.032-1.07-.095l-.2-.041C2 19.371.74 17.555.74 14.791V5.209c0-.334.019-.654.055-.96C1.114 1.564 2.799 0 5.434 0h7.056zm-.008 1.457H5.434c-2.244 0-3.381 1.263-3.381 3.752v9.582c0 2.489 1.137 3.752 3.38 3.752h7.049c2.242 0 3.372-1.263 3.372-3.752V5.209c0-2.489-1.13-3.752-3.372-3.752zm-.239 12.053c.36 0 .652.324.652.724 0 .4-.292.724-.652.724H5.656c-.36 0-.652-.324-.652-.724 0-.4.293-.724.652-.724h6.587zm0-4.239a.643.643 0 01.632.339.806.806 0 010 .78.643.643 0 01-.632.339H5.656c-.334-.042-.587-.355-.587-.729s.253-.688.587-.729h6.587zM8.17 5.042c.335.041.588.355.588.729 0 .373-.253.687-.588.728H5.665c-.336-.041-.589-.355-.589-.728 0-.374.253-.688.589-.729H8.17z" />
                        </svg>
                      </span>
                    </button>
                  </div>
                </div>
                <div className="_feed_inner_text_area_btn">
                  <button type="button" className="_feed_inner_text_area_btn_link" onClick={handleCreatePost}>
                    <svg className="_mar_img" xmlns="http://www.w3.org/2000/svg" width="14" height="13" fill="none" viewBox="0 0 14 13">
                      <path fill="#fff" fillRule="evenodd" d="M6.37 7.879l2.438 3.955a.335.335 0 00.34.162c.068-.01.23-.05.289-.247l3.049-10.297a.348.348 0 00-.09-.35.341.341 0 00-.34-.088L1.75 4.03a.34.34 0 00-.247.289.343.343 0 00.16.347L5.666 7.17 9.2 3.597a.5.5 0 01.712.703L6.37 7.88zM9.097 13c-.464 0-.89-.236-1.14-.641L5.372 8.165l-4.237-2.65a1.336 1.336 0 01-.622-1.331c.074-.536.441-.96.957-1.112L11.774.054a1.347 1.347 0 011.67 1.682l-3.05 10.296A1.332 1.332 0 019.098 13z" clipRule="evenodd" />
                    </svg> <span>Post</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Feed Posts */}
          {isLoading && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#666" }}>
              <div style={{ display: "inline-block", width: "30px", height: "30px", border: "3px solid #ccc", borderTopColor: "#377DFF", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
              <p style={{ marginTop: "12px", fontSize: "14px" }}>Loading feed posts...</p>
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}
          {!isLoading && posts.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 24px", color: "#666", background: "white", borderRadius: "6px" }}>
              <p style={{ margin: 0, fontSize: "15px" }}>No posts found. Be the first to share something!</p>
            </div>
          )}
          {posts.map((post, index) => {
            const isTriggerPost = posts.length >= 6 ? index === posts.length - 6 : index === posts.length - 1;
            return (
              <div
                ref={isTriggerPost ? loadMoreRef : undefined}
                className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16"
                key={post.id}
              >
                <div className="_feed_inner_timeline_content _padd_r24 _padd_l24">
                  <div className="_feed_inner_timeline_post_top">
                    <div className="_feed_inner_timeline_post_box">
                      <div className="_feed_inner_timeline_post_box_image">
                        <img src={post.authorAvatar} alt="" className="_post_img" />
                      </div>
                      <div className="_feed_inner_timeline_post_box_txt">
                        <h4 className="_feed_inner_timeline_post_box_title">{post.authorName}</h4>
                        <p className="_feed_inner_timeline_post_box_para">
                          {post.timeAgo} . <a href="#">{post.visibility}</a>
                        </p>
                      </div>
                    </div>
                    <div className="_feed_inner_timeline_post_box_dropdown" style={{ position: "relative" }}>
                      <div className="_feed_timeline_post_dropdown">
                        <button
                          type="button"
                          className="_feed_timeline_post_dropdown_link"
                          onClick={() => handlePostDropdownToggle(post.id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="4" height="17" fill="none" viewBox="0 0 4 17">
                            <circle cx="2" cy="2" r="2" fill="#C4C4C4" />
                            <circle cx="2" cy="8" r="2" fill="#C4C4C4" />
                            <circle cx="2" cy="15" r="2" fill="#C4C4C4" />
                          </svg>
                        </button>
                      </div>
                      {/* Dropdown Menu */}
                      <div className={`_feed_timeline_dropdown _timeline_dropdown ${post.showDropdown ? "show" : ""}`}>
                        <ul className="_feed_timeline_dropdown_list">
                          <li className="_feed_timeline_dropdown_item">
                            <a href="#" className="_feed_timeline_dropdown_link">
                              <span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18">
                                  <path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M14.25 15.75L9 12l-5.25 3.75v-12a1.5 1.5 0 011.5-1.5h7.5a1.5 1.5 0 011.5 1.5v12z" />
                                </svg>
                              </span>
                              Save Post
                            </a>
                          </li>
                          <li className="_feed_timeline_dropdown_item">
                            <a href="#" className="_feed_timeline_dropdown_link">
                              <span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="22" fill="none" viewBox="0 0 20 22">
                                  <path fill="#377DFF" fillRule="evenodd" d="M7.547 19.55c.533.59 1.218.915 1.93.915.714 0 1.403-.324 1.938-.916a.777.777 0 011.09-.056c.318.284.344.77.058 1.084-.832.917-1.927 1.423-3.086 1.423h-.002c-1.155-.001-2.248-.506-3.077-1.424a.762.762 0 01.057-1.083.774.774 0 011.092.057zM9.527 0c4.58 0 7.657 3.543 7.657 6.85 0 1.702.436 2.424.899 3.19.457.754.976 1.612.976 3.233-.36 4.14-4.713 4.478-9.531 4.478-4.818 0-9.172-.337-9.528-4.413-.003-1.686.515-2.544.973-3.299l.161-.27c.398-.679.737-1.417.737-2.918C1.871 3.543 4.948 0 9.528 0zm0 1.535c-3.6 0-6.11 2.802-6.11 5.316 0 2.127-.595 3.11-1.12 3.978-.422.697-.755 1.247-.755 2.444.173 1.93 1.455 2.944 7.986 2.944 6.494 0 7.817-1.06 7.988-3.01-.003-1.13-.336-1.681-.757-2.378-.526-.868-1.12-1.851-1.12-3.978 0-2.514-2.51-5.316-6.111-5.316z" clipRule="evenodd" />
                                </svg>
                              </span>
                              Turn On Notification
                            </a>
                          </li>
                          <li className="_feed_timeline_dropdown_item">
                            <button
                              type="button"
                              className="_feed_timeline_dropdown_link"
                              style={{ background: "none", border: "none", width: "100%", textAlign: "left", display: "flex", alignItems: "center" }}
                              onClick={() => handleDeletePost(post.id)}
                            >
                              <span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18">
                                  <path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M2.25 4.5h13.5M6 4.5V3a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0112 3v1.5m2.25 0V15a1.5 1.5 0 01-1.5 1.5h-7.5a1.5 1.5 0 01-1.5-1.5V4.5h10.5zM7.5 8.25v4.5M10.5 8.25v4.5" />
                                </svg>
                              </span>
                              Delete Post
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <h4 className="_feed_inner_timeline_post_title">{post.title}</h4>
                  {post.image && (
                    <div className="_feed_inner_timeline_image">
                      <img src={post.image} alt="" className="_time_img" />
                    </div>
                  )}
                </div>
                <div className="_feed_inner_timeline_total_reacts _padd_r24 _padd_l24 _mar_b26">
                  <div className="_feed_inner_timeline_total_reacts_image">
                    {post.recentLikers && post.recentLikers.length > 0 ? (
                      post.recentLikers.slice(0, 5).map((liker, lIndex) => (
                        <img
                          key={liker.id}
                          src={liker.pic || "/assets/images/comment_img.png"}
                          alt={liker.name}
                          className={lIndex === 0 ? "_react_img1" : "_react_img"}
                          title={liker.name}
                        />
                      ))
                    ) : (
                      <img src="/assets/images/react_img1.png" alt="React" className="_react_img1" />
                    )}
                    <p className="_feed_inner_timeline_total_reacts_para">{post.reacts}</p>
                  </div>
                  <div className="_feed_inner_timeline_total_reacts_txt">
                    <p
                      className="_feed_inner_timeline_total_reacts_para1"
                      onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <span>{post.commentsCount}</span> Comment
                    </p>
                    <p className="_feed_inner_timeline_total_reacts_para2">
                      <span>{post.sharesCount}</span> Share
                    </p>
                  </div>
                </div>
                <div className="_feed_inner_timeline_reaction">
                  <button
                    className={`_feed_inner_timeline_reaction_emoji _feed_reaction ${post.hasLiked ? "_feed_reaction_active" : ""
                      }`}
                    onClick={() => handleReactToggle(post.id)}
                  >
                    <span className="_feed_inner_timeline_reaction_link">
                      <span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={post.hasLiked ? "#377DFF" : "none"} stroke={post.hasLiked ? "#377DFF" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "8px" }}>
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                        </svg>
                        Like
                      </span>
                    </span>
                  </button>
                  <button
                    className="_feed_inner_timeline_reaction_comment _feed_reaction"
                    onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                  >
                    <span className="_feed_inner_timeline_reaction_link">
                      <span>
                        <svg className="_reaction_svg" xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="none" viewBox="0 0 21 21" style={{ marginRight: "8px" }}>
                          <path stroke="#000" d="M1 10.5c0-.464 0-.696.009-.893A9 9 0 019.607 1.01C9.804 1 10.036 1 10.5 1v0c.464 0 .696 0 .893.009a9 9 0 018.598 8.598c.009.197.009.429.009.893v6.046c0 1.36 0 2.041-.317 2.535a2 2 0 01-.602.602c-.494.317-1.174.317-2.535.317H10.5c-.464 0-.696 0-.893-.009a9 9 0 01-8.598-8.598C1 11.196 1 10.964 1 10.5v0z" />
                          <path stroke="#000" strokeLinecap="round" strokeLinejoin="round" d="M6.938 9.313h7.125M10.5 14.063h3.563" />
                        </svg>
                        Comment
                      </span>
                    </span>
                  </button>
                  <button className="_feed_inner_timeline_reaction_share _feed_reaction">
                    <span className="_feed_inner_timeline_reaction_link">
                      <span>
                        <svg className="_reaction_svg" xmlns="http://www.w3.org/2000/svg" width="24" height="21" fill="none" viewBox="0 0 24 21" style={{ marginRight: "8px" }}>
                          <path stroke="#000" strokeLinejoin="round" d="M23 10.5L12.917 1v5.429C3.267 6.429 1 13.258 1 20c2.785-3.52 5.248-5.429 11.917-5.429V20L23 10.5z" />
                        </svg>
                        Share
                      </span>
                    </span>
                  </button>
                </div>

                {/* Comments Section */}
                <div className="_feed_inner_timeline_cooment_area" style={{ display: activeCommentPostId === post.id ? "block" : "block" }}>
                  <div className="_feed_inner_comment_box">
                    <form className="_feed_inner_comment_box_form" onSubmit={(e) => handleAddComment(post.id, e)}>
                      <div className="_feed_inner_comment_box_content">
                        <div className="_feed_inner_comment_box_content_image">
                          <img src="/assets/images/comment_img.png" alt="" className="_comment_img" />
                        </div>
                        <div className="_feed_inner_comment_box_content_txt">
                          <textarea
                            className="form-control _comment_textarea"
                            placeholder="Write a comment"
                            value={commentInputs[post.id] || ""}
                            onChange={(e) => handleCommentInputChange(post.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment(post.id, e);
                              }
                            }}
                          ></textarea>
                        </div>
                      </div>
                      <div className="_feed_inner_comment_box_icon">
                        <button className="_feed_inner_comment_box_icon_btn" type="button">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
                            <path fill="#000" fillOpacity=".46" fillRule="evenodd" d="M13.167 6.534a.5.5 0 01.5.5c0 3.061-2.35 5.582-5.333 5.837V14.5a.5.5 0 01-1 0v-1.629C4.35 12.616 2 10.096 2 7.034a.5.5 0 011 0c0 2.679 2.168 4.859 4.833 4.859 2.666 0 4.834-2.18 4.834-4.86a.5.5 0 01.5-.5zM7.833.667a3.218 3.218 0 013.208 3.22v3.126c0 1.775-1.439 3.22-3.208 3.22a3.218 3.218 0 01-3.208-3.22V3.887c0-1.776 1.44-3.22 3.208-3.22zm0 1a2.217 2.217 0 00-2.208 2.22v3.126c0 1.223.991 2.22 2.208 2.22a2.217 2.217 0 002.208-2.22V3.887c0-1.224-.99-2.22-2.208-2.22z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button className="_feed_inner_comment_box_icon_btn" type="submit">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
                            <path fill="#000" fillOpacity=".46" fillRule="evenodd" d="M10.867 1.333c2.257 0 3.774 1.581 3.774 3.933v5.435c0 2.352-1.517 3.932-3.774 3.932H5.101c-2.254 0-3.767-1.58-3.767-3.932V5.266c0-2.352 1.513-3.933 3.767-3.933h5.766zm0 1H5.101c-1.681 0-2.767 1.152-2.767 2.933v5.435c0 1.782 1.086 2.932 2.767 2.932h5.766c1.685 0 2.774-1.15 2.774-2.932V5.266c0-1.781-1.089-2.933-2.774-2.933zm.426 5.733l.017.015.013.013.009.008.037.037c.12.12.453.46 1.443 1.477a.5.5 0 11-.716.697S10.73 8.91 10.633 8.816a.614.614 0 00-.433-.118.622.622 0 00-.421.225c-1.55 1.88-1.568 1.897-1.594 1.922a1.456 1.456 0 01-2.057-.021s-.62-.63-.63-.642c-.155-.143-.43-.134-.594.04l-1.02 1.076a.498.498 0 01-.707.018.499.499 0 01-.018-.706l1.018-1.075c.54-.573 1.45-.6 2.025-.06l.639.647c.178.18.467.184.646.008l1.519-1.843a1.618 1.618 0 011.098-.584c.433-.038.854.088 1.19.363zM5.706 4.42c.921 0 1.67.75 1.67 1.67 0 .92-.75 1.67-1.67 1.67-.92 0-1.67-.75-1.67-1.67 0-.921.75-1.67 1.67-1.67zm0 1a.67.67 0 10.001 1.34.67.67 0 00-.002-1.34z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </form>
                  </div>
                  {post.comments.length > 0 && (
                    <div className="_timline_comment_main">
                      <div className="_previous_comment">
                        <button type="button" className="_previous_comment_txt">
                          View previous comments
                        </button>
                      </div>
                      {post.comments.map((comment) => (
                        <div className="_comment_main" key={comment.id}>
                          <div className="_comment_image">
                            <a href="#" className="_comment_image_link">
                              <img src={comment.avatar} alt="" className="_comment_img1" />
                            </a>
                          </div>
                          <div className="_comment_area">
                            <div className="_comment_details">
                              <div className="_comment_details_top">
                                <div className="_comment_name">
                                  <a href="#">
                                    <h4 className="_comment_name_title">{comment.name}</h4>
                                  </a>
                                </div>
                              </div>
                              <div className="_comment_status">
                                <p className="_comment_status_text">
                                  <span>{comment.text}</span>
                                </p>
                              </div>
                              <div className="_total_reactions">
                                <div className="_total_react">
                                  <span className="_reaction_like" style={{ marginRight: "6px" }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-thumbs-up">
                                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                                    </svg>
                                  </span>
                                  <span className="_reaction_heart">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-heart">
                                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                    </svg>
                                  </span>
                                </div>
                                <span className="_total">{comment.likes}</span>
                              </div>
                              <div className="_comment_reply">
                                <div className="_comment_reply_num">
                                  <ul className="_comment_reply_list">
                                    <li><span>Like.</span></li>
                                    <li>
                                      <span
                                        onClick={() => setActiveReplyCommentId(activeReplyCommentId === comment.id ? null : comment.id)}
                                        style={{ cursor: "pointer" }}
                                      >
                                        Reply.
                                      </span>
                                    </li>
                                    <li><span>Share</span></li>
                                    <li><span className="_time_link">.{comment.time}</span></li>
                                  </ul>
                                </div>
                                {/* Reply Form */}
                                {activeReplyCommentId === comment.id && (
                                  <div style={{ marginTop: "12px", paddingLeft: "8px", display: "flex", width: "100%" }}>
                                    <form
                                      onSubmit={(e) => handleAddReply(post.id, comment.id, e)}
                                      style={{ display: "flex", gap: "8px", alignItems: "center", width: "100%" }}
                                    >
                                      <img
                                        src="/assets/images/comment_img.png"
                                        alt=""
                                        style={{ width: "24px", height: "24px", borderRadius: "50%" }}
                                      />
                                      <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Write a reply..."
                                        value={replyInputs[comment.id] || ""}
                                        onChange={(e) => setReplyInputs({ ...replyInputs, [comment.id]: e.target.value })}
                                        style={{ fontSize: "13px", height: "30px", borderRadius: "16px", flex: 1 }}
                                      />
                                      <button
                                        type="submit"
                                        style={{
                                          background: "#377DFF",
                                          color: "white",
                                          border: "none",
                                          borderRadius: "15px",
                                          padding: "4px 12px",
                                          fontSize: "12px",
                                          cursor: "pointer",
                                          height: "30px"
                                        }}
                                      >
                                        Send
                                      </button>
                                    </form>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Infinite Scroll trigger element */}
          <div ref={loadMoreRef} style={{ height: "60px", margin: "24px 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isFetchingNextPage && (
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#666", fontSize: "14px" }}>
                <div style={{ display: "inline-block", width: "20px", height: "20px", border: "2px solid #ccc", borderTopColor: "#377DFF", borderRadius: "50%", marginRight: "10px", animation: "spin 0.8s linear infinite" }}></div>
                <span>Loading more posts...</span>
                <style>{`
                  @keyframes spin {
                    to { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
