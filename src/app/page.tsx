'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface CommentItem {
  id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  author_name: string;
  likes: number;
  dislikes: number;
  created_at: string;
}

const EMOJI_OPTIONS = [
  '🤠', '🍕', '🚀', '⚡', '🦊', '🔥', '👑', '🐱', 
  '🐶', '🎮', '💡', '💎', '🎯', '🦁', '🧠', '🛡️'
];

function ClientDate({ dateString }: { dateString: string }) {
  const [dateText, setDateText] = useState('');

  useEffect(() => {
    if (dateString) {
      try {
        const d = new Date(dateString);
        setDateText(d.toLocaleDateString('pt-BR'));
      } catch {
        setDateText('');
      }
    }
  }, [dateString]);

  if (!dateText) {
    return <span className="opacity-0">--/--/----</span>;
  }

  return <span>{dateText}</span>;
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [savingEmoji, setSavingEmoji] = useState(false);

  const [communities, setCommunities] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [hiddenReplies, setHiddenReplies] = useState<Record<string, boolean>>({});

  // Resposta
  const [replyTarget, setReplyTarget] = useState<{
    postId: string;
    commentId: string | null;
    replyToName?: string;
  } | null>(null);

  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edicao de Topico (Post)
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostTitle, setEditPostTitle] = useState('');
  const [editPostContent, setEditPostContent] = useState('');

  // Edicao de Comentario / Sub-resposta
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');

  const [postVotes, setPostVotes] = useState<Record<string, 'like' | 'dislike'>>({});
  const [commentVotes, setCommentVotes] = useState<Record<string, 'like' | 'dislike'>>({});

  // 1. Carrega sessao do utilizador conectado
  useEffect(() => {
    async function getUserSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setCurrentProfile(profile);
        } else {
          setCurrentProfile({
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0],
            avatar_url: '👤',
          });
        }
      }
    }

    getUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setCurrentProfile(
          profile || {
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0],
            avatar_url: '👤',
          }
        );
      } else {
        setCurrentUser(null);
        setCurrentProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 2. Carrega votos locais apos recarregamento
  useEffect(() => {
    try {
      const savedPostVotes = localStorage.getItem('repot_post_votes');
      const savedCommentVotes = localStorage.getItem('repot_comment_votes');
      if (savedPostVotes) setPostVotes(JSON.parse(savedPostVotes));
      if (savedCommentVotes) setCommentVotes(JSON.parse(savedCommentVotes));
    } catch (_) {}
  }, []);

  const saveVoteLocally = (type: 'post' | 'comment', id: string, vote: 'like' | 'dislike') => {
    if (type === 'post') {
      setPostVotes((prev) => {
        const updated = { ...prev, [id]: vote };
        try {
          localStorage.setItem('repot_post_votes', JSON.stringify(updated));
        } catch (_) {}
        return updated;
      });
    } else {
      setCommentVotes((prev) => {
        const updated = { ...prev, [id]: vote };
        try {
          localStorage.setItem('repot_comment_votes', JSON.stringify(updated));
        } catch (_) {}
        return updated;
      });
    }
  };

  // 3. Carrega o feed
  const loadFeed = useCallback(async () => {
    try {
      const { data: commData } = await supabase.from('communities').select('*');

      const { data: postsData, error: postsErr } = await supabase
        .from('posts')
        .select('id, title, content, author_name, created_at, likes, dislikes, community_id, communities(id, name, slug)')
        .order('created_at', { ascending: false });

      if (postsErr) {
        console.error('Erro ao obter posts:', postsErr);
        return;
      }

      const { data: commentsData, error: commErr } = await supabase
        .from('comments')
        .select('id, post_id, parent_id, content, author_name, likes, dislikes, created_at')
        .order('created_at', { ascending: true });

      if (commErr) {
        console.error('Erro ao obter comentarios:', commErr);
      }

      const mergedPosts = (postsData || []).map((p) => ({
        ...p,
        likes: Number(p.likes) || 0,
        dislikes: Number(p.dislikes) || 0,
        comments: (commentsData || [])
          .filter((c) => c.post_id === p.id)
          .map((c) => ({
            ...c,
            likes: Number(c.likes) || 0,
            dislikes: Number(c.dislikes) || 0,
          })),
      }));

      setCommunities(commData || []);
      setPosts(mergedPosts);
    } catch (err) {
      console.error('Erro geral ao carregar feed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const isAuthorLoggedIn = (authorName: string) => {
    if (!currentUser || !currentProfile?.username) return false;
    const cleanAuthor = (authorName || '').trim().replace(/^@/, '').toLowerCase();
    const cleanCurrent = (currentProfile.username || '').trim().replace(/^@/, '').toLowerCase();
    return cleanAuthor !== '' && cleanAuthor === cleanCurrent;
  };

  // EXCLUIR POST
  async function handleDeletePost(postId: string) {
    if (!confirm('Deseja realmente excluir este topico e todas as suas respostas?')) return;

    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (!error) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } else {
      alert('Erro ao excluir publicacao.');
    }
  }

  // SALVAR EDICAO DO POST
  async function handleSaveEditPost(postId: string) {
    if (!editPostTitle.trim() || !editPostContent.trim()) return;

    const { error } = await supabase
      .from('posts')
      .update({ title: editPostTitle.trim(), content: editPostContent.trim() })
      .eq('id', postId);

    if (!error) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, title: editPostTitle.trim(), content: editPostContent.trim() } : p
        )
      );
      setEditingPostId(null);
    } else {
      alert('Erro ao salvar alteracoes no topico.');
    }
  }

  // EXCLUIR COMENTARIO / SUB-RESPOSTA
  async function handleDeleteComment(postId: string, commentId: string) {
    if (!confirm('Deseja realmente excluir esta resposta?')) return;

    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (!error) {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          return {
            ...p,
            comments: p.comments.filter((c: CommentItem) => c.id !== commentId && c.parent_id !== commentId),
          };
        })
      );
    } else {
      alert('Erro ao excluir resposta.');
    }
  }

  // SALVAR EDICAO DO COMENTARIO
  async function handleSaveEditComment(postId: string, commentId: string) {
    if (!editCommentContent.trim()) return;

    const { error } = await supabase
      .from('comments')
      .update({ content: editCommentContent.trim() })
      .eq('id', commentId);

    if (!error) {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          return {
            ...p,
            comments: p.comments.map((c: CommentItem) =>
              c.id === commentId ? { ...c, content: editCommentContent.trim() } : c
            ),
          };
        })
      );
      setEditingCommentId(null);
    } else {
      alert('Erro ao salvar resposta.');
    }
  }

  async function handleSelectEmoji(emoji: string) {
    if (!currentUser) return;
    setSavingEmoji(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: emoji })
        .eq('id', currentUser.id);

      if (!error) {
        setCurrentProfile((prev: any) => ({ ...prev, avatar_url: emoji }));
        setShowEmojiPicker(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEmoji(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setCurrentProfile(null);
    setShowEmojiPicker(false);
  }

  const toggleRepliesVisibility = (commentId: string) => {
    setHiddenReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (selectedCommunity && post.community_id !== selectedCommunity) {
        return false;
      }
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();
      const matchesTitle = post.title?.toLowerCase().includes(term);
      const matchesContent = post.content?.toLowerCase().includes(term);
      const matchesAuthor = post.author_name?.toLowerCase().includes(term);
      const matchesCommunity = post.communities?.name?.toLowerCase().includes(term);
      const matchesComments = (post.comments || []).some(
        (c: CommentItem) =>
          c.content?.toLowerCase().includes(term) ||
          c.author_name?.toLowerCase().includes(term)
      );

      return matchesTitle || matchesContent || matchesAuthor || matchesCommunity || matchesComments;
    });
  }, [posts, searchTerm, selectedCommunity]);

  async function handlePostLike(postId: string) {
    if (postVotes[postId] === 'like') return;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const newLikes = (post.likes || 0) + 1;
    const newDislikes = postVotes[postId] === 'dislike' ? Math.max(0, (post.dislikes || 0) - 1) : (post.dislikes || 0);

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes: newLikes, dislikes: newDislikes } : p))
    );
    saveVoteLocally('post', postId, 'like');
    await supabase.from('posts').update({ likes: newLikes, dislikes: newDislikes }).eq('id', postId);
  }

  async function handlePostDislike(postId: string) {
    if (postVotes[postId] === 'dislike') return;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const newDislikes = (post.dislikes || 0) + 1;
    const newLikes = postVotes[postId] === 'like' ? Math.max(0, (post.likes || 0) - 1) : (post.likes || 0);

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes: newLikes, dislikes: newDislikes } : p))
    );
    saveVoteLocally('post', postId, 'dislike');
    await supabase.from('posts').update({ likes: newLikes, dislikes: newDislikes }).eq('id', postId);
  }

  async function handleCommentVote(commentId: string, type: 'like' | 'dislike') {
    if (commentVotes[commentId] === type) return;

    let currentLikes = 0;
    let currentDislikes = 0;

    posts.forEach((p) => {
      p.comments?.forEach((c: CommentItem) => {
        if (c.id === commentId) {
          currentLikes = Number(c.likes) || 0;
          currentDislikes = Number(c.dislikes) || 0;
        }
      });
    });

    let finalLikes = currentLikes;
    let finalDislikes = currentDislikes;

    if (type === 'like') {
      finalLikes += 1;
      if (commentVotes[commentId] === 'dislike') {
        finalDislikes = Math.max(0, finalDislikes - 1);
      }
    } else {
      finalDislikes += 1;
      if (commentVotes[commentId] === 'like') {
        finalLikes = Math.max(0, finalLikes - 1);
      }
    }

    setPosts((prevPosts) =>
      prevPosts.map((p) => ({
        ...p,
        comments: (p.comments || []).map((c: CommentItem) =>
          c.id === commentId ? { ...c, likes: finalLikes, dislikes: finalDislikes } : c
        ),
      }))
    );

    saveVoteLocally('comment', commentId, type);
    await supabase.from('comments').update({ likes: finalLikes, dislikes: finalDislikes }).eq('id', commentId);
  }

  async function handleShare(urlParam: string, title: string) {
    const shareUrl = `${window.location.origin}${urlParam}`;
    if (typeof window !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch (_) {}
    }
    if (typeof window !== 'undefined') {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(urlParam);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  async function handleSendReply(postId: string, parentCommentId: string | null = null) {
    if (!commentText.trim()) return;

    const authorNameToUse = currentProfile?.username
      ? `@${currentProfile.username}`
      : commentAuthor.trim()
      ? commentAuthor.trim()
      : 'Anônimo';

    setSubmittingComment(true);
    const { error } = await supabase.from('comments').insert([
      {
        post_id: postId,
        parent_id: parentCommentId,
        content: commentText.trim(),
        author_name: authorNameToUse,
        likes: 0,
        dislikes: 0,
      },
    ]);

    setSubmittingComment(false);

    if (!error) {
      setCommentText('');
      setCommentAuthor('');
      setReplyTarget(null);
      if (parentCommentId) {
        setHiddenReplies((prev) => ({ ...prev, [parentCommentId]: false }));
      }
      loadFeed();
    } else {
      alert('Erro ao enviar resposta.');
    }
  }

  function Avatar({
    name,
    customEmoji,
    size = 'w-9 h-9',
    fontSize = 'text-sm'
  }: {
    name: string;
    customEmoji?: string | null;
    size?: string;
    fontSize?: string;
  }) {
    const emojiToDisplay =
      customEmoji ||
      (currentUser && currentProfile?.username && name?.includes(currentProfile.username)
        ? currentProfile.avatar_url
        : null);

    if (emojiToDisplay) {
      return (
        <div
          className={`${size} bg-neutral-800/90 border border-neutral-700/80 rounded-full flex items-center justify-center ${fontSize} shrink-0 select-none shadow-sm`}
        >
          {emojiToDisplay}
        </div>
      );
    }

    const cleanName = (name || 'A').replace(/^@/, '');
    const initial = cleanName.charAt(0).toUpperCase();
    const colors = [
      'bg-emerald-700', 'bg-blue-700', 'bg-purple-700', 'bg-rose-700', 'bg-amber-700', 'bg-cyan-700'
    ];
    const colorIndex = initial.charCodeAt(0) % colors.length;

    return (
      <div
        className={`${size} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 select-none shadow-sm`}
      >
        {initial}
      </div>
    );
  }

  function renderComments(
    postId: string,
    allComments: CommentItem[],
    postAuthor: string,
    parentId: string | null = null,
    depth: number = 0
  ) {
    const list = allComments.filter((c) => (parentId ? c.parent_id === parentId : !c.parent_id));
    if (!list || list.length === 0) return null;

    return (
      <div className={`space-y-4 ${depth > 0 ? 'ml-6 sm:ml-10 mt-3 pl-3 border-l border-neutral-800' : 'mt-5'}`}>
        {list.map((c) => {
          const isAuthor = (c.author_name || 'Anônimo').toLowerCase() === (postAuthor || '').toLowerCase();
          const childReplies = allComments.filter((sub) => sub.parent_id === c.id);
          const hasChildren = childReplies.length > 0;
          const isHidden = hiddenReplies[c.id] === true;
          const isEditing = editingCommentId === c.id;
          const userCanEdit = isAuthorLoggedIn(c.author_name);

          return (
            <div key={c.id} className="flex gap-3 group">
              <Avatar
                name={c.author_name}
                size={depth > 0 ? 'w-7 h-7' : 'w-9 h-9'}
                fontSize={depth > 0 ? 'text-xs' : 'text-sm'}
              />

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-semibold text-neutral-200">
                    {c.author_name || 'Anônimo'}
                  </span>

                  {isAuthor && (
                    <span className="flex items-center gap-1 text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full font-medium">
                      <span className="text-rose-500">❤️</span> do autor
                    </span>
                  )}

                  <span className="text-[11px] text-neutral-500">
                    <ClientDate dateString={c.created_at} />
                  </span>

                  {userCanEdit && !isEditing && (
                    <div className="flex items-center gap-2 ml-auto text-[11px] text-neutral-400">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCommentId(c.id);
                          setEditCommentContent(c.content);
                        }}
                        className="hover:text-amber-400 transition underline underline-offset-2"
                        title="Editar esta resposta"
                      >
                        Editar
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(postId, c.id)}
                        className="hover:text-rose-400 transition underline underline-offset-2"
                        title="Excluir esta resposta"
                      >
                        Excluir
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="my-2 p-2.5 bg-neutral-950 border border-amber-600/40 rounded-lg space-y-2">
                    <textarea
                      rows={2}
                      value={editCommentContent}
                      onChange={(e) => setEditCommentContent(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded p-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingCommentId(null)}
                        className="px-2.5 py-1 text-xs text-neutral-400 hover:text-neutral-200"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEditComment(postId, c.id)}
                        className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-neutral-950 font-semibold text-xs transition"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-line mb-2">
                    {c.content}
                  </p>
                )}

                <div className="flex items-center gap-3.5 text-neutral-400 text-xs">
                  <button
                    type="button"
                    onClick={() => handleCommentVote(c.id, 'like')}
                    className={`flex items-center gap-1 hover:text-neutral-100 transition ${
                      commentVotes[c.id] === 'like' ? 'text-white font-bold' : ''
                    }`}
                  >
                    <span>👍</span>
                    <span className="text-[11px]">{c.likes || 0}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCommentVote(c.id, 'dislike')}
                    className={`hover:text-neutral-100 transition ${
                      commentVotes[c.id] === 'dislike' ? 'text-white font-bold' : ''
                    }`}
                  >
                    <span>👎</span>
                    {c.dislikes ? <span className="text-[11px] ml-1">{c.dislikes}</span> : null}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCommentVote(c.id, 'like')}
                    className="flex items-center gap-1 hover:text-rose-400 transition"
                  >
                    <span className="text-rose-500">❤️</span>
                    <span className="text-[11px]">{c.likes || 0}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (replyTarget?.commentId === c.id) {
                        setReplyTarget(null);
                      } else {
                        setReplyTarget({ postId, commentId: c.id, replyToName: c.author_name || 'Anônimo' });
                        setCommentText(`@${c.author_name?.replace(/^@/, '') || 'Anônimo'} `);
                      }
                    }}
                    className="font-medium hover:text-neutral-200 transition"
                  >
                    Responder
                  </button>
                </div>

                {replyTarget?.postId === postId && replyTarget?.commentId === c.id && (
                  <div className="mt-3 p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2">
                    {currentUser ? (
                      <div className="flex items-center gap-2 text-xs text-neutral-400 pb-1">
                        <Avatar name={currentProfile?.username || 'Você'} size="w-5 h-5" fontSize="text-[10px]" />
                        <span>Respondendo como <strong className="text-emerald-400">@{currentProfile?.username}</strong></span>
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder="Seu nome ou apelido"
                        value={commentAuthor}
                        onChange={(e) => setCommentAuthor(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-2 text-xs text-neutral-100 focus:outline-none focus:border-emerald-500"
                      />
                    )}

                    <textarea
                      rows={2}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded p-2 text-xs text-neutral-100 focus:outline-none focus:border-emerald-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setReplyTarget(null)}
                        className="px-3 py-1 text-xs text-neutral-400 hover:text-neutral-200"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={submittingComment}
                        onClick={() => handleSendReply(postId, c.id)}
                        className="px-4 py-1.5 rounded-full bg-neutral-100 hover:bg-white text-neutral-950 font-semibold text-xs transition disabled:opacity-50"
                      >
                        {submittingComment ? 'Respondendo...' : 'Responder'}
                      </button>
                    </div>
                  </div>
                )}

                {hasChildren && (
                  <button
                    type="button"
                    onClick={() => toggleRepliesVisibility(c.id)}
                    className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 transition"
                  >
                    <span>{isHidden ? '▶' : '▼'}</span>
                    <span>
                      {isHidden
                        ? `Ver ${childReplies.length} ${childReplies.length === 1 ? 'resposta' : 'respostas'}`
                        : `Ocultar ${childReplies.length === 1 ? 'resposta' : 'respostas'}`}
                    </span>
                  </button>
                )}

                {!isHidden && renderComments(postId, allComments, postAuthor, c.id, depth + 1)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-4 sm:p-6 max-w-4xl mx-auto relative">
      <header className="border-b border-neutral-800 pb-4 mb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-emerald-500">Repot</h1>
          <p className="text-sm text-neutral-400">Ideias e comunidades que crescem juntas.</p>
        </div>

        <div className="flex items-center gap-3 relative">
          {currentUser ? (
            <div className="flex items-center gap-2.5 bg-neutral-900 border border-neutral-800 py-1.5 px-3 rounded-xl">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="relative group focus:outline-none"
                title="Clique para escolher seu emoji de perfil"
              >
                <Avatar
                  name={currentProfile?.username || 'U'}
                  customEmoji={currentProfile?.avatar_url}
                  size="w-8 h-8"
                  fontSize="text-base"
                />
                <span className="absolute -bottom-1 -right-1 bg-neutral-900 text-[10px] rounded-full px-1 border border-neutral-700">
                  ✏️
                </span>
              </button>

              <div className="text-left leading-none">
                <span className="text-xs font-semibold text-neutral-200 block">
                  @{currentProfile?.username || 'membro'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="ml-2 text-[11px] text-neutral-400 hover:text-rose-400 transition"
                title="Sair da conta"
              >
                Sair
              </button>

              {showEmojiPicker && (
                <div className="absolute right-0 top-12 z-50 w-64 bg-neutral-900 border border-neutral-800 rounded-2xl p-3 shadow-2xl space-y-2">
                  <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                    <span className="text-xs font-semibold text-neutral-300">Escolha o seu Avatar</span>
                    <button
                      onClick={() => setShowEmojiPicker(false)}
                      className="text-neutral-400 hover:text-neutral-200 text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        disabled={savingEmoji}
                        onClick={() => handleSelectEmoji(emoji)}
                        className={`text-xl p-2 rounded-xl hover:bg-neutral-800 transition ${
                          currentProfile?.avatar_url === emoji ? 'bg-emerald-950 border border-emerald-600' : ''
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-medium rounded-lg transition"
            >
              Entrar / Cadastrar
            </Link>
          )}

          <Link
            href="/novo-topico"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-neutral-950 text-xs sm:text-sm font-semibold rounded-lg transition"
          >
            + Criar Discussão
          </Link>
        </div>
      </header>

      {/* Barra de Pesquisa */}
      <div className="mb-6">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-neutral-500 text-sm">
            🔍
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar discussões, respostas, ideias ou autores..."
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition shadow-inner"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-neutral-500 hover:text-neutral-300"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Comunidades */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Comunidades</h2>
          {selectedCommunity && (
            <button
              onClick={() => setSelectedCommunity(null)}
              className="text-xs text-emerald-400 hover:underline"
            >
              Limpar filtro
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {communities.map((comm) => {
            const isSelected = selectedCommunity === comm.id;
            return (
              <button
                key={comm.id}
                onClick={() => setSelectedCommunity(isSelected ? null : comm.id)}
                className={`px-3 py-1.5 rounded-lg text-sm transition border ${
                  isSelected
                    ? 'bg-emerald-600 text-neutral-950 border-emerald-500 font-semibold'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                {comm.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Feed Principal */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            {searchTerm ? `Resultados da busca (${filteredPosts.length})` : 'Discussões Recentes'}
          </h2>
        </div>

        {loading ? (
          <p className="text-neutral-500 text-sm">Carregando discussões...</p>
        ) : (
          <div className="space-y-6">
            {filteredPosts && filteredPosts.length > 0 ? (
              filteredPosts.map((post: any) => {
                const totalComments = post.comments?.length || 0;
                const isEditingPost = editingPostId === post.id;
                const userCanEditPost = isAuthorLoggedIn(post.author_name);

                return (
                  <article key={post.id} className="p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                        {post.communities?.name || 'Geral'}
                      </span>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-neutral-500">
                          <ClientDate dateString={post.created_at} />
                        </span>

                        {userCanEditPost && !isEditingPost && (
                          <div className="flex items-center gap-2 text-xs text-neutral-400">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPostId(post.id);
                                setEditPostTitle(post.title);
                                setEditPostContent(post.content);
                              }}
                              className="hover:text-amber-400 transition underline underline-offset-2"
                              title="Editar este tópico"
                            >
                              Editar
                            </button>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={() => handleDeletePost(post.id)}
                              className="hover:text-rose-400 transition underline underline-offset-2"
                              title="Excluir este tópico"
                            >
                              Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {isEditingPost ? (
                      <div className="space-y-3 my-3 p-4 bg-neutral-950 border border-amber-600/40 rounded-xl">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-400 mb-1">Título</label>
                          <input
                            type="text"
                            value={editPostTitle}
                            onChange={(e) => setEditPostTitle(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-sm text-neutral-100 focus:outline-none focus:border-amber-500 font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-neutral-400 mb-1">Conteúdo</label>
                          <textarea
                            rows={4}
                            value={editPostContent}
                            onChange={(e) => setEditPostContent(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingPostId(null)}
                            className="px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditPost(post.id)}
                            className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold text-xs transition"
                          >
                            Salvar Alterações
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-xl font-bold text-neutral-100 tracking-tight">{post.title}</h3>
                        <p className="text-neutral-300 text-sm mt-2 whitespace-pre-line leading-relaxed">
                          {post.content}
                        </p>
                      </>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-4 mt-5 border-t border-neutral-800">
                      <button
                        type="button"
                        onClick={() => handlePostLike(post.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                          postVotes[post.id] === 'like'
                            ? 'bg-rose-950/50 border-rose-600 text-rose-400'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                        }`}
                      >
                        <span>❤️</span>
                        <span>{post.likes || 0}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePostDislike(post.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                          postVotes[post.id] === 'dislike'
                            ? 'bg-neutral-800 border-neutral-600 text-neutral-200'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        <span>👎</span>
                        <span>{post.dislikes || 0}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setReplyTarget(
                            replyTarget?.postId === post.id && replyTarget?.commentId === null
                              ? null
                              : { postId: post.id, commentId: null }
                          )
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-300 transition"
                      >
                        <span>💬</span>
                        <span>{totalComments > 0 ? `Respostas (${totalComments})` : 'Responder'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShare(`/topico/${post.id}`, post.title)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-300 transition ml-auto"
                      >
                        <span>🔗</span>
                        <span>{copiedId === `/topico/${post.id}` ? 'Copiado!' : 'Compartilhar'}</span>
                      </button>
                    </div>

                    {replyTarget?.postId === post.id && replyTarget.commentId === null && (
                      <div className="mt-4 p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                        {currentUser ? (
                          <div className="flex items-center gap-2 text-xs text-neutral-400 pb-1">
                            <Avatar
                              name={currentProfile?.username || 'Você'}
                              customEmoji={currentProfile?.avatar_url}
                              size="w-5 h-5"
                              fontSize="text-[10px]"
                            />
                            <span>Comentando como <strong className="text-emerald-400">@{currentProfile?.username}</strong></span>
                          </div>
                        ) : (
                          <input
                            type="text"
                            placeholder="Seu nome (opcional)"
                            value={commentAuthor}
                            onChange={(e) => setCommentAuthor(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded p-2 text-xs text-neutral-100 focus:outline-none focus:border-emerald-500"
                          />
                        )}

                        <textarea
                          rows={2}
                          placeholder="Participe da conversa..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded p-2 text-xs text-neutral-100 focus:outline-none focus:border-emerald-500"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setReplyTarget(null)}
                            className="px-3 py-1 text-xs text-neutral-400 hover:text-neutral-200"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            disabled={submittingComment}
                            onClick={() => handleSendReply(post.id, null)}
                            className="px-4 py-1.5 rounded-full bg-neutral-100 hover:bg-white text-neutral-950 font-semibold text-xs transition disabled:opacity-50"
                          >
                            {submittingComment ? 'Enviando...' : 'Comentar'}
                          </button>
                        </div>
                      </div>
                    )}

                    {renderComments(post.id, post.comments || [], post.author_name || 'Anônimo')}
                  </article>
                );
              })
            ) : (
              <div className="p-8 text-center rounded-xl bg-neutral-900/40 border border-neutral-800/60">
                <p className="text-neutral-400 text-sm">
                  {searchTerm
                    ? `Nenhum tópico ou resposta encontrado para "${searchTerm}".`
                    : 'Nenhum tópico criado ainda.'}
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}