# Jarvis v7 — escolha de opções e atualizações

Status: experiência e mecanismo propostos; nenhuma das telas ou rotinas descritas foi implementada. Este documento responde à necessidade de cada pessoa escolher sua configuração e atualizar sua instalação sem depender do autor.

## Primeira abertura: assistente de configuração

O usuário passa por um fluxo curto, pode voltar e pode deixar módulos opcionais para depois. Escolher uma opção não configura automaticamente a conta correspondente.

| Etapa | O que a pessoa escolhe | O que o Jarvis faz |
|---|---|---|
| 1. Uso inicial | Explorar exemplos ou conectar seu cérebro | Abre uma base demonstrativa identificada ou segue para conexão |
| 2. Cérebro | Codex OAuth, Claude OAuth elegível ou OpenRouter API | Mostra requisitos, estado real e instrução de conexão por provedor |
| 3. Modelo | Um dos modelos disponíveis na conexão escolhida | Valida o ID e as capacidades; não substitui silenciosamente |
| 4. Conhecimento | Pasta local ou importação de arquivos | Mostra arquivos aceitos, erros e andamento da indexação |
| 5. Criação de mídia | Kie, segundo serviço após identificação ou configurar depois | Conecta credencial própria e lista operações/modelos validados |
| 6. Experiência | Idioma, voz, humor e módulos desejados | Aplica preferências; sensores continuam dependendo de ativação explícita |
| 7. Conferência | Revisar escolhas e começar | Resume o que está funcional, pendente e indisponível |

Não oferecer Claude OAuth como login universal antes da validação descrita em [provedores](provedores-e-autenticacao.md). “Agnes” permanece fora da lista de serviços prontos até ser identificado e implementado.

## Configurações: mudar depois, sem reinstalar

A navegação terá **Configurações → Cérebros / Mídia / Conhecimento / Voz / Módulos / Dados / Atualizações**. A pessoa pode conectar mais de um provedor e definir padrões diferentes para texto, visão, imagens e vídeos. O padrão deve sempre mostrar o destino efetivo dos dados.

Na conversa, um seletor de cérebro permite trocar provedor e modelo para o próximo turno. Na geração de mídia, outro seletor permite escolher serviço, modelo e parâmetros compatíveis. A escolha por trabalho não precisa alterar o padrão global.

| Controle | Comportamento esperado |
|---|---|
| Cérebro padrão | Aplica a conversas novas; a conversa atual oferece mudança explícita |
| Modelo da conversa | Aplica ao próximo turno, preservando o histórico canônico |
| Provedor de uma geração | Fica gravado no pedido; trocar o padrão não modifica um trabalho já enviado |
| Módulo ativo | Habilita a função e declara dependências; não liga câmera/mic automaticamente |
| Conta desconectada | Bloqueia novas chamadas nessa conexão; preserva documentos e arquivos locais |
| Troca automática em falhas | Desligada por padrão; quando habilitada, usa destinos e orçamento previamente escolhidos |
| Opção não suportada | Explica o requisito ausente em vez de deixar um botão aparentemente funcional |

Tarefas em andamento permanecem presas à conexão/modelo com que começaram. Antes de desconectar uma conta usada por trabalhos ativos, mostrar o impacto e permitir aguardar ou solicitar cancelamento quando disponível. Não migrar uma geração paga para outro serviço automaticamente.

## Presets para facilitar a escolha

Oferecer presets editáveis, não edições separadas do software:

- **Conhecimento:** conversa, notas, memória e fontes.
- **Criação:** conhecimento mais imagens, vídeos e biblioteca de arquivos.
- **Assistente de trabalho:** conhecimento, voz, tela, foco e ferramentas selecionadas.
- **Personalizado:** escolher cada módulo.

O preset instala/configura somente componentes conhecidos e compatíveis. Não conecta contas nem concede permissões em nome da pessoa. Mudar de preset não exclui dados ou desinstala dependências compartilhadas sem indicar o efeito.

## Como guardar preferências

Separar três camadas:

1. **Padrões do produto**, versionados com o código.
2. **Configuração da pessoa**, fora dos arquivos que a atualização substitui, com versão própria de schema.
3. **Escolha da conversa ou tarefa**, persistida no registro correspondente.

A preferência mais específica prevalece. Segredos são referências a um armazenamento protegido ou ao runtime que gerencia OAuth; não ficam dentro de um preset exportado. Exportar configurações não exporta tokens, chaves ou caminhos pessoais por padrão. Importação mostra uma prévia e exige reconectar serviços na nova máquina.

Na implementação, prever um comando de configuração para quem prefere terminal e uma documentação da configuração declarativa para quem quer automatizar a instalação. Não apresentar exemplos de comando como executáveis antes de eles existirem.

## Atualizações pela interface

A área **Atualizações** mostra versão instalada, versão disponível, canal, resumo de mudanças, requisitos, incompatibilidades e data da última verificação. Haverá canal **Estável** como padrão e **Prévia** opcional, com identificação clara.

Fluxo proposto:

1. A pessoa clica em **Verificar atualizações** ou recebe um aviso, se habilitou a verificação periódica.
2. O Jarvis apresenta mudanças e checa espaço, runtime, compatibilidade dos adaptadores e migrações necessárias.
3. A pessoa escolhe **Atualizar agora** ou **Depois**. Novas tarefas ficam pausadas na janela de manutenção.
4. O sistema aguarda tarefas ativas ou explica a interrupção necessária; trabalhos remotos mantêm seus IDs para reconciliação.
5. Cria backup consistente de configuração e banco; preserva documentos e mídia. Mostra onde está o backup e seu estado de verificação.
6. Baixa a release oficial, verifica sua autenticidade e integridade e prepara a instalação em diretório separado.
7. Aplica migrações na cópia preparada, executa checagens e troca a versão ativa somente após sucesso.
8. Reinicia, reconcilia tarefas e informa o resultado. Se falhar, mantém ou restaura a versão anterior com seu banco compatível.

O pacote deverá ter manifesto assinado, checksum e versão dos schemas. Checksum sozinho verifica integridade, não identidade do publicador. A atualização não executa scripts arbitrários enviados por um catálogo de terceiros.

Uma página web sozinha não substitui os arquivos do servidor: será necessário um gerenciador local de releases, com permissão limitada à instalação do Jarvis v7. Até esse gerenciador existir, oferecer instruções de atualização manual verificáveis e mostrar a limitação na interface.

## Instalação comum e instalação para desenvolvimento

| Tipo | Atualização proposta | Proteção principal |
|---|---|---|
| Usuário de release empacotada | Botão na interface, executado pelo gerenciador local | Versões lado a lado, backup e troca atômica |
| Desenvolvedor usando Git | Guia para revisar mudanças e atualizar branch/tag | Detectar alterações locais; nunca sobrescrever o trabalho da pessoa |
| Instância em container | Trocar imagem de versão fixada e executar migração documentada | Dados em volume separado; rollback com snapshot compatível |

Container é um perfil opcional futuro, não o padrão inicial para OAuth e desktop. O updater reconhece o tipo de instalação e não tenta aplicar o procedimento de outro tipo.

## Atualizações diferentes, controles diferentes

- **Aplicação:** release de código, interface e migrações.
- **Catálogo de modelos:** atualização de metadados; não troca o modelo selecionado pela pessoa.
- **Adaptadores/plugins:** versões compatíveis com o contrato do núcleo; instalar código exige origem confiável e decisão explícita.
- **Runtimes Codex/Claude:** detectar compatibilidade e orientar atualização; não atualizar ferramentas globais silenciosamente.
- **OAuth:** renovação de sessão gerenciada pelo provedor; pode exigir reconexão, mas não é uma atualização do Jarvis.

## Voltar à versão anterior

Rollback precisa restaurar **código e estado compatíveis**, não apenas o executável. Se uma migração não for reversível, restaurar snapshot anterior em nova área e explicar a diferença temporal dos dados. Não apagar arquivos criados depois do backup: preservá-los para reconciliação.

Se a versão atual estiver operante e a pessoa solicitar rollback dias depois, criar antes um backup do estado atual e apresentar o impacto. Não desfazer ações externas já concluídas, como documentos enviados ou gerações cobradas; reconciliar os IDs e resultados existentes.

## Critérios de entrega

- Pessoa nova escolhe uma configuração funcional sem editar código.
- Trocar cérebro mantém memórias e fontes; trabalhos ativos não mudam de provedor.
- Modelo indisponível gera explicação e escolha explícita de substituto.
- Exportar preset não contém credenciais e não assume contas do autor.
- Atualização preserva preferências, dados e arquivos e detecta versões incompatíveis.
- Interrupção durante download, migração ou reinício não deixa instalação irrecuperável.
- Rollback recupera um conjunto consistente de código/banco e preserva saídas externas.
- Instalação com mudanças locais em Git não sofre sobrescrita automática.

Esses testes devem ser incluídos em M1 (configuração), M2/M3 (escolhas por conversa/tarefa) e M8 (distribuição e atualização).
