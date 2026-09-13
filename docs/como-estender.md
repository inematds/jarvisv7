# Como criar seu próprio Jarvis a partir desta base

Comece pela instalação do README e use um diretório de dados separado para desenvolvimento. O projeto funciona sem credenciais no modo de busca local. Não copie a pasta pessoal de dados de quem distribuiu o código.

## Personalizar sem editar código

Nome, persona, cérebro, modelo, esforço e módulos ficam em Configurações. O perfil inicial é um conjunto de preferências que a pessoa pode modificar. A troca por conversa conserva as mensagens e altera o destino das próximas perguntas. Credenciais são pessoais e locais; nunca são valores padrão do projeto.

## Adicionar um cérebro

1. Adicione seu identificador à união `Brain` em `packages/shared/types.ts` e ao schema de provedores em `apps/server/app.ts`.
2. Em `apps/server/providers/brains.ts`, implemente status, catálogo e resposta, ou extraia um novo adaptador no mesmo diretório. Use a integração oficialmente suportada pelo provedor. Não copie tokens OAuth para endpoints de API.
3. Respeite cancelamento, timeout, modalidades de entrada e ausência de ferramentas de execução. Devolva texto apenas quando o provedor tiver concluído de fato.
4. Declare credenciais pelo armazenamento local, nunca em código ou no pacote de exportação. Os endpoints externos devem ser definidos no adaptador, não por uma URL arbitrária recebida do modelo.
5. Adicione o provedor às opções da interface e descreva instalação, autenticação e limites. Teste erros de autenticação, modelo inexistente, cancelamento e reinício com respostas controladas antes de uma chamada real autorizada.

Os tipos existentes são o contrato efetivo desta versão. Não há um sistema de plugins externo ainda.

## Adicionar um provedor de mídia

Use `apps/server/services/media.ts` como referência. Separe a criação paga da consulta de status e do download. Persista o identificador remoto antes de continuar; uma retomada deve consultar o trabalho existente. Se uma submissão não puder ser confirmada, marque a situação para revisão, sem criar outro pedido automaticamente.

Implemente o mapa de estados do provedor e valide os parâmetros de cada modelo. Preserve limite diário, confirmação de custo, idempotência, validação de destino de download e assinatura do formato. Acrescente testes de sucesso, falha remota, submissão incerta, URLs internas, reinício e repetição do download. Só depois acrescente os controles na interface.

## Criar novas versões

Mantenha código, conteúdo pessoal e credenciais separados. Crie uma branch para suas alterações, execute `npm run preflight` e `npm run test:e2e`, e documente alterações de comportamento. Para um banco novo, escreva migrações com versão, backup e teste de restauração antes de trocar o schema. A versão 0.1.0 aceita apenas schema 1 e recusa versões diferentes.

O código próprio desta base usa MIT; mantenha o aviso de licença e verifique separadamente os direitos dos materiais externos antes de publicar. A lista de arquivos de referência recebidos não é uma autorização de redistribuição. Configure seu próprio `origin` e publique tags/releases somente quando desejar distribuir. O comando de atualização usa esse origin escolhido por você.
