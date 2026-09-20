// Grafix Personalize - dados fictícios para uso em sala/testes
// Este script roda automaticamente na PRIMEIRA vez que o contêiner do Mongo
// sobe com um volume vazio (recurso nativo da imagem oficial mongo:7, que
// executa tudo que está em /docker-entrypoint-initdb.d).

db = db.getSiblingDB("grafix-clientes");
db.clientes.insertMany([
  {
    nome: "Ana Beatriz Souza",
    email: "ana.souza@example.com",
    telefone: "77988887777",
    endereco: "Rua das Gráficas, 123 - Vitória da Conquista, BA",
  },
  {
    nome: "Carlos Eduardo Lima",
    email: "carlos.lima@example.com",
    telefone: "77987776666",
    endereco: "Av. Central, 456 - Vitória da Conquista, BA",
  },
  {
    nome: "Fernanda Oliveira",
    email: "fernanda.oliveira@example.com",
    telefone: "77986665555",
    endereco: "Rua do Papel, 789 - Ibicuí, BA",
  },
]);

db = db.getSiblingDB("grafix-produtos");
db.produtos.insertMany([
  { nome: "Cartão de visita (100un)", preco: 45.9, estoque: 120, estoqueMinimo: 20 },
  { nome: "Banner 1x1m", preco: 89.9, estoque: 8, estoqueMinimo: 10 },
  { nome: "Caderno personalizado", preco: 32.5, estoque: 3, estoqueMinimo: 15 },
  { nome: "Adesivo vinil (folha A4)", preco: 12.0, estoque: 200, estoqueMinimo: 30 },
]);

db = db.getSiblingDB("grafix-pedidos");
db.pedidos.insertMany([
  {
    cliente: "Ana Beatriz Souza",
    descricao: "500 cartões de visita",
    status: "Em Produção",
    valorTotal: 229.5,
    dataEntrega: new Date("2026-09-15"),
    observacoes: "Cliente pediu acabamento fosco",
  },
  {
    cliente: "Carlos Eduardo Lima",
    descricao: "2 banners 1x1m para evento",
    status: "Aprovado",
    valorTotal: 179.8,
    dataEntrega: new Date("2026-09-20"),
  },
  {
    cliente: "Fernanda Oliveira",
    descricao: "10 cadernos personalizados para brinde",
    status: "Orçamento",
    valorTotal: 325.0,
    dataEntrega: new Date("2026-10-01"),
  },
  {
    cliente: "Ana Beatriz Souza",
    descricao: "100 adesivos personalizados",
    status: "Entregue",
    valorTotal: 12.0,
    dataEntrega: new Date("2026-08-25"),
  },
]);

print("Seed do Grafix Personalize concluído: clientes, produtos e pedidos inseridos.");
