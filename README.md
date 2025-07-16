# Sneakers Shop

**E-commerce completo de tênis com sistema de pagamento integrado**

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![React](https://img.shields.io/badge/React-18.3.1-blue.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

---

## 🚀 Sobre o Projeto

**Sneakers Shop** é um e-commerce moderno e completo para venda de tênis, desenvolvido com as mais recentes tecnologias web. O projeto oferece uma experiência de compra completa, desde a navegação no catálogo até o processamento de pagamentos via MercadoPago.

### ✨ Principais Características

- 🛒 **E-commerce Completo** - Catálogo, carrinho, checkout e gestão de pedidos
- 💳 **Pagamentos Integrados** - MercadoPago (PIX, Cartão, Boleto) 
- 📱 **Design Responsivo** - Interface moderna com TailwindCSS + ShadCN UI
- 🔐 **Sistema de Autenticação** - JWT com diferentes níveis de acesso
- 📊 **Painel Administrativo** - Gestão completa de produtos, pedidos e usuários (feature)
- 🎨 **Animações Fluidas** - Framer Motion para experiência premium
- 📚 **API Documentada** - Swagger UI integrado
- 🛡️ **Segurança Avançada** - Rate limiting, validações (Zod + RHF) e sanitização

---

## 🛠️ Stack Tecnológico

### Frontend
- ⚛️ **React 18.3.1** - Biblioteca UI moderna
- ⚡ **Vite 6.0.5** - Build tool ultrarrápido
- 🎨 **TailwindCSS 3.4.17** - Framework CSS utilitário
- 🧩 **Radix UI** - Componentes acessíveis
- 🎭 **Framer Motion** - Animações avançadas
- 📝 **React Hook Form + Zod** - Formulários e validação
- 🧭 **React Router 7.1.1** - Navegação SPA
- 🖼️ **Lucide React** - Ícones modernos

### Backend
- 🟢 **Node.js** - Runtime JavaScript
- 🚀 **Express 4.19.2** - Framework web minimalista
- 🍃 **MongoDB + Mongoose 8.5.0** - Banco NoSQL
- 🔐 **JWT + bcrypt** - Autenticação segura
- 💳 **MercadoPago 2.7.0** - Gateway de pagamento
- 📚 **Swagger** - Documentação automática da API
- 🛡️ **Express Rate Limit** - Proteção contra spam
- 🔄 **CORS** - Configuração de segurança

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- MongoDB Community/Atlas
- Conta MercadoPago (Sandbox)

### 1. Clone o Repositório
```bash
git clone https://github.com/hugocicillini/sneakers-shop.git
cd sneakers-shop
```

### 2. Configuração do Backend
```bash
# Entre na pasta do servidor
cd server

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Execute o servidor
npm run dev
```

### 3. Configuração do Frontend
```bash
# Em outro terminal, entre na pasta do cliente
cd client

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Execute o cliente
npm run dev
```

### 4. Acesse a Aplicação
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **API Docs**: http://localhost:5000/docs

---

## ⚙️ Variáveis de Ambiente

### Server (.env)
```env
# Servidor
NODE_ENV=development
PORT=5000
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# Database
MONGO_URI=mongodb://localhost:27017/sneakers-shop

# Segurança
JWT_SECRET=sua-chave-secreta-super-segura
JWT_EXPIRATION=7d
CORS_ORIGIN=http://localhost:3000

# MercadoPago
MERCADO_PAGO_ACCESS_TOKEN=seu-access-token
MERCADO_PAGO_PUBLIC_KEY=sua-public-key

# Rate Limiting
API_RATE_LIMIT=300
API_RATE_LIMIT_WINDOW=15
```

### Client (.env)
```env
# API Configuration
VITE_API_URL=http://localhost:5000/api/v1

# App Configuration
VITE_FREE_SHIPPING_PRICE=300

# MercadoPago
VITE_MERCADO_PAGO_PUBLIC_KEY=TEST-your-public-key-here
```

---

## 🎯 Funcionalidades

### 👤 Para Usuários
- ✅ Navegação no catálogo com filtros avançados
- ✅ Sistema de carrinho persistente
- ✅ Checkout com múltiplas formas de pagamento
- ✅ Acompanhamento de pedidos em tempo real
- ✅ Sistema de avaliações e wishlist
- ✅ Gerenciamento de perfil e endereços
- ✅ Histórico completo de compras

### 🔧 Técnicas
- ✅ API RESTful documentada com Swagger
- ✅ Autenticação JWT com refresh tokens
- ✅ Upload de imagens otimizado
- ✅ Sistema de cache e performance
- ✅ Validações robustas (frontend + backend)
- ✅ Rate limiting e segurança
- ✅ Logs estruturados e monitoramento

---

## 🗄️ Modelos de Dados

### Principais Entities
- **User** - Usuários (cliente/admin) com sistema de pontos
- **Sneaker** - Produtos com variantes e imagens
- **Order** - Pedidos com histórico de status
- **Cart** - Carrinho persistente por usuário
- **Category/Brand** - Organização do catálogo
- **Coupon** - Sistema de descontos avançado
- **Review** - Avaliações com rating automático
- **Address** - Múltiplos endereços por usuário

---

## 📊 API Endpoints

### Autenticação
```
POST /api/v1/users/register    # Cadastro
POST /api/v1/users/login       # Login
```

### Produtos
```
GET    /api/v1/sneakers              # Listar produtos
GET    /api/v1/sneakers/:slug        # Produto específico
POST   /api/v1/sneakers              # Criar produto (admin)
PUT    /api/v1/sneakers/:sneakerId   # Atualizar produto (admin)
DELETE /api/v1/sneakers/:sneakerId   # Remover produto (admin)
```

### Pedidos
```
GET  /api/v1/orders/user           # Meus pedidos
POST /api/v1/orders                # Criar pedido
GET  /api/v1/orders/:orderId       # Detalhes do pedido
```

### Carrinho
```
GET    /api/v1/carts               # Meu carrinho
POST   /api/v1/carts               # Adicionar item
PATCH  /api/v1/carts/cartItemId    # Atualizar quantidade
DELETE /api/v1/carts/cartItemId    # Remover item
```

**📚 Documentação Completa da API:** http://localhost:5000/docs

---

## 🔒 Segurança

- 🛡️ **Autenticação JWT** com tokens seguros
- 🔐 **Bcrypt** para hash de senhas
- 🚫 **Rate Limiting** contra ataques DDoS
- ✅ **Validação rigorosa** de inputs
- 🌐 **CORS** configurado adequadamente
- 📝 **Logs** de segurança e auditoria
- 🔒 **Variáveis de ambiente** para dados sensíveis

---

## 🚀 Deploy

### Backend (Render)
```bash
# Build de produção
npm run build

# Configurar variáveis de ambiente na plataforma
# Conectar com MongoDB Atlas
# Deploy automático via Git
```

### Frontend (Vercel/Netlify)
```bash
# Build de produção
npm run build

# Deploy automático via Git
# Configurar variáveis de ambiente
```

---

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 📞 Contato

**Desenvolvedor**: Hugo Cicillini  
**LinkedIn**: [Hugo Cicillini](https://linkedin.com/in/hugocicillini)  
**Portfolio**: [Seu Portfolio](https://portfolio-hcicillini.netlify.app)

---

**⭐ Dê uma estrela se gostou do projeto!**
