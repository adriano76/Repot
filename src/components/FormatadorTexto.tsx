import React from 'react';

export default function FormatadorTexto({ texto }: { texto: string }) {
  // 1. PREVENÇÃO DE ERRO:
  // Se o usuário enviar um texto vazio ou nulo, o componente para por aqui e não renderiza nada.
  if (!texto) return null;

  // ---------------------------------------------------------------------------
  // REGEX DE URL (O Detetive de Links):
  // Esta "expressão regular" serve para encontrar qualquer coisa que pareça um link.
  // Ela procura por padrões que comecem com http:// ou https:// e vai pegando 
  // os caracteres até encontrar um espaço vazio ou pontuação final.
  // ---------------------------------------------------------------------------
  const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
  
  // 2. FATIAMENTO DO TEXTO:
  // O comando .split() usa o nosso "detetive" para fatiar o texto original.
  // Exemplo: "Olá https://google.com tudo bem?" vira uma lista com 3 pedaços:
  // ['Olá ', 'https://google.com', ' tudo bem?']
  const partes = texto.split(urlRegex);

  return (
    // whitespace-pre-wrap: Mantém as quebras de linha (Enters) que o usuário digitou
    // break-words: Evita que links ou textos muito longos vazem para fora da tela
    <div className="whitespace-pre-wrap text-neutral-300 text-sm break-words">
      
      {/* 3. VARREDURA: Aqui o código vai analisar cada "pedaço" da nossa lista */}
      {partes.map((parte, index) => {
        
        // A) VERIFICA SE O PEDAÇO ATUAL É UM LINK
        if (parte.match(urlRegex)) {
          
          // -------------------------------------------------------------------
          // REGEX DO YOUTUBE:
          // Se for um link, esse segundo "detetive" tenta descobrir se é do YouTube.
          // Ele reconhece formatos como youtube.com/watch?v=ID ou youtu.be/ID
          // e extrai exatamente as 11 letras/números que representam o vídeo.
          // -------------------------------------------------------------------
          const youtubeRegex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
          const ytMatch = parte.match(youtubeRegex);

          // B) É UM LINK DO YOUTUBE?
          // Se a verificação for positiva e capturarmos o ID do vídeo (ytMatch[1])
          if (ytMatch && ytMatch[1]) {
            const videoId = ytMatch[1];
            
            // Retorna o player de vídeo (iframe) em vez do link escrito.
            // A classe 'pt-[56.25%]' é um truque do CSS para manter a proporção 16:9 (widescreen).
            return (
              <div key={index} className="my-4 relative w-full pt-[56.25%] rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950">
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="Player de vídeo do YouTube"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen // Permite que o usuário coloque o vídeo em tela cheia
                ></iframe>
              </div>
            );
          }

          // C) É UM LINK NORMAL (Não é do YouTube)
          // Cria uma tag <a> para o link ficar clicável e com a cor verde do projeto
          return (
            <a 
              key={index} 
              href={parte} 
              target="_blank" // Abre o link numa aba separada do navegador
              rel="noopener noreferrer" // Proteção de segurança contra sites maliciosos
              className="text-emerald-500 hover:text-emerald-400 hover:underline break-all"
            >
              {parte}
            </a>
          );
        }

        // D) É APENAS TEXTO NORMAL
        // Se o pedaço não for link, devolvemos apenas o texto puro (dentro de um <span>)
        return <span key={index}>{parte}</span>;
      })}
    </div>
  );
}