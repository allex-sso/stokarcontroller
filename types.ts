


export const WAREHOUSE_CATEGORIES = [
    'EPI', 
    'Ferramentas', 
    'Materiais de Escritório', 
    'Uniformes', 
    'Consumíveis', 
    'Limpeza', 
    'Matéria-prima', 
    'Componentes Elétricos', 
    'Componentes Mecânicos',
    'Componentes Hidráulicos',
    'Outros'
];

export interface StockItem {
  id: string; // uuid
  code: string;
  description: string;
  category: string;
  equipment: string;
  location: string;
  unit: 'Unidade' | 'Quilograma' | 'Metro' | 'Par' | 'Bobina' | 'Caixa' | 'Peças' | 'Litro' | 'Pacote' | 'Rolo' | 'Saco' | 'Vara' | 'Lata' | 'Carretel';
  system_stock: number;
  initial_stock: number;
  min_stock: number;
  value: number;
  countedStock?: number;
  supplier_id?: number;
  suppliers?: { id: number, name: string }; // For joined data
}

export interface BaseItemHistory {
  id: string; // uuid
  item_id: string; // foreign key to stock_items
  date: string;
  quantity: number;
  user: string;
}

export interface EntryItemHistory extends BaseItemHistory {
  type: 'Entrada';
  details: string;
}

export interface ExitItemHistory extends BaseItemHistory {
  type: 'Saída';
  requester: string;
  responsible: string;
}

export type ItemHistory = EntryItemHistory | ExitItemHistory;

export interface User {
  id: string; // uuid from auth.users
  name: string;
  email: string;
  profile: 'Administrador' | 'Operador';
  avatar_url: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact: string;
  email: string;
  phone: string;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  user: string;
  action: string;
}

export interface TopConsumedItem {
    name: string;
    value: number;
}

export interface CategoryDistribution {
    name: string;
    value: number;
    items: number;
    color: string;
}