'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function TopicoDetalhe() {
const params = useParams();
const rawId = params?.id;
const postId = Array.isArray(rawId) ? rawId[0] : (rawId as string);

const [post, setPost] = useState<any>(null);
const [comments, setComments] = useState<any[]>([]);
const [commentContent, setCommentContent] = useState('');
const [authorName, setAuthorName] = useState('');
const [loading, setLoading] = useState(true);
const [submitting, setSubmitting] = useState(false);
const [copied, setCopied] = useState(false);

// Votos do post principal
const [postLikes, setPostLikes] = useState(0);
const [postDislikes, setPostDislikes] = useState(0);
const [userPostVote, setUserPostVote] = useState<'like' | 'dislike' | null>(null);

// Votos dos comentários
const [votedComments, setVotedComments] = useState<
Record<string, 'like' | 'dislike'>

> ({});

const loadData = useCallback(async () => {
if (!postId) return;

```
try {
  // Busca o post principal
  const { data: postData, error: postError } = await supabase
    .from('posts')
    .select(
      'id, title, content, author_name, created_at, likes, dislikes, communities(name, slug)'
    )
    .eq('id', postId)
    .single();

  if (postError) {
    console.error('Erro ao buscar tópico:', postError.message);
  } else if (postData) {
    setPost(postData);
    setPostLikes(postData.likes || 0);
    setPostDislikes(postData.dislikes || 0);
  }

  // Busca os comentários
  const { data: commentsData, error: commentsError } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (commentsError) {
    console.error('Erro ao buscar respostas:', commentsError.message);
  } else {
    setComments(commentsData || []);
  }
} catch (err) {
  console.error('Falha na comunicação com o Supabase:', err);
} finally {
  setLoading(false);
}
```

}, [postId]);

useEffect(() => {
loadData();
}, [loadData]);

// Curtir post
async function handlePostLike() {
if (userPostVote === 'like') return;

```
const newLikes = postLikes + 1;
const newDislikes =
  userPostVote === 'dislike'
    ? Math.max(0, postDislikes - 1)
    : postDislikes;

setPostLikes(newLikes);
setPostDislikes(newDislikes);
setUserPostVote('like');

await supabase
  .from('posts')
  .update({
    likes: newLikes,
    dislikes: newDislikes,
  })
  .eq('id', postId);
```

}

// Não gostei do post
async function handlePostDislike() {
if (userPostVote === 'dislike') return;

```
const newDislikes = postDislikes + 1;
const newLikes =
  userPostVote === 'like'
    ? Math.max(0, postLikes - 1)
    : postLikes;

setPostDislikes(newDislikes);
setPostLikes(newLikes);
setUserPostVote('dislike');

await supabase
  .from('posts')
  .update({
    likes: newLikes,
    dislikes: newDislikes,
  })
  .eq('id', postId);
```

}

// Voto em comentário
async function handleCommentVote(
commentId: string,
type: 'like' | 'dislike'
) {
if (votedComments[commentId] === type) return;

```
const target = comments.find((c) => c.id === commentId);
if (!target) return;

let updatedLikes = target.likes || 0;
let updatedDislikes = target.dislikes || 0;

if (type === 'like') {
  updatedLikes += 1;

  if (votedComments[commentId] === 'dislike') {
    updatedDislikes = Math.max(0, updatedDislikes - 1);
  }
} else {
  updatedDislikes += 1;

  if (votedComments[commentId] === 'like') {
    updatedLikes = Math.max(0, updatedLikes - 1);
  }
}

setComments((prev) =>
  prev.map((c) =>
    c.id === commentId
      ? {
          ...c,
          likes: updatedLikes,
          dislikes: updatedDislikes,
        }
      : c
  )
);

setVotedComments((prev) => ({
  ...prev,
  [commentId]: type,
}));

await supabase
  .from('comments')
  .update({
    likes: updatedLikes,
    dislikes: updatedDislikes,
  })
  .eq('id', commentId);
```

}

// Compartilhar
async function handleShare() {
if (
typeof window !== 'undefined' &&
navigator.share
) {
try {
await navigator.share({
title: post?.title || 'Discussão no Repot',
text: `Confira essa discussão no Repot: ${post?.title}`,
url: window.location.href,
});

```
    return;
  } catch (_) {
    // Compartilhamento cancelado
  }
}

if (typeof window !== 'undefined') {
  await navigator.clipboard.writeText(
    window.location.href
  );

  setCopied(true);

  setTimeout(() => {
    setCopied(false);
  }, 2000);
}
```

}

// Enviar comentário
async function handleCommentSubmit(
e: React.FormEvent
) {
e.preventDefault();

```
if (!commentContent.trim()) return;

setSubmitting(true);

const { error } = await supabase
  .from('comments')
  .insert([
    {
      post_id: postId,
      content: commentContent.trim(),
      author_name: authorName.trim()
        ? authorName
        : 'Anônimo',
    },
  ]);

setSubmitting(false);

if (!error) {
  setCommentContent('');
  loadData();
} else {
  alert(
    'Não foi possível enviar a resposta. Tente novamente.'
  );
}
```

}

if (loading) {
return ( <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6 max-w-3xl mx-auto flex items-center justify-center"> <p className="text-neutral-400">
Carregando discussão... </p> </main>
);
}

if (!post) {
return ( <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6 max-w-3xl mx-auto"> <p className="text-neutral-400">
Tópico não encontrado. </p>

```
    <Link
      href="/"
      className="text-emerald-400 hover:text-emerald-300 hover:underline mt-4 inline-block"
    >
      ← Voltar ao feed
    </Link>
  </main>
);
```

}

return ( <main className="min-h-screen bg-neutral-950 text-neutral-100 p-4 sm:p-6 max-w-3xl mx-auto">

```
  {/* Cabeçalho */}
  <header className="mb-6 border-b border-neutral-800 pb-4 flex justify-between items-center gap-4">

    <Link
      href="/"
      className="text-sm text-neutral-300 hover:text-white transition"
    >
      ← Voltar ao Feed
    </Link>

    <span className="text-xs px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-600 text-emerald-300 font-semibold">
      {post.communities?.name || 'Comunidade'}
    </span>

  </header>

  {/* =====================================================
      POST PRINCIPAL
  ====================================================== */}

  <article className="p-5 sm:p-6 rounded-xl bg-neutral-900 border border-neutral-700 mb-8 shadow-lg">

    <h1 className="text-2xl font-bold tracking-tight mb-2 text-white">
      {post.title}
    </h1>

    <p
      className="text-xs text-neutral-400 mb-5"
      suppressHydrationWarning
    >
      Por{' '}
      <span className="text-neutral-200 font-medium">
        {post.author_name || 'Anônimo'}
      </span>{' '}
      em{' '}
      {new Date(post.created_at).toLocaleDateString(
        'pt-BR'
      )}
    </p>

    <div className="text-neutral-200 text-base leading-relaxed whitespace-pre-line mb-6">
      {post.content}
    </div>

    {/* =====================================================
        BOTÕES DO POST
        Agora ficam claramente visíveis dentro do post
    ====================================================== */}

    <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-neutral-700">

      {/* LIKE */}
      <button
        type="button"
        onClick={handlePostLike}
        aria-label="Curtir publicação"
        className={`inline-flex items-center justify-center gap-2 min-h-[42px] px-4 rounded-lg border-2 text-sm font-bold transition-all cursor-pointer ${
          userPostVote === 'like'
            ? 'bg-rose-600 border-rose-400 text-white shadow-md'
            : 'bg-neutral-700 border-neutral-500 text-white hover:bg-neutral-600 hover:border-rose-400'
        }`}
      >
        <span className="text-lg">❤️</span>
        <span>{postLikes}</span>
      </button>

      {/* DISLIKE */}
      <button
        type="button"
        onClick={handlePostDislike}
        aria-label="Não gostei da publicação"
        className={`inline-flex items-center justify-center gap-2 min-h-[42px] px-4 rounded-lg border-2 text-sm font-bold transition-all cursor-pointer ${
          userPostVote === 'dislike'
            ? 'bg-neutral-600 border-white text-white shadow-md'
            : 'bg-neutral-700 border-neutral-500 text-white hover:bg-neutral-600 hover:border-white'
        }`}
      >
        <span className="text-lg">👎</span>
        <span>{postDislikes}</span>
      </button>

      {/* COMPARTILHAR */}
      <button
        type="button"
        onClick={handleShare}
        aria-label="Compartilhar publicação"
        className="inline-flex items-center justify-center gap-2 min-h-[42px] px-4 rounded-lg bg-neutral-700 border-2 border-neutral-500 hover:bg-neutral-600 hover:border-emerald-400 text-sm font-bold text-white transition-all cursor-pointer sm:ml-auto"
      >
        <span className="text-lg">🔗</span>

        <span>
          {copied
            ? 'Link Copiado!'
            : 'Compartilhar'}
        </span>
      </button>

    </div>
  </article>

  {/* =====================================================
      RESPOSTAS
  ====================================================== */}

  <section className="mb-8">

    <h2 className="text-lg font-semibold mb-4 text-white">
      Respostas ({comments.length})
    </h2>

    <div className="space-y-4 mb-8">

      {comments.length > 0 ? (
        comments.map((comm) => (

          <article
            key={comm.id}
            className="p-4 sm:p-5 rounded-xl bg-neutral-900 border border-neutral-700 shadow-md"
          >

            <div className="flex justify-between items-center mb-2 gap-3">

              <span className="text-xs font-bold text-emerald-400">
                {comm.author_name || 'Anônimo'}
              </span>

              <span
                className="text-[11px] text-neutral-400"
                suppressHydrationWarning
              >
                {new Date(
                  comm.created_at
                ).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>

            </div>

            <p className="text-sm text-neutral-200 whitespace-pre-line mb-4">
              {comm.content}
            </p>

            {/* =================================================
                BOTÕES DE CADA COMENTÁRIO
            ================================================== */}

            <div className="flex items-center gap-3 pt-3 border-t border-neutral-700">

              {/* LIKE COMENTÁRIO */}
              <button
                type="button"
                onClick={() =>
                  handleCommentVote(
                    comm.id,
                    'like'
                  )
                }
                aria-label="Curtir comentário"
                className={`inline-flex items-center justify-center gap-2 min-h-[38px] px-3 rounded-lg border-2 text-xs font-bold transition-all cursor-pointer ${
                  votedComments[comm.id] ===
                  'like'
                    ? 'bg-rose-600 border-rose-400 text-white'
                    : 'bg-neutral-700 border-neutral-500 text-white hover:bg-neutral-600 hover:border-rose-400'
                }`}
              >
                <span className="text-base">
                  ❤️
                </span>

                <span>
                  {comm.likes || 0}
                </span>
              </button>

              {/* DISLIKE COMENTÁRIO */}
              <button
                type="button"
                onClick={() =>
                  handleCommentVote(
                    comm.id,
                    'dislike'
                  )
                }
                aria-label="Não gostei do comentário"
                className={`inline-flex items-center justify-center gap-2 min-h-[38px] px-3 rounded-lg border-2 text-xs font-bold transition-all cursor-pointer ${
                  votedComments[comm.id] ===
                  'dislike'
                    ? 'bg-neutral-600 border-white text-white'
                    : 'bg-neutral-700 border-neutral-500 text-white hover:bg-neutral-600 hover:border-white'
                }`}
              >
                <span className="text-base">
                  👎
                </span>

                <span>
                  {comm.dislikes || 0}
                </span>
              </button>

            </div>

          </article>

        ))
      ) : (

        <p className="text-sm text-neutral-400">
          Nenhum comentário até agora. Seja o
          primeiro a responder!
        </p>

      )}

    </div>

    {/* =====================================================
        FORMULÁRIO
    ====================================================== */}

    <form
      onSubmit={handleCommentSubmit}
      className="space-y-4 p-5 rounded-xl bg-neutral-900 border border-neutral-700 shadow-lg"
    >

      <h3 className="text-sm font-bold text-white">
        Deixe sua resposta
      </h3>

      <div>

        <input
          type="text"
          value={authorName}
          onChange={(e) =>
            setAuthorName(e.target.value)
          }
          placeholder="Seu nome (opcional)"
          className="w-full bg-neutral-950 border-2 border-neutral-700 rounded-lg p-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500 transition"
        />

      </div>

      <div>

        <textarea
          required
          rows={3}
          value={commentContent}
          onChange={(e) =>
            setCommentContent(e.target.value)
          }
          placeholder="Participe do debate..."
          className="w-full bg-neutral-950 border-2 border-neutral-700 rounded-lg p-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500 transition"
        />

      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-lg bg-emerald-500 hover:bg-emerald-400 border-2 border-emerald-300 font-bold text-neutral-950 text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting
          ? 'Enviando...'
          : 'Publicar Resposta'}
      </button>

    </form>

  </section>

</main>
```

);
}
