# 🌱 Nutriveg 

🌐 [Acesse a aplicação](https://nutriveg.vercel.app/)

Este repositório contém apenas o **back-end** da aplicação.  
O código do **front-end** pode ser acessado em:  
🔗 [Repositório do Front-end](https://github.com/juliatvrs/nutriveg-frontend)

## 📖 Sobre o projeto  

O **Nutriveg** é uma aplicação web voltada para o público **vegano e vegetariano**, com o objetivo de ser um espaço onde esse público pode encontrar facilmente **receitas** e **artigos de profissionais da nutrição**.  

Na plataforma:  

👥 **Usuários comuns** podem:  
- Publicar e visualizar receitas.  
- Avaliar receitas de outros usuários.  
- Excluir as receitas que publicaram.  
- Visualizar perfis de outros usuários comuns e de nutricionistas.  
- Ler artigos publicados por nutricionistas.  

👩‍⚕️ **Nutricionistas** podem:  
- Realizar todas as ações dos usuários comuns.  
- Publicar artigos profissionais na plataforma.  

O objetivo é criar uma comunidade colaborativa e confiável, conectando pessoas interessadas em alimentação vegana e vegetariana com **conteúdo de qualidade** e **profissionais da área**.  

## 🚀 Tecnologias utilizadas

- [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [MySQL](https://www.mysql.com/)
- [Bcrypt](https://www.npmjs.com/package/bcrypt)
- [JSON Web Token](https://www.npmjs.com/package/jsonwebtoken)
- [Multer](https://www.npmjs.com/package/multer) + [Cloudinary](https://cloudinary.com/)
- [dotenv](https://www.npmjs.com/package/dotenv)
- Outros utilitários: CORS, DOMPurify + jsdom, path, Nodemon

## 💻 Como rodar o projeto localmente

1. Clone este repositório em sua máquina:
   ```bash
   git clone https://github.com/juliatvrs/nutriveg-backend.git

2. Acesse a pasta do projeto:
   ```bash
   cd nutriveg-backend

3. Instale as dependências:
   ```bash
   npm install

4. Configure o banco de dados:

- Crie um banco de dados MySQL
- Execute o script SQL disponível no repositório (`schema.sql`) para criar as tabelas e inserir dados iniciais

5. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
- JWT_SECRET
- PORT
- DB_HOST
- DB_PORT
- DB_USER
- DB_PASSWORD
- DB_NAME
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET

7. Inicie o servidor:
   ```bash
   npm start

8. O back-end estará disponível em: `http://localhost:<PORT>/`

> 💡 Observação:
> 
> - Caso queira testar o front-end localmente com o back-end local, altere a URL da API no front-end para `http://localhost:<PORT>/`.
> - Se preferir, você pode continuar usando o front-end conectado ao back-end hospedado na nuvem sem rodar o servidor local.

## 👩‍💻 Autoras

- **[Júlia Tavares Magalhães](https://www.linkedin.com/in/tavares-julia)** – desenvolvimento do front-end e back-end da aplicação.  
- **[Stefany Monteiro dos Santos](https://www.linkedin.com/in/stefanymonteiro/)** – design da aplicação e modelagem do banco de dados.
