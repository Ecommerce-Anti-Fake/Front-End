import { useCallback, useEffect, useState } from "react";
import CommunityPost from "../../components/community/communityPost";
import CreatePostBox from "../../components/community/createPostBox";
import type { SocialPost } from "../../type/community";
import { getSocialPosts } from "../../services/community.api";
import "../../css/components/dataSkeleton.css";

export default function DiscussionFeed() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    try {
      const data = await getSocialPosts(1, 20);
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void fetchPosts();
    });
    return () => {
      active = false;
    };
  }, [fetchPosts]);

  if (loading) return <div className="data-skeleton data-skeleton-comments" role="status" aria-label="Đang tải bài viết">{Array.from({ length: 4 }, (_, i) => <div className="data-skeleton-row" key={i}><span className="data-skeleton-thumbnail" /><span className="data-skeleton-lines"><span /><span /><span /></span></div>)}</div>;

  return (
    <>
      <CreatePostBox onCreated={fetchPosts} />

      {posts.map((post) => (
        <CommunityPost key={post.id} post={post} />
      ))}
    </>
  );
}
