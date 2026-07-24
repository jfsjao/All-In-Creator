# All In Creator — Frontend

Aplicação web da plataforma All In Creator, desenvolvida com Angular 20. O
frontend reúne as páginas públicas, autenticação, checkout, área do cliente,
biblioteca de conteúdos, downloads, gerenciamento da conta e painel
administrativo.

Em produção, a aplicação é compilada como site estático com páginas públicas
pré-renderizadas. O GitHub Actions valida, testa e publica o conteúdo na
Hostinger por SSH.

## Conteúdo

- [Tecnologias](#tecnologias)
- [Funcionalidades e rotas](#funcionalidades-e-rotas)
- [Arquitetura](#arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Configuração do ambiente](#configuração-do-ambiente)
- [Execução local](#execução-local)
- [Comandos disponíveis](#comandos-disponíveis)
- [Build de produção](#build-de-produção)
- [Testes](#testes)
- [CI/CD e deploy](#cicd-e-deploy)
- [Segurança](#segurança)
- [Solução de problemas](#solução-de-problemas)

## Tecnologias

- Angular 20 com componentes standalone e lazy loading
- TypeScript 5.8
- RxJS
- Firebase Authentication
- Angular HTTP Client com `fetch`
- Angular SSR/prerender para as páginas públicas
- Bootstrap 5, ng-bootstrap e Bootstrap Icons
- ngx-toastr
- Karma e Jasmine
- GitHub Actions
- Hostinger, Apache, SSH e rsync
- Git LFS para arquivos de mídia grandes

## Funcionalidades e rotas

### Páginas públicas

| Rota | Finalidade |
| --- | --- |
| `/home` | Página inicial e apresentação da plataforma |
| `/plans` | Planos e ofertas |
| `/about` | Informações sobre a empresa |
| `/contact` | Formulário e canais de contato |
| `/terms` | Termos de uso |
| `/auth` | Login e cadastro |
| `/auth/action` | Ações recebidas por link do Firebase |
| `/verify-email` | Verificação de e-mail |
| `/reset-password` | Recuperação de senha |
| `/payment/success` | Resultado de pagamento aprovado |
| `/payment/pending` | Resultado de pagamento pendente |
| `/payment/failure` | Resultado de pagamento recusado |

### Páginas protegidas

| Rota | Proteção | Finalidade |
| --- | --- | --- |
| `/checkout` | Usuário autenticado | Finalização da compra |
| `/client-area` | Usuário autenticado | Área principal do cliente |
| `/library` | Usuário autenticado | Biblioteca de conteúdos |
| `/my-downloads` | Usuário autenticado | Histórico e acesso aos downloads |
| `/my-account` | Usuário autenticado | Perfil e configurações da conta |
| `/admin` | Usuário autenticado e administrador | Administração da plataforma |

Os guards do frontend melhoram a navegação, mas não substituem a autorização no
backend. Toda operação protegida deve validar novamente o token e as permissões
no servidor.

## Arquitetura

```text
src/
├── app/
│   ├── components/       # Componentes compartilhados
│   ├── config/           # Rotas e configuração da aplicação
│   ├── core/             # API, Firebase, guards, modelos e serviços
│   └── pages/            # Páginas carregadas por rota
├── assets/               # Imagens, vídeos, fontes e ícones
├── environments/         # URLs e configuração de ambiente
├── styles/               # Estilos globais e tokens SCSS
└── testing/              # Testes de fluxos principais

scripts/
├── configure-environment.mjs
└── clean.mjs

.github/workflows/deploy.yml
```

### Ambientes

| Arquivo | Uso | Versionado |
| --- | --- | --- |
| `src/environments/environment.ts` | Desenvolvimento local | Sim |
| `src/environments/environment.prod.ts` | URLs de produção e template do build | Sim |
| `src/environments/firebase.local.ts` | Configuração Firebase gerada localmente ou no CI | Não |
| `.env` | Origem da configuração local | Não |
| `.env.example` | Lista das variáveis necessárias | Sim |

Angular não interpreta `.env` diretamente. Antes de iniciar ou compilar, o
script `scripts/configure-environment.mjs` lê o arquivo e gera
`src/environments/firebase.local.ts`.

## Pré-requisitos

- Node.js `20.19+` ou `22.12+`
- npm
- Git
- Git LFS
- Google Chrome/Chromium para executar os testes localmente
- Backend da plataforma para testar fluxos integrados

Confira o ambiente:

```bash
node --version
npm --version
git --version
git lfs version
```

O backend local é esperado em `http://localhost:3333`. O frontend é servido em
`http://localhost:4200`.

## Configuração do ambiente

### 1. Baixe os arquivos do Git LFS

Após clonar o repositório:

```bash
git lfs install
git lfs pull
```

Sem Git LFS, arquivos como `src/assets/videos/home_video.mp4` podem permanecer
apenas como ponteiros de texto e o build/deploy ficará incompleto.

### 2. Instale as dependências

```bash
npm ci
```

Use `npm ci` para instalações reproduzíveis baseadas no `package-lock.json`.
Utilize `npm install` apenas ao adicionar, atualizar ou remover dependências.

### 3. Configure as variáveis locais

No Linux/macOS:

```bash
cp .env.example .env
```

No PowerShell:

```powershell
Copy-Item .env.example .env
```

Preencha:

| Variável | Obrigatória localmente | Descrição |
| --- | --- | --- |
| `FIREBASE_API_KEY` | Sim | API key do aplicativo Web Firebase |
| `FIREBASE_AUTH_DOMAIN` | Sim | Domínio de autenticação |
| `FIREBASE_DATABASE_URL` | Não | URL do Realtime Database, se utilizado |
| `FIREBASE_PROJECT_ID` | Sim | ID do projeto Firebase |
| `FIREBASE_STORAGE_BUCKET` | Sim | Bucket do Firebase Storage |
| `FIREBASE_MESSAGING_SENDER_ID` | Sim | ID do remetente |
| `FIREBASE_APP_ID` | Sim | ID do aplicativo Web |
| `PROD_API_URL` | Não para `ng serve` | URL pública do backend no deploy |
| `PROD_FRONTEND_URL` | Não para `ng serve` | URL pública do frontend no deploy |

Não coloque aspas quando elas não forem necessárias:

```dotenv
FIREBASE_PROJECT_ID=meu-projeto
FIREBASE_AUTH_DOMAIN=meu-projeto.firebaseapp.com
```

O `.env` e o arquivo Firebase gerado estão no `.gitignore`.

### 4. URLs local e de produção

- Desenvolvimento: `src/environments/environment.ts`
- Produção: `src/environments/environment.prod.ts`
- CI/CD: `PROD_API_URL` e `PROD_FRONTEND_URL` sobrescrevem as URLs durante o
  workflow

Não use `localhost` em um build que será publicado. No navegador do cliente,
`localhost` apontaria para a própria máquina do visitante.

## Execução local

Com o backend iniciado na porta `3333`:

```bash
npm start
```

Acesse:

```text
http://localhost:4200
```

Também é possível utilizar:

```bash
npm run dev
```

Os dois comandos preparam o Firebase e executam o Angular Dev Server. Alterações
no código provocam recompilação automática.

## Comandos disponíveis

| Comando | Descrição |
| --- | --- |
| `npm start` | Prepara o ambiente e inicia o servidor de desenvolvimento |
| `npm run dev` | Equivalente ao fluxo de desenvolvimento |
| `npm run build` | Gera o build otimizado de produção |
| `npm run build:prod` | Alias explícito do build de produção |
| `npm run serve:prod` | Serve localmente usando a configuração de produção |
| `npm run watch` | Compila em modo development e observa alterações |
| `npm test` | Inicia os testes Karma |
| `npm run test:ci` | Executa toda a suíte uma vez no Chrome headless |
| `npm run test:main-screens` | Testa as telas principais |
| `npm run test:buttons-routes` | Testa botões e navegação |
| `npm run test:auth-flow` | Testa autenticação |
| `npm run test:post-login` | Testa os fluxos após o login |
| `npm run clean` | Remove o diretório `dist` |

Use os comandos do `package.json` em vez de uma instalação global do Angular
CLI. Isso garante que a versão correta do projeto seja utilizada.

## Build de produção

```bash
npm run build
```

Saída:

```text
dist/public/
├── browser/                 # Conteúdo publicável na hospedagem
├── prerendered-routes.json
└── 3rdpartylicenses.txt
```

Somente o conteúdo de `dist/public/browser` deve ser enviado para a raiz pública
da Hostinger.

Antes de publicar manualmente, confira:

```bash
test -f dist/public/browser/index.html
test -f dist/public/browser/assets/videos/home_video.mp4
```

O deploy adiciona `.htaccess` ao artefato. Ele direciona URLs que não
correspondem a arquivos reais para `index.html`, permitindo abrir diretamente
rotas como `/plans` e `/client-area` no Apache.

## Testes

### Suíte completa

```bash
npm run test:ci
```

### Testes por fluxo

```bash
npm run test:main-screens
npm run test:buttons-routes
npm run test:auth-flow
npm run test:post-login
```

Os testes usam `ChromeHeadlessCI`. Se o Chrome não for encontrado:

```bash
export CHROME_BIN=/caminho/para/google-chrome
npm run test:ci
```

No GitHub Actions, o Chrome é instalado automaticamente.

## CI/CD e deploy

O pipeline está em `.github/workflows/deploy.yml`.

### Eventos

| Evento | Comportamento |
| --- | --- |
| Push em `main` | Valida, testa, compila e publica na Hostinger |
| Pull request | Valida, testa e compila; não publica |
| Execução manual | Valida, testa e compila; não publica |

O job `deploy` possui uma condição adicional: somente um `push` na branch
`main` pode alterar a hospedagem.

### Fluxo do pipeline

```text
validate-config
       │
       ├── test-main-screens
       ├── test-buttons-routes
       ├── test-auth-flow
       └── test-post-login
                    │
                  build
                    │
       upload do angular-build
                    │
          deploy (push em main)
                    │
       verificação remota via SSH
```

### O que cada etapa faz

1. `validate-config`
   - verifica a presença dos valores necessários;
   - valida formato das URLs, porta SSH, chave privada e identificadores
     Firebase;
   - impede placeholders no build.
2. Jobs de teste
   - fazem checkout com Git LFS;
   - criam a configuração Firebase;
   - instalam Node.js 20, dependências e Chrome;
   - executam quatro grupos de testes em paralelo.
3. `build`
   - cria os arquivos de ambiente;
   - executa o build otimizado;
   - adiciona o `.htaccess`;
   - verifica `index.html` e o vídeo armazenado com LFS;
   - publica o artifact `angular-build`.
4. `deploy`
   - baixa exatamente o artifact aprovado pelo job anterior;
   - valida a chave SSH e a conectividade com a Hostinger;
   - cria a pasta remota quando necessário;
   - sincroniza o build com `rsync`;
   - lista os arquivos remotos para confirmar o envio.

### GitHub Secrets

Configure em:

```text
Repository → Settings → Secrets and variables → Actions
```

#### Firebase e URLs

| Secret | Obrigatório | Exemplo/formato |
| --- | --- | --- |
| `FIREBASE_API_KEY` | Sim | Normalmente começa com `AIza` |
| `FIREBASE_APP_ID` | Sim | `123456:web:abcdef...` |
| `FIREBASE_AUTH_DOMAIN` | Sim | `projeto.firebaseapp.com` |
| `FIREBASE_MESSAGING_SENDER_ID` | Sim | Somente números |
| `FIREBASE_PROJECT_ID` | Sim | ID do projeto |
| `FIREBASE_STORAGE_BUCKET` | Sim | Bucket do projeto |
| `PROD_API_URL` | Recomendado | `https://api.example.com` |
| `PROD_FRONTEND_URL` | Sim | `https://example.com` |

Se `PROD_API_URL` estiver vazio, o workflow usa temporariamente
`PROD_FRONTEND_URL` como `apiUrl`. Isso só funciona se frontend e API
compartilharem o mesmo domínio e o servidor encaminhar as rotas da API.

#### Hostinger

| Secret | Obrigatório | Conteúdo |
| --- | --- | --- |
| `HOSTINGER_HOST` | Sim | Host ou IP, sem `https://`, usuário ou caminho |
| `HOSTINGER_PORT` | Sim | Porta SSH, somente números |
| `HOSTINGER_USER` | Sim | Usuário SSH |
| `HOSTINGER_SSH_KEY` | Sim | Chave privada completa, incluindo BEGIN/END |
| `HOSTINGER_TARGET` | Sim | Caminho absoluto da pasta pública do domínio |

Exemplo conceitual:

```text
HOSTINGER_HOST=123.123.123.123
HOSTINGER_PORT=65002
HOSTINGER_USER=u123456789
HOSTINGER_TARGET=/home/u123456789/domains/example.com/public_html
```

Não copie os valores de exemplo literalmente.

### Configuração SSH

Use uma chave exclusiva para o deploy, sem reutilizar sua chave pessoal.
Cadastre a chave pública na conta da Hostinger e salve a chave privada completa
em `HOSTINGER_SSH_KEY`.

Teste a conexão localmente antes de configurar o CI:

```bash
ssh -p PORTA USUARIO@HOST
```

### Atenção ao `rsync --delete`

O deploy usa:

```text
rsync -avz --delete
```

Portanto, arquivos presentes em `HOSTINGER_TARGET`, mas ausentes no artifact,
serão removidos. A pasta deve ser exclusiva deste frontend. Não aponte
`HOSTINGER_TARGET` para uma pasta que também contenha uploads, dados do backend,
e-mails ou outros sites.

### Deploy manual pelo GitHub

O evento `workflow_dispatch` executa validação, testes e build, mas a condição
atual do job impede a publicação. Para publicar, faça merge/push na `main`.

### Rollback

O workflow não mantém releases no servidor. Para reverter:

1. identifique o último commit estável;
2. crie um commit que reverta a alteração problemática;
3. envie esse commit para `main`;
4. acompanhe o novo workflow até a verificação remota.

Exemplo:

```bash
git revert ID_DO_COMMIT
git push origin main
```

Não use `git reset --hard` em uma branch compartilhada para fazer rollback.

### Proteções recomendadas para `main`

- exigir pull request;
- exigir aprovação;
- exigir todos os jobs de teste e build;
- impedir push forçado;
- impedir merge enquanto o branch estiver desatualizado;
- limitar quem pode alterar Secrets e workflows.

Pull requests vindos de forks não recebem GitHub Secrets por segurança. Como o
workflow atual valida esses valores, contribuições externas podem precisar de
um workflow de CI separado com configuração Firebase de teste.

## Segurança

### Repositório público

O frontend pode permanecer público se isso for uma decisão consciente. Código
executado no navegador não deve conter segredos, mesmo quando o repositório é
privado.

A configuração Web Firebase é visível ao usuário e identifica o projeto; ela não
substitui mecanismos de autorização. Configure:

- Firebase Security Rules;
- restrições da API key no Google Cloud;
- domínios autorizados no Firebase Authentication;
- App Check, quando aplicável;
- validação de token e perfil administrativo no backend;
- CORS restrito aos domínios necessários.

Nunca versione:

- `.env`;
- chaves SSH;
- service-account JSON;
- senhas;
- tokens de acesso ou refresh;
- segredos de gateway de pagamento;
- credenciais de banco de dados;
- variáveis privadas do backend.

Se um segredo já apareceu em um commit, adicionar o arquivo ao `.gitignore` não
resolve. Revogue ou rotacione o segredo e depois avalie a limpeza do histórico.

## Solução de problemas

### Configuração Firebase ausente

Mensagem:

```text
Variáveis obrigatórias ausentes no .env
```

Solução:

```bash
cp .env.example .env
```

Preencha todas as variáveis obrigatórias e execute `npm start` novamente.

### `git-lfs: comando não encontrado`

Instale o Git LFS e execute:

```bash
git lfs install
git lfs pull
```

### O frontend abre, mas a API falha

Confira:

- backend ativo na porta `3333`;
- `apiUrl` do ambiente correto;
- CORS do backend permitindo `http://localhost:4200`;
- token Firebase enviado e aceito;
- nenhuma URL de produção apontando para `localhost`.

### Atualizar a página retorna 404 na Hostinger

Confirme se `.htaccess` existe na pasta definida por `HOSTINGER_TARGET` e se o
Apache permite `mod_rewrite`.

### O workflow falha na conexão SSH

Confira:

- SSH habilitado na Hostinger;
- host sem protocolo;
- porta correta;
- usuário correto;
- chave pública cadastrada;
- chave privada completa no GitHub Secret;
- caminho remoto pertencente ao usuário SSH.

### O build local passa, mas o deploy falha no vídeo

O CI exige que `home_video.mp4` tenha sido baixado pelo Git LFS e tenha mais de
1 MB. Execute `git lfs pull`, confirme o arquivo e envie o objeto LFS ao remoto.

### Chrome não encontrado nos testes

Defina `CHROME_BIN` com o executável local ou instale Google Chrome/Chromium. No
CI, a instalação é feita pelo workflow.

## Licença e manutenção

Este repositório não possui um arquivo de licença no momento. Em um repositório
público, adicione uma licença explícita se terceiros puderem utilizar,
modificar ou redistribuir o código.

Ao alterar dependências, configuração de ambiente, estrutura do build ou
hospedagem, atualize este README e o workflow no mesmo pull request.
