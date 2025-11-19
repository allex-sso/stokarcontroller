
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { StockItem, Supplier, ItemHistory, WAREHOUSE_CATEGORIES, UNIT_OPTIONS } from '../types';

interface EstoquePageProps {
  stockItems: StockItem[];
  suppliers: Supplier[];
  showToast: (message: string) => void;
  historyData: Record<string, ItemHistory[]>;
  onAddItem: (item: Omit<StockItem, 'id' | 'system_stock' | 'suppliers'>) => Promise<void>;
  onBulkAddItems: (items: Omit<StockItem, 'id' | 'system_stock' | 'suppliers'>[]) => Promise<void>;
  onUpdateItem: (itemId: string, itemData: Partial<StockItem>) => Promise<void>;
  onDeleteItem: (item: StockItem) => Promise<void>;
}

export const EstoquePage: React.FC<EstoquePageProps> = ({
  stockItems,
  suppliers,
  showToast,
  historyData,
  onAddItem,
  onBulkAddItems,
  onUpdateItem,
  onDeleteItem
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isFilterActive = queryParams.get('filtro') === 'abaixo-minimo';

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  
  // SlideOver / Modal States
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<StockItem> | null>(null);
  const [historyItem, setHistoryItem] = useState<StockItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<StockItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ITEMS_PER_PAGE = 10;

  const displayedItems = useMemo(() => {
    let items = stockItems;

    if (isFilterActive) {
      items = items.filter(i => i.system_stock <= i.min_stock);
    }

    if (search) {
      const lowerSearch = search.toLowerCase();
      items = items.filter(i => 
        i.code.toLowerCase().includes(lowerSearch) ||
        i.description.toLowerCase().includes(lowerSearch) ||
        (i.equipment && i.equipment.toLowerCase().includes(lowerSearch))
      );
    }
    return items;
  }, [stockItems, isFilterActive, search]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return displayedItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [displayedItems, currentPage]);

  const totalPages = Math.ceil(displayedItems.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, isFilterActive]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItems(displayedItems.map(i => i.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(i => i !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
          const formData = editingItem as any;
          // Basic validation
          if (!formData.code || !formData.description) {
              showToast('Preencha os campos obrigatórios.');
              setIsSubmitting(false);
              return;
          }

          const payload = {
              ...formData,
              initial_stock: Number(formData.initial_stock || 0),
              min_stock: Number(formData.min_stock || 0),
              value: Number(formData.value || 0),
              supplier_id: formData.supplier_id ? Number(formData.supplier_id) : null
          };

          if (formData.id) {
              await onUpdateItem(formData.id, payload);
              showToast('Item atualizado com sucesso!');
          } else {
              await onAddItem(payload);
              showToast('Item adicionado com sucesso!');
          }
          setIsSlideOverOpen(false);
          setEditingItem(null);
      } catch (error) {
          console.error(error);
          showToast('Erro ao salvar item.');
      } finally {
          setIsSubmitting(false);
      }
  };

  // File import handler
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(!file) return;

      const reader = new FileReader();
      reader.onload = async (evt) => {
          const text = evt.target?.result as string;
          // Simple CSV parser: Code;Description;Category;Unit;MinStock;Value
          const lines = text.split('\n');
          const newItems: any[] = [];
          
          for(let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if(!line) continue;
              const cols = line.split(';');
              if(cols.length >= 2) {
                  newItems.push({
                      code: cols[0]?.trim(),
                      description: cols[1]?.trim(),
                      category: cols[2]?.trim() || 'Outros',
                      unit: cols[3]?.trim() || 'Unidade',
                      min_stock: Number(cols[4]?.replace(',', '.') || 0),
                      value: Number(cols[5]?.replace(',', '.') || 0),
                      initial_stock: Number(cols[6]?.replace(',', '.') || 0),
                      equipment: '',
                      location: ''
                  });
              }
          }
          
          if(newItems.length > 0) {
              await onBulkAddItems(newItems);
          }
          if(fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsText(file);
  };
  
  return (
      <div>
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h1 className="text-2xl font-semibold text-gray-800">Estoque Atual</h1>
            <div className="flex gap-2">
                <div className="relative">
                   <input 
                        type="text" 
                        placeholder="Buscar item..." 
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                <button onClick={() => fileInputRef.current?.click()} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-md text-sm flex items-center">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                     Importar
                </button>
                <button onClick={() => { setEditingItem({}); setIsSlideOverOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md text-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Novo Item
                </button>
            </div>
        </div>

        {isFilterActive && (
            <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4 rounded-md flex justify-between items-center" role="alert">
                <div>
                    <p className="font-bold">Filtro Ativo</p>
                    <p>Mostrando apenas itens com estoque baixo ou igual ao mínimo.</p>
                </div>
                <button
                    onClick={() => navigate('/estoque/atual')}
                    className="text-sm underline hover:text-blue-800"
                >
                    Limpar Filtro
                </button>
            </div>
        )}

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[1600px] table-fixed">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="p-3 w-10"><input type="checkbox" onChange={handleSelectAll} checked={displayedItems.length > 0 && selectedItems.length === displayedItems.length} /></th>
                            <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-24">Código</th>
                            <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Descrição</th>
                            <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-40">Equipamento</th>
                            <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-32">Localização</th>
                            <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-20">Qtd</th>
                            <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-20">Mín</th>
                            <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-28">Valor</th>
                            <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-24">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedItems.map(item => (
                            <tr key={item.id} className={item.system_stock <= item.min_stock ? 'bg-red-50' : 'hover:bg-gray-50'}>
                                <td className="p-3"><input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => handleSelectItem(item.id)} /></td>
                                <td className="p-3 text-sm font-medium text-gray-900 truncate" title={item.code}>
                                    {item.system_stock <= item.min_stock && <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>}
                                    {item.code}
                                </td>
                                <td className="p-3 text-sm text-gray-500 truncate" title={item.description}>{item.description}</td>
                                <td className="p-3 text-sm text-gray-500 truncate" title={item.equipment}>{item.equipment}</td>
                                <td className="p-3 text-sm text-gray-500 truncate" title={item.location}>{item.location}</td>
                                <td className="p-3 text-sm text-gray-500 font-semibold">{item.system_stock}</td>
                                <td className="p-3 text-sm text-gray-500">{item.min_stock}</td>
                                <td className="p-3 text-sm text-gray-500">R$ {item.value?.toFixed(2)}</td>
                                <td className="p-3 text-center relative">
                                    <button onClick={() => setActiveActionMenu(activeActionMenu === item.id ? null : item.id)} className="text-gray-400 hover:text-gray-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                                    </button>
                                    {activeActionMenu === item.id && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 ring-1 ring-black ring-opacity-5">
                                            <div className="py-1">
                                                <button onClick={() => { setEditingItem(item); setIsSlideOverOpen(true); setActiveActionMenu(null); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Editar</button>
                                                <button onClick={() => { setHistoryItem(item); setActiveActionMenu(null); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Histórico</button>
                                                <button onClick={() => { setDeleteItem(item); setActiveActionMenu(null); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Excluir</button>
                                            </div>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             {/* Pagination */}
            {totalPages > 1 && (
                 <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Mostrando <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> a <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, displayedItems.length)}</span> de <span className="font-medium">{displayedItems.length}</span> resultados
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100">
                                    Anterior
                                </button>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100">
                                    Próxima
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Slide Over for Add/Edit */}
        {isSlideOverOpen && (
            <div className="fixed inset-0 overflow-hidden z-50">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsSlideOverOpen(false)}></div>
                    <section className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
                        <div className="w-screen max-w-md">
                            <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
                                <div className="py-6 px-4 bg-blue-700 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-medium text-white">{editingItem?.id ? 'Editar Item' : 'Novo Item'}</h2>
                                        <button onClick={() => setIsSlideOverOpen(false)} className="text-blue-200 hover:text-white">
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="relative flex-1 py-6 px-4 sm:px-6">
                                    <form onSubmit={handleSaveItem} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Código</label>
                                            <input type="text" value={editingItem?.code || ''} onChange={e => setEditingItem({...editingItem, code: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Descrição</label>
                                            <input type="text" value={editingItem?.description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" required />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Categoria</label>
                                                <select value={editingItem?.category || ''} onChange={e => setEditingItem({...editingItem, category: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                                    <option value="">Selecione...</option>
                                                    {WAREHOUSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Unidade</label>
                                                <select 
                                                    value={editingItem?.unit || 'Unidade'} 
                                                    onChange={e => setEditingItem({...editingItem, unit: e.target.value as any})} 
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                >
                                                    {UNIT_OPTIONS.map(unit => (
                                                        <option key={unit} value={unit}>{unit}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">{editingItem?.id ? 'Estoque Atual' : 'Estoque Inicial'}</label>
                                                <input type="number" disabled={!!editingItem?.id} value={editingItem?.id ? editingItem.system_stock : (editingItem?.initial_stock || 0)} onChange={e => setEditingItem({...editingItem, initial_stock: Number(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Estoque Mínimo</label>
                                                <input type="number" value={editingItem?.min_stock || 0} onChange={e => setEditingItem({...editingItem, min_stock: Number(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Valor Unitário (R$)</label>
                                            <input type="number" step="0.01" value={editingItem?.value || 0} onChange={e => setEditingItem({...editingItem, value: Number(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Equipamento</label>
                                            <input type="text" value={editingItem?.equipment || ''} onChange={e => setEditingItem({...editingItem, equipment: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Localização</label>
                                            <input type="text" value={editingItem?.location || ''} onChange={e => setEditingItem({...editingItem, location: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Fornecedor</label>
                                            <select value={editingItem?.supplier_id || ''} onChange={e => setEditingItem({...editingItem, supplier_id: Number(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                                <option value="">Selecione...</option>
                                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="pt-4 flex justify-end">
                                            <button type="button" onClick={() => setIsSlideOverOpen(false)} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 mr-2">Cancelar</button>
                                            <button type="submit" disabled={isSubmitting} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                                {isSubmitting ? 'Salvando...' : 'Salvar'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        )}
        
        {/* Delete Modal */}
        {deleteItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                    <h3 className="text-lg font-bold text-gray-900">Excluir Item?</h3>
                    <p className="mt-2 text-gray-600">Tem certeza que deseja excluir o item <strong>{deleteItem.code} - {deleteItem.description}</strong>?</p>
                    <div className="mt-4 flex justify-end space-x-2">
                        <button onClick={() => setDeleteItem(null)} className="px-4 py-2 bg-gray-200 rounded-md text-gray-800">Cancelar</button>
                        <button onClick={async () => { await onDeleteItem(deleteItem); setDeleteItem(null); }} className="px-4 py-2 bg-red-600 text-white rounded-md">Excluir</button>
                    </div>
                </div>
            </div>
        )}

         {/* History Modal */}
        {historyItem && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white p-6 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Histórico: {historyItem.description}</h3>
                        <button onClick={() => setHistoryItem(null)} className="text-gray-500 hover:text-gray-700">
                            <span className="text-2xl">&times;</span>
                        </button>
                    </div>
                    <div className="overflow-y-auto flex-1">
                        <table className="w-full text-left">
                             <thead>
                                <tr className="bg-gray-50 border-b">
                                    <th className="p-2 text-sm font-semibold">Data</th>
                                    <th className="p-2 text-sm font-semibold">Tipo</th>
                                    <th className="p-2 text-sm font-semibold">Qtd</th>
                                    <th className="p-2 text-sm font-semibold">Usuário</th>
                                    <th className="p-2 text-sm font-semibold">Detalhes</th>
                                </tr>
                             </thead>
                             <tbody>
                                 {historyData[historyItem.id]?.map((h: any, idx: number) => (
                                     <tr key={idx} className="border-b">
                                         <td className="p-2 text-sm">{h.date}</td>
                                         <td className={`p-2 text-sm font-bold ${h.type === 'Entrada' ? 'text-green-600' : 'text-red-600'}`}>{h.type}</td>
                                         <td className="p-2 text-sm">{h.quantity}</td>
                                         <td className="p-2 text-sm">{h.user}</td>
                                         <td className="p-2 text-sm text-gray-500 truncate max-w-xs">
                                             {h.type === 'Entrada' ? h.details : `Solic: ${h.requester}`}
                                         </td>
                                     </tr>
                                 ))}
                                 {(!historyData[historyItem.id] || historyData[historyItem.id].length === 0) && (
                                     <tr><td colSpan={5} className="p-4 text-center text-gray-500">Sem histórico.</td></tr>
                                 )}
                             </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

      </div>
  );
};

interface InventoryPageProps {
  stockItems: StockItem[];
  showToast: (message: string) => void;
  onAdjustInventory: (adjustments: { id: string; counted: number; }[]) => Promise<void>;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({ stockItems, showToast, onAdjustInventory }) => {
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [search, setSearch] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const filteredItems = useMemo(() => {
        if (!search) return stockItems;
        const lower = search.toLowerCase();
        return stockItems.filter(i => 
            i.code.toLowerCase().includes(lower) || 
            i.description.toLowerCase().includes(lower)
        );
    }, [stockItems, search]);

    const handleCountChange = (id: string, value: string) => {
        const num = parseInt(value, 10);
        if (!isNaN(num)) {
            setCounts(prev => ({ ...prev, [id]: num }));
        }
    };

    const handleSaveInventory = async () => {
        setIsSaving(true);
        const adjustments = Object.entries(counts).map(([id, counted]) => ({ id, counted }));
        if (adjustments.length === 0) {
            showToast("Nenhuma contagem registrada.");
            setIsSaving(false);
            return;
        }
        await onAdjustInventory(adjustments);
        setCounts({});
        showToast("Inventário atualizado com sucesso!");
        setIsSaving(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-800">Contagem de Inventário</h1>
                <button onClick={handleSaveInventory} disabled={isSaving || Object.keys(counts).length === 0} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSaving ? 'Salvando...' : 'Salvar Ajustes'}
                </button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md">
                <input 
                    type="text" 
                    placeholder="Filtrar itens para contagem..." 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="p-3 text-sm font-semibold text-gray-600">CÓDIGO</th>
                            <th className="p-3 text-sm font-semibold text-gray-600">DESCRIÇÃO</th>
                            <th className="p-3 text-sm font-semibold text-gray-600">LOCALIZAÇÃO</th>
                            <th className="p-3 text-sm font-semibold text-gray-600">SISTEMA</th>
                            <th className="p-3 text-sm font-semibold text-gray-600">CONTAGEM FÍSICA</th>
                            <th className="p-3 text-sm font-semibold text-gray-600">DIFERENÇA</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map(item => {
                            const counted = counts[item.id];
                            const diff = counted !== undefined ? counted - item.system_stock : 0;
                            return (
                                <tr key={item.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 text-sm text-gray-900 font-medium">{item.code}</td>
                                    <td className="p-3 text-sm text-gray-600">{item.description}</td>
                                    <td className="p-3 text-sm text-gray-500">{item.location}</td>
                                    <td className="p-3 text-sm text-gray-500">{item.system_stock}</td>
                                    <td className="p-3">
                                        <input 
                                            type="number" 
                                            className="w-24 p-1 border border-gray-300 rounded-md text-center focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder={item.system_stock.toString()}
                                            value={counted !== undefined ? counted : ''}
                                            onChange={(e) => handleCountChange(item.id, e.target.value)}
                                        />
                                    </td>
                                    <td className={`p-3 text-sm font-bold ${diff < 0 ? 'text-red-600' : diff > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                        {diff > 0 ? `+${diff}` : diff}
                                    </td>
                                </tr>
                            );
                        })}
                         {filteredItems.length === 0 && (
                            <tr><td colSpan={6} className="text-center p-6 text-gray-500">Nenhum item encontrado.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
