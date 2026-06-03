export type OrderStatus =
  | "NEW"
  | "IN_CREATION"
  | "WAITING_APPROVAL"
  | "READY_FOR_PRINT"
  | "PRINTING"
  | "FINISHED"
  | "DELIVERED"
  | "CANCELED";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  NEW: "Novo",
  IN_CREATION: "Em criação",
  WAITING_APPROVAL: "Aguardando aprovação",
  READY_FOR_PRINT: "Pronto p/ impressão",
  PRINTING: "Em impressão",
  FINISHED: "Finalizado",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
};

export interface OrderItem {
  produto: string;
  cor: string;
  tamanho: string;
  nome: string;
  numero: string;
  quantidade: number;
  valor: number;
}

export interface Order {
  id: string;
  numero: string;
  cliente: string;
  clienteAvatar?: string;
  time: string;
  data: string;
  envio: string;
  status: OrderStatus;
  valor: number;
  responsavel: string;
  observacoes?: string;
  itens: OrderItem[];
}

export const orders: Order[] = [
  {
    id: "1",
    numero: "#2024-089",
    cliente: "Carlos Eduardo",
    time: "Palmeiras",
    data: "01/06/2026",
    envio: "Correios PAC",
    status: "IN_CREATION",
    valor: 189.9,
    responsavel: "Ana Paula",
    observacoes: "Cliente pediu personalização com fonte oficial do clube.",
    itens: [
      { produto: "Palmeiras Home 2024", cor: "Verde", tamanho: "GG", nome: "VEIGA", numero: "23", quantidade: 1, valor: 189.9 },
    ],
  },
  {
    id: "2",
    numero: "#2024-088",
    cliente: "Arena Masters",
    time: "Personalizado",
    data: "01/06/2026",
    envio: "Retirada",
    status: "READY_FOR_PRINT",
    valor: 1450,
    responsavel: "Bruno Lima",
    itens: [
      { produto: "Kit Esportivo Custom", cor: "Azul", tamanho: "Diversos", nome: "ARENA", numero: "—", quantidade: 12, valor: 120.83 },
    ],
  },
  {
    id: "3",
    numero: "#2024-087",
    cliente: "Juliana Silveira",
    time: "Brasil",
    data: "31/05/2026",
    envio: "Sedex",
    status: "NEW",
    valor: 159,
    responsavel: "Ana Paula",
    itens: [{ produto: "Brasil Retro 1970", cor: "Amarela", tamanho: "M", nome: "—", numero: "—", quantidade: 1, valor: 159 }],
  },
  {
    id: "4",
    numero: "#2024-086",
    cliente: "Marcos Oliveira",
    time: "Corinthians",
    data: "31/05/2026",
    envio: "Correios PAC",
    status: "PRINTING",
    valor: 210,
    responsavel: "Bruno Lima",
    itens: [{ produto: "Corinthians II 23/24", cor: "Preta", tamanho: "G", nome: "MARCELINHO", numero: "7", quantidade: 1, valor: 210 }],
  },
  {
    id: "5",
    numero: "#2024-085",
    cliente: "Ana Beatriz Souza",
    time: "São Paulo",
    data: "30/05/2026",
    envio: "Sedex",
    status: "FINISHED",
    valor: 175,
    responsavel: "Ana Paula",
    itens: [{ produto: "São Paulo III 2024", cor: "Vermelha", tamanho: "P", nome: "LUCAS", numero: "10", quantidade: 1, valor: 175 }],
  },
  {
    id: "6",
    numero: "#2024-084",
    cliente: "Rafael Tavares",
    time: "Flamengo",
    data: "30/05/2026",
    envio: "Correios PAC",
    status: "DELIVERED",
    valor: 289.9,
    responsavel: "Ana Paula",
    itens: [{ produto: "Flamengo Home 24", cor: "Rubro-negra", tamanho: "GG", nome: "PEDRO", numero: "9", quantidade: 1, valor: 289.9 }],
  },
  {
    id: "7",
    numero: "#2024-083",
    cliente: "Patricia Mendes",
    time: "Santos",
    data: "29/05/2026",
    envio: "Retirada",
    status: "WAITING_APPROVAL",
    valor: 199,
    responsavel: "Bruno Lima",
    itens: [{ produto: "Santos Retro 2002", cor: "Branca", tamanho: "M", nome: "PELÉ", numero: "10", quantidade: 1, valor: 199 }],
  },
  {
    id: "8",
    numero: "#2024-082",
    cliente: "Fernando Costa",
    time: "Grêmio",
    data: "28/05/2026",
    envio: "Sedex",
    status: "CANCELED",
    valor: 220,
    responsavel: "Ana Paula",
    itens: [{ produto: "Grêmio Home 24", cor: "Tricolor", tamanho: "G", nome: "SUÁREZ", numero: "9", quantidade: 1, valor: 220 }],
  },
];

export interface Customer {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  documento: string;
  cidade: string;
  ativo: boolean;
  totalPedidos: number;
  tabelaPreco: "Padrão" | "Tabela A" | "Tabela B" | "VIP";
}

export const customers: Customer[] = [
  { id: "1", nome: "Carlos Eduardo", email: "carlos@email.com", telefone: "(11) 98765-4321", documento: "123.456.789-00", cidade: "São Paulo / SP", ativo: true, totalPedidos: 14, tabelaPreco: "Padrão" },
  { id: "2", nome: "Arena Masters", email: "contato@arenamasters.com", telefone: "(11) 3456-7890", documento: "12.345.678/0001-00", cidade: "Campinas / SP", ativo: true, totalPedidos: 38, tabelaPreco: "Tabela B" },
  { id: "3", nome: "Juliana Silveira", email: "ju@email.com", telefone: "(21) 99876-5432", documento: "234.567.890-11", cidade: "Rio de Janeiro / RJ", ativo: true, totalPedidos: 5, tabelaPreco: "Padrão" },
  { id: "4", nome: "Marcos Oliveira", email: "marcos@email.com", telefone: "(11) 91234-5678", documento: "345.678.901-22", cidade: "Santo André / SP", ativo: true, totalPedidos: 22, tabelaPreco: "Tabela A" },
  { id: "5", nome: "Ana Beatriz Souza", email: "ana@email.com", telefone: "(11) 95555-1234", documento: "456.789.012-33", cidade: "São Paulo / SP", ativo: true, totalPedidos: 9, tabelaPreco: "Padrão" },
  { id: "6", nome: "Rafael Tavares", email: "rafa@email.com", telefone: "(21) 92222-9999", documento: "567.890.123-44", cidade: "Niterói / RJ", ativo: false, totalPedidos: 3, tabelaPreco: "Padrão" },
  { id: "7", nome: "Patricia Mendes", email: "pat@email.com", telefone: "(13) 91111-2222", documento: "678.901.234-55", cidade: "Santos / SP", ativo: true, totalPedidos: 11, tabelaPreco: "VIP" },
];

export interface Product {
  id: string;
  nome: string;
  categoria: string;
  cor: string;
  tamanhos: string[];
  codigo: string;
  custo: number;
  fornecedor: string;
  ativo: boolean;
}

export const products: Product[] = [
  { id: "1", nome: "Palmeiras Home 2024", categoria: "Camisa Oficial", cor: "Verde", tamanhos: ["P", "M", "G", "GG"], codigo: "PAL-H-24", custo: 89, fornecedor: "Puma Sports", ativo: true },
  { id: "2", nome: "Corinthians II 23/24", categoria: "Camisa Oficial", cor: "Preta", tamanhos: ["P", "M", "G", "GG"], codigo: "COR-A-24", custo: 92, fornecedor: "Nike Brasil", ativo: true },
  { id: "3", nome: "São Paulo III 2024", categoria: "Camisa Oficial", cor: "Vermelha", tamanhos: ["P", "M", "G", "GG"], codigo: "SAO-T-24", custo: 88, fornecedor: "New Balance", ativo: true },
  { id: "4", nome: "Brasil Retro 1970", categoria: "Camisa Retrô", cor: "Amarela", tamanhos: ["M", "G", "GG"], codigo: "BRA-R-70", custo: 75, fornecedor: "Retro Mania", ativo: true },
  { id: "5", nome: "Flamengo Home 24", categoria: "Camisa Oficial", cor: "Rubro-negra", tamanhos: ["P", "M", "G", "GG", "XGG"], codigo: "FLA-H-24", custo: 95, fornecedor: "Adidas", ativo: true },
  { id: "6", nome: "Santos Retro 2002", categoria: "Camisa Retrô", cor: "Branca", tamanhos: ["P", "M", "G"], codigo: "SAN-R-02", custo: 78, fornecedor: "Retro Mania", ativo: true },
  { id: "7", nome: "Grêmio Home 24", categoria: "Camisa Oficial", cor: "Tricolor", tamanhos: ["P", "M", "G", "GG"], codigo: "GRE-H-24", custo: 90, fornecedor: "Umbro", ativo: false },
];

export interface FileRecord {
  id: string;
  nome: string;
  tipo: "Arte Final" | "Mockup" | "Impressão" | "Referência" | "Comprovante";
  pedido: string;
  cliente: string;
  uploadedBy: string;
  uploadedAt: string;
  tamanho: string;
}

export const files: FileRecord[] = [
  { id: "1", nome: "mockup_palmeiras_v2.pdf", tipo: "Mockup", pedido: "#2024-089", cliente: "Carlos Eduardo", uploadedBy: "Designer Marcos", uploadedAt: "Hoje, 09:42", tamanho: "2.4 MB" },
  { id: "2", nome: "logo_arena_masters.png", tipo: "Arte Final", pedido: "#2024-088", cliente: "Arena Masters", uploadedBy: "Designer Marcos", uploadedAt: "Hoje, 08:15", tamanho: "880 KB" },
  { id: "3", nome: "impressao_corinthians.pdf", tipo: "Impressão", pedido: "#2024-086", cliente: "Marcos Oliveira", uploadedBy: "Designer Júlia", uploadedAt: "Ontem, 17:30", tamanho: "3.1 MB" },
  { id: "4", nome: "referencia_brasil70.jpg", tipo: "Referência", pedido: "#2024-087", cliente: "Juliana Silveira", uploadedBy: "Atendimento Ana", uploadedAt: "Ontem, 14:05", tamanho: "640 KB" },
  { id: "5", nome: "comprovante_pix_084.pdf", tipo: "Comprovante", pedido: "#2024-084", cliente: "Rafael Tavares", uploadedBy: "Atendimento Ana", uploadedAt: "30/05, 11:20", tamanho: "120 KB" },
];

export interface User {
  id: string;
  nome: string;
  email: string;
  perfil: "Administrador" | "Atendente" | "Designer" | "Produção";
  ativo: boolean;
  ultimoAcesso: string;
}

export const users: User[] = [
  { id: "1", nome: "Lucas Almeida", email: "lucas@printflow.com", perfil: "Administrador", ativo: true, ultimoAcesso: "Agora" },
  { id: "2", nome: "Ana Paula Ferreira", email: "ana@printflow.com", perfil: "Atendente", ativo: true, ultimoAcesso: "Há 5 min" },
  { id: "3", nome: "Bruno Lima", email: "bruno@printflow.com", perfil: "Atendente", ativo: true, ultimoAcesso: "Há 12 min" },
  { id: "4", nome: "Marcos Andrade", email: "marcos@printflow.com", perfil: "Designer", ativo: true, ultimoAcesso: "Há 2 min" },
  { id: "5", nome: "Júlia Ribeiro", email: "julia@printflow.com", perfil: "Designer", ativo: true, ultimoAcesso: "Há 1h" },
  { id: "6", nome: "Fábio Pereira", email: "fabio@printflow.com", perfil: "Produção", ativo: true, ultimoAcesso: "Há 8 min" },
  { id: "7", nome: "Renato Souza", email: "renato@printflow.com", perfil: "Produção", ativo: false, ultimoAcesso: "Há 3 dias" },
];

export const catalogos = {
  times: ["Palmeiras", "Corinthians", "São Paulo", "Santos", "Flamengo", "Grêmio", "Internacional", "Brasil", "Personalizado"],
  cores: ["Verde", "Preta", "Branca", "Vermelha", "Azul", "Amarela", "Rubro-negra", "Tricolor"],
  tamanhos: ["PP", "P", "M", "G", "GG", "XGG"],
  envios: ["Retirada", "Correios PAC", "Sedex", "Motoboy", "Transportadora"],
};
