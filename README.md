📝 Sobre o Projeto
Este projeto é um clone funcional do sistema de controle de almoxarifado da Alumasa, desenvolvido como um exercício prático para demonstrar habilidades em desenvolvimento frontend moderno e integração com serviços de backend (BaaS). A aplicação foi construída utilizando React, TypeScript e Tailwind CSS, com o Supabase servindo como backend para autenticação, banco de dados e armazenamento.
O sistema permite o gerenciamento completo de um almoxarifado, desde o cadastro de itens e fornecedores até o registro detalhado de todas as movimentações de estoque, oferecendo uma interface limpa, responsiva e intuitiva para os operadores e administradores.
✨ Funcionalidades Principais
Dashboard Interativo: Visualização rápida dos principais indicadores do almoxarifado, como valor total em estoque, itens abaixo do mínimo, e um resumo das entradas e saídas por período.
Gestão de Estoque Completa (CRUD):
Cadastro, edição e exclusão de itens.
Importação de itens em massa via arquivo CSV.
Geração de etiquetas individuais ou em lote com QR Code (em formato para impressão e ZPL).
Controle de Movimentações:
Registro de entradas de materiais (com informações de fornecedor, nota fiscal, etc.).
Registro de saídas de materiais (com informações de solicitante e responsável).
Inventário de Estoque: Ferramenta para contagem física dos itens e ajuste automático do estoque no sistema com base nas divergências encontradas.
Módulo de Controle e Cadastros:
Gerenciamento de usuários (perfis de Administrador e Operador).
Gerenciamento de fornecedores.
Auditoria e Monitoramento: Rastreamento de todas as ações importantes realizadas no sistema, com filtros por usuário e ação.
Relatórios Gerenciais:
Relatório de itens com estoque abaixo do mínimo, com funcionalidade para gerar um pedido de compra.
Relatório de movimentações por período.
Relatório de valor consolidado por localização no estoque.
Autenticação e Perfis: Sistema de login seguro e gerenciamento de perfil de usuário, incluindo a alteração da foto de perfil.
🚀 Tecnologias Utilizadas
Frontend:
React: Biblioteca para construção da interface de usuário.
TypeScript: Para um código mais seguro e manutenível.
Tailwind CSS: Para estilização rápida e responsiva.
React Router: Para gerenciamento de rotas na aplicação.
Backend & Banco de Dados (BaaS):
Supabase:
PostgreSQL Database: Para armazenamento de todos os dados da aplicação.
Authentication: Gerenciamento de usuários e login.
Storage: Para upload e armazenamento de avatares de usuários.
Database Functions (RPC): Para operações atômicas no banco de dados, como o incremento e decremento de estoque.
⚙️ Como Executar o Projeto
Siga os passos abaixo para configurar e executar o projeto em seu ambiente local.
Pré-requisitos
Node.js (versão 18 ou superior)
npm ou yarn
Uma conta no Supabase para criar seu próprio backend.
Passos
Clone o repositório:
code
Bash
git clone https://github.com/seu-usuario/alumasa-almoxarifado.git
cd alumasa-almoxarifado
Instale as dependências:
code
Bash
npm install
Configure o Supabase:
Crie um novo projeto no Supabase.
No editor de SQL do Supabase, execute o script SQL para criar as tabelas e funções necessárias (você pode extrair o schema do arquivo supabaseClient.ts e das estruturas de dados em types.ts). As tabelas principais são: stock_items, users, suppliers, audit_logs, item_history.
Vá para Project Settings > API.
Copie a URL do Projeto e a Chave anônima (public).
Configure as variáveis de ambiente:
No arquivo supabaseClient.ts, substitua os valores de supabaseUrl e supabaseAnonKey pelas chaves que você copiou do seu projeto Supabase.
Execute a aplicação:
code
Bash
npm run dev
A aplicação estará disponível em http://localhost:5173 (ou outra porta indicada no terminal).
🔑 Credenciais de Demonstração
Para acessar a versão de demonstração, utilize as seguintes credenciais:
E-mail: admin@alumasa.com
Senha: 123456
