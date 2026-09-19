@echo off
chcp 65001 > nul
title Instalador e Configurador - Repot

echo ==========================================
echo       CONFIGURANDO O PROJETO REPOT        
echo ==========================================
echo.

:: 1. Criar pasta src\lib se nao existir
if not exist "src\lib" (
    echo [+] Criando pasta src\lib...
    mkdir "src\lib"
) else (
    echo [*] Pasta src\lib ja existe.
)

:: 2. Criar ou sobrescrever src\lib\supabase.ts
echo [+] Gerando arquivo src\lib\supabase.ts...
(
echo import { createClient } from '@supabase/supabase-js';
echo.
echo const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
echo const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
echo.
echo export const supabase = createClient^(supabaseUrl, supabaseAnonKey^);
) > "src\lib\supabase.ts"

:: 3. Criar arquivo .env.local com suas chaves
echo [+] Gerando arquivo .env.local com as credenciais...
(
echo NEXT_PUBLIC_SUPABASE_URL=https://iewdmkkmbnvwoksgkwsh.supabase.co
echo NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_jm3mPR-5srnGe_4GTo19RQ_1V6JX2tv
) > ".env.local"

:: 4. Atualizar o arquivo src\app\page.tsx com o Feed do Repot
echo [+] Atualizando src\app\page.tsx com a tela inicial...
(
echo import { supabase } from '@/lib/supabase';
echo import Link from 'next/link';
echo.
echo export const revalidate = 0;
echo.
echo export default async function Home^(^) {
echo   const { data: communities } = await supabase.from^('communities'^).select^('*'^);
echo   const { data: posts } = await supabase
echo     .from^('posts'^)
echo     .select^('id, title, content, created_at, communities(name, slug)'^)
echo     .order^('created_at', { ascending: false }^);
echo.
echo   return ^(
echo     ^<main className="min-h-screen bg-neutral-950 text-neutral-100 p-6 max-w-4xl mx-auto"^>
echo       ^<header className="border-b border-neutral-800 pb-4 mb-8 flex justify-between items-center"^>
echo         ^<div^>
echo           ^<h1 className="text-3xl font-bold tracking-tight text-emerald-500"^>Repot^</h1^>
echo           ^<p className="text-sm text-neutral-400"^>Ideias e comunidades que crescem juntas.^</p^>
echo         ^</div^>
echo       ^</header^>
echo.
echo       ^<section className="mb-10"^>
echo         ^<h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 mb-3"^>
echo           Comunidades
echo         ^</h2^>
echo         ^<div className="flex flex-wrap gap-2"^>
echo           {communities^?.map^((comm^) =^> ^(
echo             ^<Link
echo               key={comm.id}
echo               href={`/c/${comm.slug}`}
echo               className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-emerald-500 text-sm transition"
echo             ^>
echo               {comm.name}
echo             ^</Link^>
echo           ^)^)}
echo         ^</div^>
echo       ^</section^>
echo.
echo       ^<section^>
echo         ^<h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 mb-4"^>
echo           Discussões Recentes
echo         ^</h2^>
echo         ^<div className="space-y-4"^>
echo           {posts ^&^& posts.length ^> 0 ? ^(
echo             posts.map^((post: any^) =^> ^(
echo               ^<article
echo                 key={post.id}
echo                 className="p-5 rounded-xl bg-neutral-900 border border-neutral-800"
echo               ^>
echo                 ^<span className="text-xs font-medium text-emerald-400"^>
echo                   {post.communities^?.name}
echo                 ^</span^>
echo                 ^<h3 className="text-lg font-semibold mt-1"^>{post.title}^</h3^>
echo                 ^<p className="text-neutral-300 text-sm mt-2 line-clamp-2"^>{post.content}^</p^>
echo               ^</article^>
echo             ^)^)
echo           ^) : ^(
echo             ^<p className="text-neutral-500 text-sm"^>Nenhum tópico criado ainda.^</p^>
echo           ^)}
echo         ^</div^>
echo       ^</section^>
echo     ^</main^>
echo   ^);
echo }
) > "src\app\page.tsx"

echo.
echo ==========================================
echo        CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!
echo ==========================================
echo.
echo Iniciando o servidor de desenvolvimento...
echo Acesse no seu navegador: http://localhost:3000
echo.

npm run dev
pause