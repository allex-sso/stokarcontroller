
import React from 'react';
import { StockItem, User, Supplier, AuditLog, TopConsumedItem, CategoryDistribution, ItemHistory } from './types';

export const AlumasaLogo = () => (
    <div className="text-white">
      <h1 className="text-lg font-bold leading-tight">Alumasa</h1>
      <p className="text-xs font-light leading-tight">Controle do Almoxarifado</p>
    </div>
);

export const ICONS = {
    panel: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
    stock: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>,
    movements: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>,
    control: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m12 0a2 2 0 100-4m0 4a2 2 0 110-4M6 12a2 2 0 100-4m0 4a2 2 0 110-4m12 0a2 2 0 100-4m0 4a2 2 0 110-4" /></svg>,
    audit: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    reports: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    monitoring: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    chevronDown: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
    chevronUp: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>,
    logout: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m-6-3h11.25m-11.25 0l3.75-3.75m-3.75 3.75l3.75 3.75" /></svg>,
};

export const mockStockItems: StockItem[] = [
    { id: '1', code: 'PAR-001', description: 'Parafuso Sextavado M8', equipment: 'Montagem Setor A', location: 'A1-01', unit: 'Unidade', systemStock: 1500, minStock: 500, value: 0.50, supplier: 'Parafusos e Cia' },
    { id: '2', code: 'CHP-010', description: 'Chapa de Aço 1/4"', equipment: 'Corte e Dobra', location: 'B2-05', unit: 'Quilograma', systemStock: 450, minStock: 200, value: 5.50, supplier: 'Aço Forte' },
    { id: '3', code: 'TUB-304', description: 'Tubo Inox 2"', equipment: 'Serralheria', location: 'B2-06', unit: 'Metro', systemStock: 120, minStock: 50, value: 45.00, supplier: 'Aço Forte' },
    { id: '4', code: 'EPI-002', description: 'Amor de', equipment: 'Segurança do Trabalho', location: 'C3-12', unit: 'Par', systemStock: 80, minStock: 100, value: 12.00, supplier: 'Global Suprimentos Industriais' },
    { id: '5', code: 'SOL-005', description: 'Eletrodo para Solda', equipment: 'Manutenção', location: 'A1-02', unit: 'Quilograma', systemStock: 25, minStock: 10, value: 30.00, supplier: 'Global Suprimentos Industriais' },
];

export const mockHistoryData: Record<string, ItemHistory[]> = {
  '1': [
    { id: 'h1-1', date: '12/11/2025', type: 'Saída', quantity: 200, user: 'Operador', requester: 'Montagem Setor A', responsible: 'Carlos' },
    { id: 'h1-2', date: '11/11/2025', type: 'Saída', quantity: 300, user: 'Operador', requester: 'Montagem Setor B', responsible: 'Ana' },
    { id: 'h1-3', date: '10/11/2025', type: 'Entrada', quantity: 2000, user: 'Administrador', details: 'NF 12345, Fornecedor: Parafusos e Cia' },
  ],
  '2': [
    { id: 'h2-1', date: '11/11/2025', type: 'Saída', quantity: 50, user: 'Operador', requester: 'Corte e Dobra', responsible: 'Mariana' },
    { id: 'h2-2', date: '09/11/2025', type: 'Entrada', quantity: 500, user: 'Administrador', details: 'NF 12300, Fornecedor: Aço Forte' },
  ],
  '3': [{ id: 'h3-1', date: '08/11/2025', type: 'Entrada', quantity: 200, user: 'Administrador', details: 'NF 12250, Fornecedor: Aço Forte' }],
  '4': [
    { id: 'h4-1', date: '13/11/2025', type: 'Saída', quantity: 20, user: 'Operador', requester: 'Segurança', responsible: 'Pedro' },
    { id: 'h4-2', date: '01/11/2025', type: 'Entrada', quantity: 100, user: 'Administrador', details: 'NF 12100, Fornecedor: Global Suprimentos Industriais' },
  ],
  '5': [
    { id: 'h5-1', date: '10/11/2025', type: 'Saída', quantity: 5, user: 'Operador', requester: 'Manutenção Corretiva', responsible: 'José' },
    { id: 'h5-2', date: '05/11/2025', type: 'Entrada', quantity: 30, user: 'Administrador', details: 'NF 12150, Fornecedor: Global Suprimentos Industriais' },
  ],
};


export const mockUsers: User[] = [
    { id: 1, name: 'Administrador', email: 'admin@alumasa.com', profile: 'Administrador', avatarUrl: `https://i.pravatar.cc/150?u=admin@alumasa.com` },
    { id: 2, name: 'Operador', email: 'op@alumasa.com', profile: 'Operador', avatarUrl: `https://i.pravatar.cc/150?u=op@alumasa.com` },
];

export const mockSuppliers: Supplier[] = [
    { id: 1, name: 'Aço Forte', contact: 'Carlos Silva', email: 'contato@acoforte.com', phone: '(11) 98765-4321' },
    { id: 2, name: 'Parafusos e Cia', contact: 'Ana Pereira', email: 'vendas@parafusoscia.com.br', phone: '(47) 3333-2222' },
    { id: 3, name: 'Global Suprimentos Industriais', contact: 'Mariana Costa', email: 'global@suprimentos.com', phone: '(21) 1234-5678' },
];

export const mockAuditLogs: AuditLog[] = [
    { id: 1, timestamp: '13/11/2025, 16:03:11', user: 'Administrador', action: 'Fez login no sistema.' },
    { id: 2, timestamp: '13/11/2025, 14:03:05', user: 'Administrador', action: 'Fez login no sistema.' },
    { id: 3, timestamp: '13/11/2025, 15:03:05', user: 'Operador', action: 'Registrou saída de 10 unidade(s) do item SOL-005 para Manutenção.' },
    { id: 4, timestamp: '13/11/2025, 14:33:05', user: 'Administrador', action: 'Criou o item SOL-005 - Eletrodo para Solda.' },
];

export const mockTopConsumed: TopConsumedItem[] = [
    { name: 'Filtros', value: 3800 },
    { name: 'Óleos', value: 2200 },
    { name: 'Luvas EPI', value: 1800 },
    { name: 'Solda', value: 1700 },
    { name: 'Tubos Inox', value: 1500 },
    { name: 'Chapas Aço', value: 1200 },
    { name: 'Parafusos', value: 1000 },
];

export const mockCategoryDistribution: CategoryDistribution[] = [
    { name: 'Matéria-prima', value: 40, items: 2, color: '#34D399' },
    { name: 'Fixadores', value: 20, items: 1, color: '#FBBF24' },
    { name: 'Consumíveis', value: 20, items: 1, color: '#60A5FA' },
    { name: 'EPI', value: 20, items: 1, color: '#F87171' },
];