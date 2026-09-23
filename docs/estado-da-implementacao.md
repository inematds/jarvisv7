# Atualização 0.2.0 — JEV Reflex

JEV real integrado ao chat, com ativação nas preferências, cinco decisões estruturadas, painel e fallback. Veja [contrato, testes e limites](jev-reflex.md). O inventário da base 0.1.0 abaixo permanece aplicável.

# Estado da implementação — 0.1.0

Data: 13/09/2026. Projeto: **Jarvis v7**. Os documentos de planejamento descrevem a visão completa; esta página descreve o código entregue.

| Área | Entregue | Limite atual |
|---|---|---|
| Aplicação | React + Fastify, desktop/celular, assistente inicial, perfis | Instância pessoal em localhost; sem multiusuário |
| Codex OAuth | Conta/runtime oficial, login, catálogo real, inferência testada | Requer CLI compatível; disponibilidade depende da conta |
| Claude OAuth | Login do Claude Code, inferência pessoal testada | Login no terminal, opt-in, texto, sem oferecer OAuth como API pública |
| OpenRouter | Catálogo, seleção, texto/imagem, erros e timeout | Sem credencial nesta entrega; chamada real não executada |
| Conhecimento | Importação MD/TXT/PDF textual, CRUD, SQLite FTS5 | Não há embeddings, OCR ou sincronização de diretórios |
| Memórias | Comando explícito e edição com persistência | Sem extração automática de preferências do usuário |
| Conversas | Histórico, fontes preservadas, troca de cérebro, cancelamento | Resposta exibida ao concluir; não há streaming de tokens |
| Mapa | Grafo 3D sob demanda, seleção de nota | Relações explícitas por texto/título, sem agrupamento semântico |
| Kie | Imagem/vídeo, fila durável, limite, idempotência, download | Testes com respostas simuladas; geração paga não executada sem chave |
| Voz | Reconhecimento e síntese do navegador; “pare” | Compatibilidade varia; não substitui runtime de voz dedicado |
| Tela | Frame explícito enviado na pergunta | Sem captura periódica, controle desktop ou análise de postura |
| Foco | Timer persistente, pausa, extensão e distrações manuais | Sem avaliar atividades abertas |
| Backup | Exportação JSON, snapshot SQLite, backup offline com mídia | Restore completo manual; importação web é aditiva de notas |
| Atualizações | Consulta de releases configurável e comando com backup/checks | Sem instalador gráfico, assinatura de release ou atualização automática |
| Agnes | Identificado como pendente na interface | É preciso identificar qual serviço e documentação correta |
| Extensão | Código separado por serviços, guia de implementação | Sem marketplace ou carregamento de plugins externos |

## Validação

Build TypeScript/Vite/esbuild e testes locais de persistência/API/fila. Testes de navegador cobrem onboarding, memória, histórico, mudança de modelo local e navegação responsiva. Codex e Claude retornaram respostas reais usando os logins OAuth já instalados, com esforço baixo e sem ferramentas de execução.

Não se deve extrapolar esses testes para saldo/acesso OpenRouter, geração Kie, visão ao vivo, microfone em todos os navegadores, plataformas não testadas ou funcionamento da futura Agnes.

## Decisões importantes

- O runtime de chat recebe o histórico limitado e os documentos recuperados por busca. Não recebe acesso geral ao repositório e não executa ferramentas neste turno.
- A memória e a geração de mídia são operações explícitas. Uma resposta de LLM não é tratada como prova de que uma ação ocorreu.
- A fila não reenvia automaticamente uma submissão Kie sem confirmação: ela pode ter sido cobrada. A reconciliação usa o identificador remoto já conhecido.
- Limite diário de mídia é quantidade de pedidos em dia UTC, não orçamento financeiro. O preço é o do serviço/modelo na conta da pessoa.
- AES-GCM protege o arquivo de credenciais contra leitura isolada; a chave está na mesma máquina, com permissões restritas. Isso não protege contra comprometimento da conta do sistema operacional.
- O banco é a fonte persistente da instalação. Exportação permite portabilidade; editar arquivos em docs não altera automaticamente a base pessoal.

## Próximas entregas do plano

Agnes após identificação; automações e ferramentas com aprovação; integração desktop; streaming, catálogo de mídia mais amplo e custos reais; extensões versionadas; migrações/restore pelo painel; releases distribuídas e verificação de integridade. Essas funções não aparecem como implementadas nesta versão.
