

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StockItem, ItemHistory, Supplier, WAREHOUSE_CATEGORIES } from '../types';
import { supabase } from '../supabaseClient';


// ============================================================================
// Inventory Page Component
// ============================================================================
interface InventoryPageProps {
    stockItems: StockItem[];
    showToast: (message: string) => void;
    onAdjustInventory: (adjustments: { id: string; counted: number; }[]) => Promise<void>;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({ stockItems, showToast, onAdjustInventory }) => {
  const [countedItems, setCountedItems] = useState<Record<string, number | undefined>>({});

  const handleCountChange = (id: string, value: string) => {
    const count = value === '' ? undefined : parseInt(value, 10);
    if (!isNaN(count) || value === '') {
        setCountedItems(prev => ({ ...prev, [id]: count }));
    }
  };
  
  const countedItemsCount = Object.values(countedItems).filter(v => v !== undefined).length;
  
  const divergenceItems = stockItems.filter(item => {
      const counted = countedItems[item.id];
      return counted !== undefined && counted !== item.system_stock;
  });
  
  const totalAdjustmentValue = divergenceItems.reduce((acc, item) => {
      const counted = countedItems[item.id];
      if (counted !== undefined) {
          const diff = counted - item.system_stock;
          return acc + (diff * (item.value || 0));
      }
      return acc;
  }, 0);
  
  const handleSaveInventory = async () => {
    if (divergenceItems.length === 0) {
        alert("Nenhum item com divergência para ajustar.");
        return;
    }
    if (window.confirm(`Você tem certeza que deseja ajustar o estoque de ${divergenceItems.length} item(s)?`)) {
        const adjustments = divergenceItems.map(item => ({
            id: item.id,
            counted: countedItems[item.id]!
        }));
        
        await onAdjustInventory(adjustments);
        
        setCountedItems({});
        showToast("Inventário salvo e estoque ajustado com sucesso!");
    }
  };


  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Inventário</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-4 mb-4">
            <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-500">Progresso da Contagem</p>
                <p className="text-xl font-bold">{countedItemsCount} de {stockItems.length} itens contados</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-500">Itens com Divergência</p>
                <p className="text-xl font-bold">{divergenceItems.length}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-500">Valor Total do Ajuste</p>
                <p className={`text-xl font-bold ${totalAdjustmentValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalAdjustmentValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-3 text-sm font-semibold text-gray-600">CÓDIGO</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">DESCRIÇÃO</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">ESTOQUE (SISTEMA)</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">QTD. CONTADA</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">DIFERENÇA</th>
                </tr>
              </thead>
              <tbody>
                {stockItems.map(item => {
                  const counted = countedItems[item.id];
                  const difference = counted !== undefined ? counted - item.system_stock : undefined;
                  return (
                    <tr key={item.id} className={`border-b ${difference !== undefined && difference !== 0 ? 'bg-yellow-50' : ''}`}>
                      <td className="p-2 text-sm text-gray-800 font-medium">{item.code}</td>
                      <td className="p-2 text-sm text-gray-500">{item.description}</td>
                      <td className="p-2 text-sm text-gray-500">{item.system_stock}</td>
                      <td className="p-2">
                          <input 
                              type="number" 
                              className="w-24 p-1 border border-gray-300 rounded-md"
                              value={counted ?? ''}
                              onChange={(e) => handleCountChange(item.id, e.target.value)}
                          />
                      </td>
                      <td className={`p-2 text-sm font-bold ${difference === undefined ? 'text-gray-500' : difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                          {difference !== undefined ? (difference > 0 ? `+${difference}` : difference) : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={handleSaveInventory} disabled={divergenceItems.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
              Salvar Inventário ({divergenceItems.length} itens para ajustar)
          </button>
        </div>
      </div>
    </div>
  );
};


// ============================================================================
// Stock List Page Component
// ============================================================================
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

export const EstoquePage: React.FC<EstoquePageProps> = ({ stockItems, suppliers, showToast, historyData, onAddItem, onBulkAddItems, onUpdateItem, onDeleteItem }) => {
  const [displayedItems, setDisplayedItems] = useState<StockItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState<StockItem | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<StockItem | null>(null);

  const [itemToEdit, setItemToEdit] = useState<StockItem | null>(null);
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  
  const [showQrModal, setShowQrModal] = useState<StockItem | null>(null);
  const [showMultiQrModal, setShowMultiQrModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();

  // State for adding a new item
  const [isAddItemPanelOpen, setIsAddItemPanelOpen] = useState(false);
  const initialNewItemState: Partial<StockItem> = {
      code: '',
      description: '',
      category: 'Outros',
      equipment: '',
      location: '',
      unit: 'Unidade',
      system_stock: 0,
      initial_stock: 0,
      min_stock: 0,
      value: 0,
      supplier_id: undefined,
  };
  const [newItem, setNewItem] = useState<Partial<StockItem>>(initialNewItemState);
  const [addFormError, setAddFormError] = useState('');
  const [codeError, setCodeError] = useState('');

  // State for bulk import
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [parsedCsvData, setParsedCsvData] = useState<Partial<StockItem>[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const bulkImportInputRef = useRef<HTMLInputElement>(null);


  const historyModalContentRef = useRef<HTMLDivElement>(null);
  const qrModalContentRef = useRef<HTMLDivElement>(null);
  const multiQrModalContentRef = useRef<HTMLDivElement>(null);

  const ITEMS_PER_PAGE = 10;
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (!(event.target as HTMLElement).closest('[data-menu-container="true"]')) {
            setActiveActionMenu(null);
        }
    };
    if (activeActionMenu) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeActionMenu]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const filter = searchParams.get('filtro');
    
    let filtered = stockItems;

    if (filter === 'abaixo-minimo') {
        filtered = filtered.filter(item => item.system_stock <= item.min_stock);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(item =>
            item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    setDisplayedItems(filtered);
    setCurrentPage(1); // Reset page on filter change
  }, [location.search, stockItems, searchTerm]);
  
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return displayedItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, displayedItems]);

  const totalPages = Math.ceil(displayedItems.length / ITEMS_PER_PAGE);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItems(displayedItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };
  
  const handleConfirmDelete = async () => {
      if(showDeleteModal) {
        await onDeleteItem(showDeleteModal);
        showToast(`Item ${showDeleteModal.code} excluído com sucesso!`);
        setShowDeleteModal(null);
      }
  };
  
  const handleOpenEditPanel = (item: StockItem) => {
    setItemToEdit(item);
    setActiveActionMenu(null);
    setCodeError('');
  };

  const closeEditItemPanel = () => {
    setItemToEdit(null);
    setCodeError('');
  };
  
  const handleEditItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      if (!itemToEdit) return;
      const { name, value } = e.target;
      if (name === 'code') {
        if (!value) {
          setCodeError('O código é obrigatório.');
        } else if (/[^a-zA-Z0-9-]/.test(value)) {
          setCodeError('O código só pode conter letras, números e hífens.');
        } else {
          setCodeError('');
        }
      }
      setItemToEdit(prev => ({ ...prev!, [name]: value }));
  };

  const handleConfirmUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToEdit) return;
    
    const code = itemToEdit.code || '';
    if (!code) {
        setCodeError('O código é obrigatório.');
        return;
    }
    if (/[^a-zA-Z0-9-]/.test(code)) {
        setCodeError('O código só pode conter letras, números e hífens.');
        return;
    }

    const isCodeDuplicate = stockItems.some(item => 
        item.code.toLowerCase() === code.toLowerCase() && item.id !== itemToEdit.id
    );
    if (isCodeDuplicate) {
        setCodeError('Este código de item já existe.');
        return;
    }

    if (!itemToEdit.description || !itemToEdit.location) {
        alert('Por favor, preencha todos os campos obrigatórios (*).');
        return;
    }
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, system_stock, suppliers, countedStock, ...updateData } = itemToEdit;

    const payload: Partial<StockItem> = {
        ...updateData,
        min_stock: Number(updateData.min_stock) || 0,
        value: Number(updateData.value) || 0,
        supplier_id: Number(updateData.supplier_id) || undefined,
    };
    
    await onUpdateItem(itemToEdit.id, payload);
    showToast('Item atualizado com sucesso!');
    closeEditItemPanel();
  };

  const handleAddItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'code') {
      if (!value) {
        setCodeError('O código é obrigatório.');
      } else if (/[^a-zA-Z0-9-]/.test(value)) {
        setCodeError('O código só pode conter letras, números e hífens.');
      } else {
        setCodeError('');
      }
    }
    setNewItem(prev => ({ ...prev, [name]: value }));
  };
  
  const closeAddItemPanel = () => {
    setIsAddItemPanelOpen(false); 
    setAddFormError(''); 
    setCodeError(''); 
    setNewItem(initialNewItemState);
  }

  const handleConfirmAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddFormError('');
    setCodeError('');

    const code = newItem.code || '';
    if (!code) {
        setCodeError('O código é obrigatório.');
        return;
    }
    if (/[^a-zA-Z0-9-]/.test(code)) {
        setCodeError('O código só pode conter letras, números e hífens.');
        return;
    }
     if (stockItems.some(item => item.code.toLowerCase() === code.toLowerCase())) {
      setCodeError('Este código de item já existe.');
      return;
    }
    
    if (!newItem.description || !newItem.location) {
      setAddFormError('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }
    
    const itemToInsert = {
      code: newItem.code,
      description: newItem.description,
      category: newItem.category || 'Outros',
      equipment: newItem.equipment || '',
      location: newItem.location || '',
      unit: newItem.unit || 'Unidade',
      initial_stock: Number(newItem.initial_stock) || 0,
      min_stock: Number(newItem.min_stock) || 0,
      value: Number(newItem.value) || 0,
      supplier_id: Number(newItem.supplier_id) || undefined,
    };
    
    await onAddItem(itemToInsert as any);
    showToast(`Item adicionado com sucesso!`);
    closeAddItemPanel();
  };

  const handlePrint = (contentRef: React.RefObject<HTMLDivElement>) => {
    const content = contentRef.current;
    if (content) {
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Imprimir</title>');
        printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
        printWindow.document.write('</head><body class="p-4">');
        printWindow.document.write(content.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { 
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  const handleSaveZpl = () => {
    if (!showQrModal) return;
    const { code, description } = showQrModal;
    const zpl = `
^XA
^PW400
^LL300
^FO20,30^A0N,44,44^FB360,1,0,C^FD${code}^FS
^FO20,90^A0N,28,28^FB360,2,0,C^FD${description}^FS
^FO125,160^BQN,2,5^FDQA,${code}^FS
^XZ
    `.trim();
    const blob = new Blob([zpl], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `etiqueta_${code}.zpl`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };
  
  const handleSaveAllZpl = () => {
    const selectedStockItems = stockItems.filter(item => selectedItems.includes(item.id));
    if (selectedStockItems.length === 0) return;

    const allZplCommands = selectedStockItems.map(item => {
      const { code, description } = item;
      return `
^XA
^PW400
^LL300
^FO20,30^A0N,44,44^FB360,1,0,C^FD${code}^FS
^FO20,90^A0N,28,28^FB360,2,0,C^FD${description}^FS
^FO125,160^BQN,2,5^FDQA,${code}^FS
^XZ
      `.trim();
    }).join('\n');

    const blob = new Blob([allZplCommands], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `etiquetas_${new Date().toISOString().slice(0,10)}.zpl`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const handleExportHistoryToCsv = () => {
    if (!showHistoryModal) return;
    const history = historyData[showHistoryModal.id] || [];
    if (history.length === 0) {
      alert("Nenhum histórico para exportar.");
      return;
    }
    
    const headers = ['Data', 'Tipo', 'Quantidade', 'Usuário', 'Setor/Solicitante', 'Responsável', 'Detalhes Entrada'];
    const csvContent = [
      headers.join(';'),
      ...history.map(row => {
        const base = [row.date, row.type, row.quantity, row.user];
        if (row.type === 'Saída') {
          return [...base, `"${row.requester.replace(/"/g, '""')}"`, `"${row.responsible.replace(/"/g, '""')}"`, ''].join(';');
        } else { // Entrada
          return [...base, '', '', `"${row.details.replace(/"/g, '""')}"`].join(';');
        }
      })
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); 
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `historico_${showHistoryModal.code}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTemplate = () => {
    const header = "code;description;category;equipment;location;unit;minstock;value;supplier\n";
    const example = "EX-001;Item de Exemplo;Ferramentas;Setor A;A1-01;Unidade;10;99.90;Fornecedor Exemplo";
    const content = header + example;
    const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'modelo_importacao_itens.csv';
    link.click();
  };

  const parseCsvRow = (row: string, delimiter: string): string[] => {
    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;
    let char = '';

    for (let i = 0; i < row.length; i++) {
        char = row[i];

        if (inQuotes) {
            if (char === '"') {
                if (i + 1 < row.length && row[i + 1] === '"') {
                    currentField += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                currentField += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === delimiter) {
                fields.push(currentField);
                currentField = '';
            } else {
                currentField += char;
            }
        }
    }
    fields.push(currentField);
    return fields;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE_MB = 5;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setImportErrors([`Arquivo muito grande. O tamanho máximo é de ${MAX_FILE_SIZE_MB}MB.`]);
        setParsedCsvData([]);
        if (bulkImportInputRef.current) bulkImportInputRef.current.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        let text = e.target?.result as string;
        if (!text) return;

        if (text.charCodeAt(0) === 0xFEFF) {
            text = text.substring(1);
        }

        const rows = text.split(/\r?\n/).filter(row => row.trim() !== '');
        if (rows.length < 1) {
            setImportErrors(["Arquivo CSV vazio ou inválido."]);
            setParsedCsvData([]);
            return;
        }
        
        const firstLine = rows.shift()!.trim();
        const delimiter = firstLine.includes(';') ? ';' : ',';
        
        const header = parseCsvRow(firstLine.toLowerCase(), delimiter).map(h => h.trim().replace(/"/g, ''));
        const newErrors: string[] = [];
        
        const requiredColumns = ["code", "description"];
        const missingColumns = requiredColumns.filter(col => !header.includes(col));
        if (missingColumns.length > 0) {
            newErrors.push(`O cabeçalho do CSV não contém as colunas obrigatórias: ${missingColumns.join(', ')}.`);
            setImportErrors(newErrors);
            setParsedCsvData([]);
            return;
        }

        const columnIndexMap: { [key: string]: number } = {};
        header.forEach((col, index) => {
            columnIndexMap[col] = index;
        });

        const newItems: Partial<StockItem>[] = [];
        rows.forEach((row, index) => {
            const values = parseCsvRow(row, delimiter);

            const code = values[columnIndexMap['code']];
            const description = values[columnIndexMap['description']];

            if (!code || !description) {
                newErrors.push(`Linha ${index + 2}: Código e descrição são obrigatórios.`);
                return;
            }

            if (stockItems.some(i => i.code.toLowerCase() === code.toLowerCase()) || newItems.some(i => i.code?.toLowerCase() === code.toLowerCase())) {
                newErrors.push(`Linha ${index + 2}: Código '${code}' já existe no sistema ou no arquivo.`);
                return;
            }
            
            const category = values[columnIndexMap['category']] || 'Outros';
            const equipment = values[columnIndexMap['equipment']] || '';
            const location = values[columnIndexMap['location']] || '';
            const unit = (values[columnIndexMap['unit']] || 'Unidade') as StockItem['unit'];
            const minStockRaw = values[columnIndexMap['minstock']] || '0';
            const valueRaw = values[columnIndexMap['value']] || '0';
            const supplierName = values[columnIndexMap['supplier']]?.trim() || '';
            const supplier = suppliers.find(s => s.name.toLowerCase() === supplierName.toLowerCase());
            
            const minStockParsed = parseFloat(minStockRaw.replace(',', '.'));
            const valueParsed = parseFloat(valueRaw.replace(',', '.'));

            if (isNaN(minStockParsed) || minStockParsed < 0) {
                newErrors.push(`Linha ${index + 2}: Valor inválido ou negativo para 'minstock': "${minStockRaw}".`);
                return;
            }

            if (isNaN(valueParsed) || valueParsed < 0) {
                newErrors.push(`Linha ${index + 2}: Valor inválido ou negativo para 'value': "${valueRaw}".`);
                return;
            }

            const newItem: Partial<StockItem> = {
                code,
                description,
                category,
                equipment,
                location,
                unit,
                min_stock: minStockParsed,
                value: valueParsed,
                supplier_id: supplier?.id
            };

            newItems.push(newItem);
        });
        setImportErrors(newErrors);
        setParsedCsvData(newItems);
    };
    reader.readAsText(file, 'UTF-8');
    if (bulkImportInputRef.current) bulkImportInputRef.current.value = "";
  };

  const handleConfirmBulkImport = async () => {
    if (parsedCsvData.length === 0) {
        alert("Nenhum item válido para importar.");
        return;
    }
    const itemsToInsert = parsedCsvData.map(item => ({
        code: item.code!,
        description: item.description!,
        category: item.category || 'Outros',
        equipment: item.equipment || '',
        location: item.location || '',
        unit: item.unit || 'Unidade',
        min_stock: item.min_stock!,
        value: item.value!,
        supplier_id: item.supplier_id,
    }));
    
    await onBulkAddItems(itemsToInsert as any);

    setShowBulkImportModal(false);
    setParsedCsvData([]);
    setImportErrors([]);
  };


  const isFilterActive = new URLSearchParams(location.search).get('filtro') === 'abaixo-minimo';
  
  const totalValue = displayedItems.reduce((acc, item) => {
    const stock = Number(item.system_stock);
    const value = Number(item.value);
    const itemValue = (isNaN(stock) ? 0 : stock) * (isNaN(value) ? 0 : value);
    return acc + itemValue;
  }, 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Estoque Atual</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
            <div className="relative text-gray-500 w-full md:max-w-md">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 21L15.803 15.803M15.803 15.803A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                </span>
                <input 
                    className="block w-full bg-white border border-gray-200 rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    type="search" 
                    placeholder="Buscar item por código ou descrição..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4 w-full md:w-auto">
                 <p className="text-gray-600 text-sm hidden lg:block">Total (filtrado): <span className="font-bold text-blue-600">{totalValue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span></p>
                 <button
                  onClick={() => setShowMultiQrModal(true)}
                  disabled={selectedItems.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md text-sm transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  Etiquetas ({selectedItems.length})
                </button>
                <button onClick={() => setShowBulkImportModal(true)} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md flex-shrink-0">Importar</button>
                <button onClick={() => setIsAddItemPanelOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-md flex-shrink-0">+ Novo Item</button>
            </div>
        </div>
        
        {isFilterActive && (
            <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4 rounded-md" role="alert">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="font-bold">Filtro Ativo</p>
                        <p>Mostrando apenas itens com estoque baixo ou igual ao mínimo.</p>
                    </div>
                    <button
                        onClick={() => navigate('/estoque/atual')}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded-md text-sm"
                    >
                        &times; Limpar Filtro
                    </button>
                </div>
            </div>
        )}

        <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1024px] table-fixed">
            <thead>
                <tr className="bg-gray-50 border-b">
                <th className="p-3 w-12"><input type="checkbox" onChange={handleSelectAll} checked={displayedItems.length > 0 && selectedItems.length === displayedItems.length} /></th>
                <th className="p-3 text-sm font-semibold text-gray-600 w-36">CÓDIGO</th>
                <th className="p-3 text-sm font-semibold text-gray-600 min-w-[200px]">DESCRIÇÃO</th>
                <th className="p-3 text-sm font-semibold text-gray-600 w-48">EQUIPAMENTO</th>
                <th className="p-3 text-sm font-semibold text-gray-600 w-40">LOCALIZAÇÃO</th>
                <th className="p-3 text-sm font-semibold text-gray-600 w-32">QUANTIDADE</th>
                <th className="p-3 text-sm font-semibold text-gray-600 w-36">ESTOQUE MÍN.</th>
                <th className="p-3 text-sm font-semibold text-gray-600 w-36">VALOR UNIT.</th>
                <th className="p-3 text-sm font-semibold text-gray-600 text-center w-24">AÇÕES</th>
                </tr>
            </thead>
            <tbody>
                {paginatedItems.map(item => (
                <tr key={item.id} className={`border-b transition-colors duration-200 ${item.system_stock <= item.min_stock ? 'bg-red-50' : ''}`}>
                    <td className="p-3"><input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => handleSelectItem(item.id)} /></td>
                    <td className="p-3 text-sm text-gray-800 font-medium">
                        {item.system_stock <= item.min_stock && <span className="inline-block w-2.5 h-2.5 bg-red-500 rounded-full mr-2" title="Estoque baixo"></span>}
                        {item.code}
                    </td>
                    <td className="p-3 text-sm text-gray-500 truncate max-w-[250px]" title={item.description}>{item.description}</td>
                    <td className="p-3 text-sm text-gray-500">{item.equipment}</td>
                    <td className="p-3 text-sm text-gray-500">{item.location}</td>
                    <td className="p-3 text-sm text-gray-500">{item.system_stock}</td>
                    <td className="p-3 text-sm text-gray-500">{item.min_stock}</td>
                    <td className="p-3 text-sm text-gray-500">{(item.value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="p-3 text-sm text-gray-500 text-center">
                        <div className="relative inline-block text-left" data-menu-container="true">
                            <button onClick={() => setActiveActionMenu(activeActionMenu === item.id ? null : item.id)} className="p-1 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                            </button>
                            {activeActionMenu === item.id && (
                                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                        <button onClick={() => handleOpenEditPanel(item)} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
                                            Editar
                                        </button>
                                        <button onClick={() => {setShowHistoryModal(item); setActiveActionMenu(null);}} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            Histórico
                                        </button>
                                        <button onClick={() => {setShowQrModal(item); setActiveActionMenu(null);}} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125-1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125-1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125-1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 15.375v4.5a1.125 1.125 0 001.125 1.125h4.5a1.125 1.125 0 001.125-1.125v-4.5A1.125 1.125 0 0019.125 14.25h-4.5A1.125 1.125 0 0013.5 15.375z" /></svg>
                                            Gerar Etiqueta
                                        </button>
                                        <div className="border-t my-1"></div>
                                        <button onClick={() => {setShowDeleteModal(item); setActiveActionMenu(null);}} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50" role="menuitem">
                                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            Excluir
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </td>
                </tr>
                ))}
                 {paginatedItems.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center p-6 text-gray-500">
                        {searchTerm ? 'Nenhum item encontrado para sua busca.' : 'Nenhum item cadastrado.'}
                    </td>
                  </tr>
                )}
            </tbody>
            </table>
        </div>

        <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
            <p>Mostrando {paginatedItems.length} de {displayedItems.length} registros</p>
            {totalPages > 1 && (
                 <div className="flex items-center space-x-1">
                    <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-2 py-1 border rounded-md disabled:opacity-50">Primeira</button>
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-1 border rounded-md disabled:opacity-50">Anterior</button>
                    <span className="px-3 py-1 bg-gray-200 rounded-md">Página {currentPage} de {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2 py-1 border rounded-md disabled:opacity-50">Próxima</button>
                    <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-2 py-1 border rounded-md disabled:opacity-50">Última</button>
                </div>
            )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                <h3 className="text-lg font-bold text-gray-800">Confirmar Exclusão</h3>
                <p className="text-gray-600 my-4">Tem certeza que deseja excluir o item <span className="font-semibold">{showDeleteModal.code} - {showDeleteModal.description}</span>? Esta ação não pode ser desfeita.</p>
                <div className="flex justify-end space-x-2">
                    <button onClick={() => setShowDeleteModal(null)} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button onClick={handleConfirmDelete} className="py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700">Excluir</button>
                </div>
            </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full flex flex-col">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Histórico do Item: {showHistoryModal.code}</h3>
                    <button onClick={() => setShowHistoryModal(null)} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                </div>
                <div ref={historyModalContentRef} className="max-h-96 overflow-y-auto">
                    <p className="font-semibold text-gray-700 mb-4">{showHistoryModal.description}</p>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="p-2 font-semibold text-gray-600">Data</th>
                                <th className="p-2 font-semibold text-gray-600">Tipo</th>
                                <th className="p-2 font-semibold text-gray-600">Quantidade</th>
                                <th className="p-2 font-semibold text-gray-600">Usuário</th>
                                <th className="p-2 font-semibold text-gray-600">Setor / Detalhes</th>
                                <th className="p-2 font-semibold text-gray-600">Responsável</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(historyData[showHistoryModal.id] || []).map((entry) => (
                                <tr key={entry.id} className="border-b">
                                    <td className="p-2">{entry.date}</td>
                                    <td className={`p-2 font-semibold ${entry.type === 'Entrada' ? 'text-green-600' : 'text-red-600'}`}>{entry.type}</td>
                                    <td className="p-2">{entry.quantity}</td>
                                    <td className="p-2">{entry.user}</td>
                                    {entry.type === 'Saída' ? (
                                        <>
                                            <td className="p-2">{entry.requester}</td>
                                            <td className="p-2">{entry.responsible}</td>
                                        </>
                                    ) : (
                                        <td className="p-2" colSpan={2}>{entry.details}</td>
                                    )}
                                </tr>
                            ))}
                            {(!historyData[showHistoryModal.id] || historyData[showHistoryModal.id].length === 0) && (
                                <tr><td colSpan={6} className="text-center p-4 text-gray-500">Nenhum histórico encontrado para este item.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
                    <button onClick={handleExportHistoryToCsv} className="py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">Exportar para CSV</button>
                    <button onClick={() => handlePrint(historyModalContentRef)} className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">Imprimir Histórico</button>
                </div>
            </div>
        </div>
      )}

      {showQrModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Etiqueta QR</h3>
                    <button onClick={() => setShowQrModal(null)} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                </div>
                <div ref={qrModalContentRef} className="text-center p-4 border border-dashed border-gray-400 bg-white">
                    <h4 className="font-extrabold text-6xl mb-1 tracking-wider">{showQrModal.code}</h4>
                    <p className="text-gray-600 mb-2 text-xs h-8">{showQrModal.description}</p>
                    <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(showQrModal.code)}`}
                        alt={`QR Code for ${showQrModal.code}`}
                        className="mx-auto"
                    />
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                    <button onClick={handleSaveZpl} className="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm">Salvar Arquivo</button>
                    <button onClick={() => handlePrint(qrModalContentRef)} className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">Imprimir Etiqueta</button>
                </div>
            </div>
        </div>
      )}

      {showMultiQrModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full flex flex-col">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Etiquetas Selecionadas ({selectedItems.length})</h3>
                    <button onClick={() => setShowMultiQrModal(false)} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                </div>
                <div ref={multiQrModalContentRef} className="max-h-[70vh] overflow-y-auto p-2 bg-gray-50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {stockItems
                        .filter(item => selectedItems.includes(item.id))
                        .map(item => (
                          <div key={item.id} className="text-center p-4 border border-dashed border-gray-400 bg-white">
                              <h4 className="font-extrabold text-6xl mb-1 tracking-wider">{item.code}</h4>
                              <p className="text-gray-600 mb-2 text-xs h-8">{item.description}</p>
                              <img 
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(item.code)}`}
                                  alt={`QR Code for ${item.code}`}
                                  className="mx-auto"
                              />
                          </div>
                        ))
                      }
                    </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
                    <button onClick={handleSaveAllZpl} className="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm">Salvar Arquivos ZPL</button>
                    <button onClick={() => handlePrint(multiQrModalContentRef)} className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">Imprimir Etiquetas</button>
                </div>
            </div>
        </div>
      )}

      {/* Add Item Slide-over Panel */}
      {isAddItemPanelOpen && (
          <div className="relative z-50" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
              <div className={`slide-over-overlay ${isAddItemPanelOpen ? 'opacity-100' : 'opacity-0'}`} onClick={closeAddItemPanel}></div>
              <div className={`slide-over-panel ${isAddItemPanelOpen ? 'show' : ''}`}>
                  <form onSubmit={handleConfirmAddItem} className="h-full flex flex-col">
                      <div className="slide-over-header">
                          <h2 id="slide-over-title" className="text-lg font-medium text-gray-900">Adicionar Novo Item</h2>
                          <button onClick={closeAddItemPanel} type="button" className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                      </div>
                      <div className="slide-over-body space-y-4">
                           {addFormError && <p className="bg-red-100 text-red-700 p-3 rounded-md text-sm">{addFormError}</p>}
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-gray-700">Código*</label>
                                  <input type="text" name="code" value={newItem.code || ''} onChange={handleAddItemChange} className={`mt-1 block w-full px-3 py-2 border ${codeError ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`} required />
                                  {codeError && <p className="text-red-500 text-xs mt-1">{codeError}</p>}
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700">Fornecedor</label>
                                  <select name="supplier_id" value={newItem.supplier_id || ''} onChange={handleAddItemChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                      <option value="">Nenhum</option>
                                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                  </select>
                              </div>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700">Descrição*</label>
                              <input type="text" name="description" value={newItem.description || ''} onChange={handleAddItemChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700">Categoria</label>
                              <select name="category" value={newItem.category || ''} onChange={handleAddItemChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                  {WAREHOUSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                              </select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-gray-700">Equipamento</label>
                                  <input type="text" name="equipment" value={newItem.equipment || ''} onChange={handleAddItemChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700">Localização*</label>
                                  <input type="text" name="location" value={newItem.location || ''} onChange={handleAddItemChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                              </div>
                          </div>
                          <div className="grid grid-cols-4 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-gray-700">Unidade*</label>
                                  <select name="unit" value={newItem.unit || 'Unidade'} onChange={handleAddItemChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required>
                                      <option>Unidade</option><option>Quilograma</option><option>Metro</option><option>Par</option><option>Bobina</option><option>Caixa</option><option>Peças</option><option>Litro</option><option>Pacote</option><option>Rolo</option><option>Saco</option><option>Vara</option><option>Lata</option><option>Carretel</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700">Qtd. Inicial</label>
                                  <input type="number" name="initial_stock" value={newItem.initial_stock || 0} onChange={handleAddItemChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700">Estoque Mínimo</label>
                                  <input type="number" name="min_stock" value={newItem.min_stock || 0} onChange={handleAddItemChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700">Valor Unitário</label>
                                  <input type="number" step="0.01" name="value" value={newItem.value || 0} onChange={handleAddItemChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                              </div>
                          </div>
                      </div>
                      <div className="slide-over-footer">
                          <button type="button" onClick={closeAddItemPanel} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                          <button type="submit" className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">Adicionar Item</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
      
       {/* Edit Item Slide-over Panel */}
       {itemToEdit && (
          <div className="relative z-50" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
              <div className={`slide-over-overlay show`} onClick={closeEditItemPanel}></div>
              <div className={`slide-over-panel show`}>
                  <form onSubmit={handleConfirmUpdateItem} className="h-full flex flex-col">
                      <div className="slide-over-header">
                          <h2 id="slide-over-title" className="text-lg font-medium text-gray-900">Editar Item</h2>
                          <button onClick={closeEditItemPanel} type="button" className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                      </div>
                      <div className="slide-over-body space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-gray-700">Código*</label>
                                  <input type="text" name="code" value={itemToEdit.code || ''} onChange={handleEditItemChange} className={`mt-1 block w-full px-3 py-2 border ${codeError ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`} required />
                                  {codeError && <p className="text-red-500 text-xs mt-1">{codeError}</p>}
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700">Fornecedor</label>
                                  <select name="supplier_id" value={itemToEdit.supplier_id || ''} onChange={handleEditItemChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                      <option value="">Nenhum</option>
                                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                  </select>
                              </div>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700">Descrição*</label>
                              <input type="text" name="description" value={itemToEdit.description || ''} onChange={handleEditItemChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700">Categoria</label>
                              <select name="category" value={itemToEdit.category || ''} onChange={handleEditItemChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                  {WAREHOUSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                              </select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-gray-700">Equipamento</label>
                                  <input type="text" name="equipment" value={itemToEdit.equipment || ''} onChange={handleEditItemChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700">Localização*</label>
                                  <input type="text" name="location" value={itemToEdit.location || ''} onChange={handleEditItemChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                              </div>
                          </div>
                          <div className="grid grid-cols-4 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-gray-700">Unidade*</label>
                                  <select name="unit" value={itemToEdit.unit || 'Unidade'} onChange={handleEditItemChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required>
                                      <option>Unidade</option><option>Quilograma</option><option>Metro</option><option>Par</option><option>Bobina</option><option>Caixa</option><option>Peças</option><option>Litro</option><option>Pacote</option><option>Rolo</option><option>Saco</option><option>Vara</option><option>Lata</option><option>Carretel</option>
                                  </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Estoque Atual</label>
                                <input type="number" value={itemToEdit.system_stock || 0} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed" readOnly />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700">Estoque Mínimo</label>
                                  <input type="number" name="min_stock" value={itemToEdit.min_stock || 0} onChange={handleEditItemChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700">Valor Unitário</label>
                                  <input type="number" step="0.01" name="value" value={itemToEdit.value || 0} onChange={handleEditItemChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                              </div>
                          </div>
                      </div>
                      <div className="slide-over-footer">
                          <button type="button" onClick={closeEditItemPanel} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                          <button type="submit" className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">Salvar Alterações</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {showBulkImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-3xl w-full">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Importar Itens em Massa</h3>
                <div className="space-y-4">
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                        <p className="text-sm text-blue-700">
                            Selecione um arquivo <code className="font-mono bg-blue-100 p-1 rounded">.csv</code> com o delimitador ponto e vírgula (;) ou vírgula (,).
                            O arquivo deve conter as colunas obrigatórias: <code className="font-mono text-xs">code, description</code>.
                        </p>
                        <p className="text-sm text-blue-700 mt-2">
                           Colunas opcionais: <code className="font-mono text-xs">category, equipment, location, unit, minstock, value, supplier</code>. A ordem não importa.
                        </p>
                        <button onClick={handleDownloadTemplate} className="text-blue-600 hover:underline text-sm font-semibold mt-2">Baixar modelo de CSV</button>
                    </div>
                    
                    <input type="file" ref={bulkImportInputRef} accept=".csv" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                    
                    {(parsedCsvData.length > 0 || importErrors.length > 0) && (
                        <div className="border rounded-md p-2 max-h-60 overflow-y-auto">
                            <h4 className="font-semibold mb-2">Pré-visualização da Importação:</h4>
                            {importErrors.length > 0 && (
                                <div className="bg-red-100 text-red-700 p-2 rounded-md mb-2">
                                    <p className="font-bold">Erros encontrados: {importErrors.length}</p>
                                    <ul className="list-disc pl-5 text-sm">
                                        {importErrors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
                                        {importErrors.length > 5 && <li>...e mais {importErrors.length - 5} erros.</li>}
                                    </ul>
                                </div>
                            )}
                            <p className="text-green-700 text-sm mb-2">{parsedCsvData.length} itens válidos prontos para importar.</p>
                            {parsedCsvData.length > 0 && (
                                <table className="w-full text-xs text-left">
                                    <thead><tr className="bg-gray-50"><th className="p-1">Cód</th><th className="p-1">Descrição</th><th className="p-1">Valor</th></tr></thead>
                                    <tbody>
                                        {parsedCsvData.slice(0, 3).map((item, i) => (
                                            <tr key={i} className="border-b"><td className="p-1">{item.code}</td><td className="p-1 truncate">{item.description}</td><td className="p-1">{item.value}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                             {parsedCsvData.length > 3 && <p className="text-xs text-gray-500 mt-1">...e mais {parsedCsvData.length - 3} itens.</p>}
                        </div>
                    )}
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                    <button type="button" onClick={() => { setShowBulkImportModal(false); setParsedCsvData([]); setImportErrors([]); }} className="py-2 px-4 bg-gray-200 rounded-md">Cancelar</button>
                    <button onClick={handleConfirmBulkImport} disabled={parsedCsvData.length === 0 || importErrors.length > 0} className="py-2 px-4 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
                        Importar {parsedCsvData.length} Itens
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};