import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StockItem, ItemHistory, Supplier } from '../types';


// ============================================================================
// Inventory Page Component
// ============================================================================
interface InventoryPageProps {
    stockItems: StockItem[];
    setStockItems: React.Dispatch<React.SetStateAction<StockItem[]>>;
    addAuditLog: (action: string) => void;
    showToast: (message: string) => void;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({ stockItems, setStockItems, addAuditLog, showToast }) => {
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
      return counted !== undefined && counted !== item.systemStock;
  });
  
  const totalAdjustmentValue = divergenceItems.reduce((acc, item) => {
      const counted = countedItems[item.id];
      if (counted !== undefined) {
          const diff = counted - item.systemStock;
          return acc + (diff * item.value);
      }
      return acc;
  }, 0);
  
  const handleSaveInventory = () => {
    if (divergenceItems.length === 0) {
        alert("Nenhum item com divergência para ajustar.");
        return;
    }
    if (window.confirm(`Você tem certeza que deseja ajustar o estoque de ${divergenceItems.length} item(s)?`)) {
        setStockItems(prevItems => {
            const updatedItems = prevItems.map(item => {
                const countedValue = countedItems[item.id];
                if (countedValue !== undefined && item.systemStock !== countedValue) {
                    addAuditLog(`Ajuste de inventário para o item ${item.code}: de ${item.systemStock} para ${countedValue}.`);
                    return { ...item, systemStock: countedValue };
                }
                return item;
            });
            return updatedItems;
        });
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
        <table className="w-full text-left">
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
              const difference = counted !== undefined ? counted - item.systemStock : undefined;
              return (
                <tr key={item.id} className={`border-b ${difference !== undefined && difference !== 0 ? 'bg-yellow-50' : ''}`}>
                  <td className="p-2 text-sm text-gray-800 font-medium">{item.code}</td>
                  <td className="p-2 text-sm text-gray-500">{item.description}</td>
                  <td className="p-2 text-sm text-gray-500">{item.systemStock}</td>
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
    setStockItems: React.Dispatch<React.SetStateAction<StockItem[]>>;
    suppliers: Supplier[];
    searchTerm: string;
    addAuditLog: (action: string) => void;
    showToast: (message: string) => void;
    historyData: Record<string, ItemHistory[]>;
}

const EstoquePage: React.FC<EstoquePageProps> = ({ stockItems, setStockItems, suppliers, searchTerm, addAuditLog, showToast, historyData }) => {
  const [displayedItems, setDisplayedItems] = useState<StockItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState<StockItem | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<StockItem | null>(null);
  const [showEditModal, setShowEditModal] = useState<StockItem | null>(null);
  const [showQrModal, setShowQrModal] = useState<StockItem | null>(null);
  const [showMultiQrModal, setShowMultiQrModal] = useState(false);
  const [editedItem, setEditedItem] = useState<StockItem | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();

  // State for adding a new item
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const initialNewItemState: Partial<StockItem> = {
      code: '',
      description: '',
      equipment: '',
      location: '',
      unit: 'Unidade',
      systemStock: 0,
      minStock: 0,
      value: 0,
      supplier: suppliers.length > 0 ? suppliers[0].name : '',
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
    const searchParams = new URLSearchParams(location.search);
    const filter = searchParams.get('filtro');
    
    let filtered = stockItems;

    if (filter === 'abaixo-minimo') {
        filtered = filtered.filter(item => item.systemStock <= item.minStock);
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
  
  const handleConfirmDelete = () => {
      if(showDeleteModal) {
        addAuditLog(`Excluiu o item ${showDeleteModal.code} - ${showDeleteModal.description}.`);
        setStockItems(prev => prev.filter(item => item.id !== showDeleteModal.id));
        showToast(`Item ${showDeleteModal.code} excluído com sucesso!`);
        setShowDeleteModal(null);
      }
  };

  const handleOpenEditModal = (item: StockItem) => {
    setEditedItem({ ...item });
    setShowEditModal(item);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editedItem) return;
    const { name, value } = e.target;
    setEditedItem(prev => prev ? { ...prev, [name]: (name === 'minStock' || name === 'value') ? parseFloat(value) : value } : null);
  };

  const handleConfirmEdit = () => {
    if (editedItem) {
      addAuditLog(`Editou o item ${editedItem.code}.`);
      setStockItems(prev => prev.map(item => item.id === editedItem.id ? editedItem : item));
      showToast(`Item ${editedItem.code} atualizado!`);
      setShowEditModal(null);
      setEditedItem(null);
    }
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

  const handleConfirmAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    setAddFormError('');

    // Re-run validation for code on submit
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
    
    // Clear code error if it passes all checks on submit
    setCodeError('');

    if (!newItem.description || !newItem.location) {
      setAddFormError('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }
    
    const itemToAdd: StockItem = {
      id: String(Date.now()),
      code: newItem.code,
      description: newItem.description,
      equipment: newItem.equipment || '',
      location: newItem.location || '',
      unit: newItem.unit || 'Unidade',
      systemStock: 0, 
      minStock: Number(newItem.minStock) || 0,
      value: Number(newItem.value) || 0,
      supplier: newItem.supplier || '',
    };
    
    addAuditLog(`Criou o item ${itemToAdd.code} - ${itemToAdd.description}.`);
    setStockItems(prev => [itemToAdd, ...prev]);
    
    setShowAddItemModal(false);
    setNewItem(initialNewItemState);
    setAddFormError('');
    setCodeError('');
    showToast(`Item ${itemToAdd.code} adicionado com sucesso!`);
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
    const header = "code;description;equipment;location;unit;minStock;value;supplier\n";
    const example = "EX-001;Item de Exemplo;Setor A;A1-01;Unidade;10;99.90;Fornecedor Exemplo";
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
                    // Escaped quote
                    currentField += '"';
                    i++; // Skip next char
                } else {
                    // Closing quote
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

    const reader = new FileReader();
    reader.onload = (e) => {
        let text = e.target?.result as string;
        if (!text) return;

        // Remove BOM
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
        
        const header = parseCsvRow(firstLine.toLowerCase(), delimiter).map(h => h.trim());
        const expectedHeader = ["code", "description", "equipment", "location", "unit", "minstock", "value", "supplier"];
        
        const newErrors: string[] = [];

        if (header.length !== expectedHeader.length || !expectedHeader.every((val, i) => val === header[i])) {
            newErrors.push("O cabeçalho do CSV é inválido. Verifique a ordem e os nomes das colunas e tente novamente. Cabeçalho esperado: " + expectedHeader.join(delimiter));
            setImportErrors(newErrors);
            setParsedCsvData([]);
            return;
        }

        const newItems: Partial<StockItem>[] = [];
        rows.forEach((row, index) => {
            const values = parseCsvRow(row, delimiter);

            if (values.length !== expectedHeader.length) {
                newErrors.push(`Linha ${index + 2}: Número incorreto de colunas. Esperado: ${expectedHeader.length}, encontrado: ${values.length}.`);
                return;
            }
            const newItem: Partial<StockItem> = {
                code: values[0],
                description: values[1],
                equipment: values[2],
                location: values[3],
                unit: values[4] as StockItem['unit'],
                minStock: parseFloat(values[5].replace(',', '.') || '0'),
                value: parseFloat(values[6].replace(',', '.') || '0'),
                supplier: values[7],
            };

            if (!newItem.code || !newItem.description) {
                newErrors.push(`Linha ${index + 2}: Código e descrição são obrigatórios.`);
                return;
            }
            if (stockItems.some(i => i.code.toLowerCase() === newItem.code?.toLowerCase()) || newItems.some(i => i.code?.toLowerCase() === newItem.code?.toLowerCase())) {
                newErrors.push(`Linha ${index + 2}: Código '${newItem.code}' já existe no sistema ou no arquivo.`);
                return;
            }
            newItems.push(newItem);
        });
        setImportErrors(newErrors);
        setParsedCsvData(newItems);
    };
    reader.readAsText(file, 'UTF-8');
    if (bulkImportInputRef.current) bulkImportInputRef.current.value = "";
  };

  const handleConfirmBulkImport = () => {
    if (parsedCsvData.length === 0) {
        alert("Nenhum item válido para importar.");
        return;
    }
    const itemsToAdd: StockItem[] = parsedCsvData.map(item => ({
        id: String(Date.now() + Math.random()),
        code: item.code!,
        description: item.description!,
        equipment: item.equipment || '',
        location: item.location || '',
        unit: item.unit || 'Unidade',
        systemStock: 0,
        minStock: Number(item.minStock) || 0,
        value: Number(item.value) || 0,
        supplier: item.supplier || '',
    }));
    
    setStockItems(prev => [...itemsToAdd, ...prev]);
    addAuditLog(`Importou em massa ${itemsToAdd.length} novo(s) item(s) via CSV.`);
    
    setShowBulkImportModal(false);
    setParsedCsvData([]);
    setImportErrors([]);
    showToast(`${itemsToAdd.length} itens foram adicionados com sucesso!`);
  };


  const isFilterActive = new URLSearchParams(location.search).get('filtro') === 'abaixo-minimo';
  const totalValue = displayedItems.reduce((acc, item) => acc + (item.systemStock * item.value), 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Estoque Atual</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
            <div>
                 <p className="text-gray-600">Valor Total Consolidado (com base nos filtros)</p>
                 <p className="text-2xl font-bold text-blue-600">{totalValue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
            </div>
            <div className="flex items-center space-x-2">
                 <button
                  onClick={() => setShowMultiQrModal(true)}
                  disabled={selectedItems.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md text-sm transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Gerar Etiquetas ({selectedItems.length})
                </button>
                <button onClick={() => setShowBulkImportModal(true)} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md">Importar em Massa</button>
                <button onClick={() => setShowAddItemModal(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-md">+ Novo Item</button>
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
            <table className="w-full text-left">
            <thead>
                <tr className="bg-gray-50 border-b">
                <th className="p-3 w-4"><input type="checkbox" onChange={handleSelectAll} checked={displayedItems.length > 0 && selectedItems.length === displayedItems.length} /></th>
                <th className="p-3 text-sm font-semibold text-gray-600">CÓDIGO</th>
                <th className="p-3 text-sm font-semibold text-gray-600">DESCRIÇÃO</th>
                <th className="p-3 text-sm font-semibold text-gray-600">EQUIPAMENTO</th>
                <th className="p-3 text-sm font-semibold text-gray-600">LOCALIZAÇÃO</th>
                <th className="p-3 text-sm font-semibold text-gray-600">MEDIDA</th>
                <th className="p-3 text-sm font-semibold text-gray-600">VALOR UNIT.</th>
                <th className="p-3 text-sm font-semibold text-gray-600">AÇÕES</th>
                </tr>
            </thead>
            <tbody>
                {paginatedItems.map(item => (
                <tr key={item.id} className={`border-b ${item.systemStock <= item.minStock ? 'bg-red-50' : ''}`}>
                    <td className="p-3"><input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => handleSelectItem(item.id)} /></td>
                    <td className="p-3 text-sm text-gray-800 font-medium">
                    {item.systemStock <= item.minStock && <span className="inline-block w-2.5 h-2.5 bg-red-500 rounded-full mr-2" title="Estoque baixo"></span>}
                    {item.code}
                    </td>
                    <td className="p-3 text-sm text-gray-500">{item.description}</td>
                    <td className="p-3 text-sm text-gray-500">{item.equipment}</td>
                    <td className="p-3 text-sm text-gray-500">{item.location}</td>
                    <td className="p-3 text-sm text-gray-500">{item.unit}</td>
                    <td className="p-3 text-sm text-gray-500">{item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="p-3 text-sm text-gray-500">
                        <div className="flex items-center space-x-3">
                            <button onClick={() => handleOpenEditModal(item)} title="Editar" className="hover:text-blue-600 transition-colors duration-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
                                </svg>
                            </button>
                            <button onClick={() => setShowHistoryModal(item)} title="Ver Histórico" className="hover:text-green-600 transition-colors duration-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>
                            <button onClick={() => setShowQrModal(item)} title="Gerar Etiqueta QR" className="hover:text-purple-600 transition-colors duration-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 15.375v4.5a1.125 1.125 0 001.125 1.125h4.5a1.125 1.125 0 001.125-1.125v-4.5A1.125 1.125 0 0019.125 14.25h-4.5A1.125 1.125 0 0013.5 15.375z" />
                                </svg>
                            </button>
                            <button onClick={() => setShowDeleteModal(item)} title="Excluir" className="hover:text-red-600 transition-colors duration-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
                ))}
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

      {showEditModal && editedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Editar Item: {showEditModal.code}</h3>
                <form className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Descrição</label>
                        <input type="text" name="description" value={editedItem.description} onChange={handleEditChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Equipamento</label>
                        <input type="text" name="equipment" value={editedItem.equipment} onChange={handleEditChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Localização</label>
                        <input type="text" name="location" value={editedItem.location} onChange={handleEditChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Unidade de Medida</label>
                            <select name="unit" value={editedItem.unit} onChange={handleEditChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                <option>Unidade</option>
                                <option>Quilograma</option>
                                <option>Metro</option>
                                <option>Par</option>
                                <option>Bobina</option>
                                <option>Caixa</option>
                                <option>Peças</option>
                                <option>Litro</option>
                                <option>Pacote</option>
                                <option>Rolo</option>
                                <option>Saco</option>
                                <option>Vara</option>
                                <option>Lata</option>
                                <option>Carretel</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Estoque Mínimo</label>
                            <input type="number" name="minStock" value={editedItem.minStock} onChange={handleEditChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Valor Unitário</label>
                            <input type="number" step="0.01" name="value" value={editedItem.value} onChange={handleEditChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                        </div>
                    </div>
                </form>
                <div className="flex justify-end space-x-2 mt-6">
                    <button onClick={() => setShowEditModal(null)} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button onClick={handleConfirmEdit} className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">Salvar Alterações</button>
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
                    <h4 className="font-extrabold text-2xl mb-1 tracking-wider">{showQrModal.code}</h4>
                    <p className="text-gray-600 mb-4 text-sm h-10">{showQrModal.description}</p>
                    <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(showQrModal.code)}`}
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
                              <h4 className="font-extrabold text-2xl mb-1 tracking-wider">{item.code}</h4>
                              <p className="text-gray-600 mb-4 text-sm h-10">{item.description}</p>
                              <img 
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(item.code)}`}
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

      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Adicionar Novo Item</h3>
                <form onSubmit={handleConfirmAddItem} className="space-y-4">
                    {addFormError && <p className="bg-red-100 text-red-700 p-3 rounded-md text-sm">{addFormError}</p>}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Código*</label>
                            <input type="text" name="code" value={newItem.code || ''} onChange={handleAddItemChange} className={`mt-1 block w-full px-3 py-2 border ${codeError ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`} required />
                            {codeError && <p className="text-red-500 text-xs mt-1">{codeError}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Fornecedor</label>
                            <select name="supplier" value={newItem.supplier || ''} onChange={handleAddItemChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Descrição*</label>
                        <input type="text" name="description" value={newItem.description || ''} onChange={handleAddItemChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
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
                    <div className="grid grid-cols-3 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Unidade de Medida*</label>
                            <select name="unit" value={newItem.unit || 'Unidade'} onChange={handleAddItemChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
                                <option>Unidade</option>
                                <option>Quilograma</option>
                                <option>Metro</option>
                                <option>Par</option>
                                <option>Bobina</option>
                                <option>Caixa</option>
                                <option>Peças</option>
                                <option>Litro</option>
                                <option>Pacote</option>
                                <option>Rolo</option>
                                <option>Saco</option>
                                <option>Vara</option>
                                <option>Lata</option>
                                <option>Carretel</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Estoque Mínimo</label>
                            <input type="number" name="minStock" value={newItem.minStock || 0} onChange={handleAddItemChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Valor Unitário</label>
                            <input type="number" step="0.01" name="value" value={newItem.value || 0} onChange={handleAddItemChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={() => { setShowAddItemModal(false); setAddFormError(''); setCodeError(''); setNewItem(initialNewItemState); }} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">Adicionar Item</button>
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
                            Selecione um arquivo <code className="font-mono bg-blue-100 p-1 rounded">.csv</code> com o delimitador ponto e vírgula (;) ou vírgula (,). As colunas devem seguir a ordem: <br/>
                            <code className="font-mono text-xs">code;description;equipment;location;unit;minStock;value;supplier</code>
                        </p>
                        <button onClick={handleDownloadTemplate} className="text-blue-600 hover:underline text-sm font-semibold mt-2">Baixar modelo de CSV</button>
                    </div>
                    
                    <input type="file" ref={bulkImportInputRef} accept=".csv" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                    
                    {(parsedCsvData.length > 0 || importErrors.length > 0) && (
                        <div className="border rounded-md p-2 max-h-60 overflow-y-auto">
                            <h4 className="font-semibold mb-2">Pré-visualização da Importação:</h4>
                            {importErrors.length > 0 && (
                                <div className="bg-red-100 text-red-700 p-2 rounded-md mb-2">
                                    <p className="font-bold">Erros encontrados:</p>
                                    <ul className="list-disc list-inside text-sm">
                                        {importErrors.map((error, i) => <li key={i}>{error}</li>)}
                                    </ul>
                                </div>
                            )}
                             {parsedCsvData.length > 0 && (
                                <div className="bg-green-100 text-green-700 p-2 rounded-md">
                                    <p className="font-bold">{parsedCsvData.length} item(ns) válido(s) pronto(s) para ser(em) importado(s).</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex justify-end space-x-2 pt-6">
                    <button type="button" onClick={() => { setShowBulkImportModal(false); setParsedCsvData([]); setImportErrors([]); }} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button onClick={handleConfirmBulkImport} disabled={parsedCsvData.length === 0 || importErrors.length > 0} className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        Importar {parsedCsvData.length} Itens
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default EstoquePage;