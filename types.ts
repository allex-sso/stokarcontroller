


export interface StockItem {
  id: string;
  code: string;
  description: string;
  equipment: string;
  location: string;
  unit: 'Unidade' | 'Quilograma' | 'Metro' | 'Par' | 'Bobina' | 'Caixa' | 'Peças' | 'Litro' | 'Pacote' | 'Rolo' | 'Saco' | 'Vara' | 'Lata' | 'Carretel';
  systemStock: number;
  minStock: number;
  value: number;
  countedStock?: number;
  supplier?: string;
}

export interface BaseItemHistory {
  id: string;
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
  id: number;
  name: string;
  email: string;
  profile: 'Administrador' | 'Operador';
  avatarUrl: string;
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