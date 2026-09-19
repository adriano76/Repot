import { useState, useEffect } from 'react';

import { supabase } from '@/lib/supabase';

import { useRouter } from 'next/navigation';

import Link from 'next/link';



export default function NovoTopico() {

  const router = useRouter();

  const [communities, setCommunities] = useState<any[]>([]);

  const [communityId, setCommunityId] = useState('');

  const [title, setTitle] = useState('');

  const [content, setContent] = useState('');

  const [authorName, setAuthorName] = useState('');

  const [loading, setLoading] = useState(false);



  useEffect(() => {

    async function loadCommunities() {

      const { data } = await supabase.from('communities').select('*');

      if (data && data.length > 0) {

        setCommunities(data);

        setCommunityId(data[0].id);

      }

    }

    loadCommunities();

  }, []);



  async function handleSubmit(e: React.FormEvent) {

    e.preventDefault();

    if (!title || !content || !communityId) return;



    setLoading(true);

    const { error } = await supabase.from('posts').insert([

      {

        community_id: communityId,

        title,

        content,

        author_name: authorName.trim() ? authorName : 'Anônimo',

      },

    ]);



    setLoading(false);



    if (!error) {

      router.push('/');

      router.refresh();

    } else {

      alert('Erro ao criar publicação. Tente novamente.');

    }

  }



  return (

    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6 max-w-2xl mx-auto">

      <header className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">

        <h1 className="text-2xl font-bold text-emerald-500">Nova Discussão</h1>

        <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-200 transition">

          ← Voltar ao Feed

        </Link>

      </header>



      <form onSubmit={handleSubmit} className="space-y-5">

        <div>

          <label className="block text-sm font-medium text-neutral-300 mb-2">Comunidade</label>

          <select

            value={communityId}

            onChange={(e) => setCommunityId(e.target.value)}

            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-neutral-100 focus:outline-none focus:border-emerald-500 transition"

          >

            {communities.map((c) => (

              <option key={c.id} value={c.id}>

                {c.name}

              </option>

            ))}

          </select>

        </div>



        <div>

          <label className="block text-sm font-medium text-neutral-300 mb-2">Seu Nome / Apelido</label>

          <input

            type="text"

            value={authorName}

            onChange={(e) => setAuthorName(e.target.value)}

            placeholder="Opcional (padrão: Anônimo)"

            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-neutral-100 focus:outline-none focus:border-emerald-500 transition"

          />

        </div>



        <div>

          <label className="block text-sm font-medium text-neutral-300 mb-2">Título do Tópico</label>

          <input

            type="text"

            required

            value={title}

            onChange={(e) => setTitle(e.target.value)}

            placeholder="Ex: Dúvidas sobre finanças ou mecânica"

            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-neutral-100 focus:outline-none focus:border-emerald-500 transition"

          />

        </div>



        <div>

          <label className="block text-sm font-medium text-neutral-300 mb-2">Conteúdo</label>

          <textarea

            required

            rows={5}

            value={content}

            onChange={(e) => setContent(e.target.value)}

            placeholder="Escreva sua ideia, dúvida ou relato..."

            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-neutral-100 focus:outline-none focus:border-emerald-500 transition"

          />

        </div>



        <button

          type="submit"

          disabled={loading}

          className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold text-neutral-950 transition disabled:opacity-50"

        >

          {loading ? 'Publicando...' : 'Publicar Tópico'}

        </button>

      </form>

    </main>

  );

} 

