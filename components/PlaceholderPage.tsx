import React, { useState, useRef, useMemo, useEffect } from 'react';
import { StockItem, ItemHistory, Supplier } from '../types';

interface RelatoriosPageProps {
  title: string;
  stockItems: StockItem[];
  historyData: Record<string, ItemHistory[]>;
  suppliers: Supplier[];
}

const printContent = (content: HTMLDivElement | null, title: string) => {
    if (content) {
        const printWindow = window.open('', '', 'height=800,width=1000');
        if (printWindow) {
            printWindow.document.write(`<html><head><title>${title}</title>`);
            printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
            printWindow.document.write(`
                <style>
                    body { 
                        -webkit-print-color-adjust: exact; 
                        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
                    }
                    .no-print {
                        display: none !important;
                    }
                    @media print {
                        body {
                            margin: 1rem;
                        }
                        button, .no-print {
                            display: none !important;
                        }
                        .border {
                           border: none !important;
                        }
                        .rounded-md {
                           border-radius: 0 !important;
                        }
                        .p-4 {
                           padding: 0 !important;
                        }
                    }
                </style>
            `);
            printWindow.document.write('</head><body class="p-4">');
            const contentToPrint = content.cloneNode(true) as HTMLElement;
            contentToPrint.querySelectorAll('.no-print').forEach(el => el.remove());
            printWindow.document.write(contentToPrint.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => { 
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    }
};

const AbaixoMinimoReport: React.FC<{ stockItems: StockItem[], suppliers: Supplier[] }> = ({ stockItems, suppliers }) => {
  const [filterText, setFilterText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const itemsAbaixoMinimo = useMemo(() => {
    let items = stockItems.filter(i => i.system_stock <= i.min_stock);
    if (filterText) {
        items = items.filter(i => 
            i.code.toLowerCase().includes(filterText.toLowerCase()) ||
            i.description.toLowerCase().includes(filterText.toLowerCase())
        );
    }
    return items;
  }, [stockItems, filterText]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [filterText]);

  const totalPages = Math.ceil(itemsAbaixoMinimo.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return itemsAbaixoMinimo.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, itemsAbaixoMinimo]);


  const [pedidoItems, setPedidoItems] = useState<Record<string, string>>({});
  const [showPedidoModal, setShowPedidoModal] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const reportPrintRef = useRef<HTMLDivElement>(null);

  const handlePedidoChange = (code: string, quantity: string) => {
    setPedidoItems(prev => ({ ...prev, [code]: quantity }));
  };
  
  const itemsParaPedir = itemsAbaixoMinimo.filter(item => {
    const description = pedidoItems[item.code];
    return description && description.trim() !== '';
  });
  
  const formatSupplier = (supplierId: number | undefined): string => {
      if (!supplierId) return 'N/A';
      const supplier = suppliers.find(s => s.id === supplierId);
      return supplier?.name || 'N/A';
  };
  
  const handlePrint = () => {
    const content = printRef.current;
    if (content) {
        const printWindow = window.open('', '', 'height=600,width=800');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Imprimir Pedido</title>');
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

  return (
    <div>
        <div className="flex justify-between items-center mb-4 no-print">
            <input 
                type="text"
                placeholder="Filtrar por código ou descrição..."
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                className="p-2 border border-gray-300 rounded-md text-sm w-full max-w-xs"
            />
            <div className="flex space-x-2">
                <button onClick={() => printContent(reportPrintRef.current, 'Relatório de Itens Abaixo do Mínimo')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md text-sm">Gerar Relatório</button>
            </div>
        </div>
        <div ref={reportPrintRef} className="border rounded-md p-4">
            <h4 className="font-bold">Itens Abaixo do Mínimo</h4>
            <p className="text-xs text-gray-500 mb-4">Data de Geração: {new Date().toLocaleString('pt-BR')}</p>
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-gray-50 border-b">
                        <th className="p-2 text-sm font-semibold text-gray-600">CÓDIGO</th>
                        <th className="p-2 text-sm font-semibold text-gray-600">DESCRIÇÃO</th>
                        <th className="p-2 text-sm font-semibold text-gray-600">QTD. REAL</th>
                        <th className="p-2 text-sm font-semibold text-gray-600">QTD. MÍNIMA</th>
                        <th className="p-2 text-sm font-semibold text-gray-600">FORNECEDOR</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedItems.map(item => (
                        <tr key={item.id} className="border-b">
                            <td className="p-2 text-sm">{item.code}</td>
                            <td className="p-2 text-sm">{item.description}</td>
                            <td className="p-2 text-sm text-red-600 font-bold">{item.system_stock}</td>
                            <td className="p-2 text-sm">{item.min_stock}</td>
                            <td className="p-2 text-sm">{formatSupplier(item.supplier_id)}</td>
                        </tr>
                    ))}
                     {itemsAbaixoMinimo.length === 0 && (
                        <tr><td colSpan={5} className="text-center p-4 text-gray-500">
                           {filterText ? "Nenhum item corresponde ao filtro." : "Nenhum item abaixo do estoque mínimo."}
                        </td></tr>
                     )}
                </tbody>
            </table>
            
            <div className="flex justify-between items-center mt-4 text-sm text-gray-600 no-print">
                <p>Mostrando {paginatedItems.length} de {itemsAbaixoMinimo.length} registros</p>
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

             <div className="flex justify-end mt-4 no-print">
                <button onClick={() => setShowPedidoModal(true)} disabled={itemsAbaixoMinimo.length === 0} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                   Realizar Pedido
                </button>
            </div>
        </div>
        
        {showPedidoModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white p-6 rounded-lg shadow-xl max-w-6xl w-full flex flex-col">
                    <div className="flex justify-between items-center border-b pb-3 mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Realizar Pedido de Compra</h3>
                        <button onClick={() => setShowPedidoModal(false)} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                    </div>
                    <div className="max-h-[70vh] overflow-y-auto">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-gray-50">
                                <tr className="border-b">
                                    <th className="p-2 text-sm font-semibold text-gray-600">CÓDIGO</th>
                                    <th className="p-2 text-sm font-semibold text-gray-600">DESCRIÇÃO</th>
                                    <th className="p-2 text-sm font-semibold text-gray-600">FORNECEDOR</th>
                                    <th className="p-2 text-sm font-semibold text-gray-600">Descrição do pedido*</th>
                                </tr>
                            </thead>
                            <tbody>
                                {itemsAbaixoMinimo.map(item => (
                                    <tr key={item.id} className="border-b">
                                        <td className="p-2 text-sm">{item.code}</td>
                                        <td className="p-2 text-sm">{item.description}</td>
                                        <td className="p-2 text-sm">{formatSupplier(item.supplier_id)}</td>
                                        <td className="p-2">
                                            <input 
                                                type="text" 
                                                placeholder="Obrigatório para incluir no pedido" 
                                                value={pedidoItems[item.code] || ''} 
                                                onChange={e => handlePedidoChange(item.code, e.target.value)} 
                                                className="w-full p-1 border border-gray-300 rounded-md"
                                                required
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
                        <button onClick={handlePrint} disabled={itemsParaPedir.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                           🖨️ Imprimir Pedido ({itemsParaPedir.length})
                        </button>
                    </div>
                </div>
            </div>
        )}

        <div className="hidden">
            <div ref={printRef} className="p-4">
                <h1 className="text-xl font-bold mb-4">Pedido de Compra de Itens</h1>
                <p className="text-sm text-gray-600 mb-4">Data de Geração: {new Date().toLocaleString('pt-BR')}</p>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border p-2">CÓDIGO</th>
                            <th className="border p-2">DESCRIÇÃO</th>
                            <th className="border p-2">FORNECEDOR</th>
                            <th className="border p-2">Descrição do Pedido</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itemsParaPedir.map(item => (
                            <tr key={item.id}>
                                <td className="border p-2">{item.code}</td>
                                <td className="border p-2">{item.description}</td>
                                <td className="border p-2">{formatSupplier(item.supplier_id)}</td>
                                <td className="border p-2">{pedidoItems[item.code]}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

const MovimentacaoReport: React.FC<{ stockItems: StockItem[], historyData: Record<string, ItemHistory[]> }> = ({ stockItems, historyData }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const reportPrintRef = useRef<HTMLDivElement>(null);

    const allHistory = useMemo(() => {
        return Object.keys(historyData)
            .flatMap((itemId) => {
                const histories = historyData[itemId];
                const item = stockItems.find(i => i.id === itemId);
                return histories.map(h => ({
                    ...h,
                    itemId,
                    code: item?.code || 'N/A',
                    description: item?.description || 'Item não encontrado'
                }));
            })
            .sort((a, b) => new Date(b.date.split('/').reverse().join('-')).getTime() - new Date(a.date.split('/').reverse().join('-')).getTime());
    }, [historyData, stockItems]);

    const filteredHistory = useMemo(() => {
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);

      if (!start && !end) return allHistory;

      return allHistory.filter(h => {
        const historyDate = new Date(h.date.split('/').reverse().join('-'));
        const isAfterStart = start ? historyDate >= start : true;
        const isBeforeEnd = end ? historyDate <= end : true;
        return isAfterStart && isBeforeEnd;
      });
    }, [allHistory, startDate, endDate]);

    return (
        <div>
            <div className="flex justify-between items-end mb-4 no-print">
                <div className="flex items-end space-x-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Data de Início</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border border-gray-300 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Data Final</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border border-gray-300 rounded-md" />
                    </div>
                </div>
                <button onClick={() => printContent(reportPrintRef.current, 'Relatório de Movimentações')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md text-sm">Gerar Relatório</button>
            </div>
            <div ref={reportPrintRef} className="border rounded-md p-4">
                <h4 className="font-bold">Movimentações por Período</h4>
                <p className="text-xs text-gray-500 mb-4">Data de Geração: {new Date().toLocaleString('pt-BR')}</p>
                <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-gray-50">
                            <tr className="border-b">
                                <th className="p-2 text-sm font-semibold text-gray-600">Data</th>
                                <th className="p-2 text-sm font-semibold text-gray-600">Cód. Item</th>
                                <th className="p-2 text-sm font-semibold text-gray-600">Descrição</th>
                                <th className="p-2 text-sm font-semibold text-gray-600">Tipo</th>
                                <th className="p-2 text-sm font-semibold text-gray-600">Qtd.</th>
                                <th className="p-2 text-sm font-semibold text-gray-600">Usuário</th>
                                <th className="p-2 text-sm font-semibold text-gray-600">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHistory.map(item => (
                                <tr key={item.id} className="border-b">
                                    <td className="p-2 text-sm">{item.date}</td>
                                    <td className="p-2 text-sm">{item.code}</td>
                                    <td className="p-2 text-sm">{item.description}</td>
                                    <td className={`p-2 text-sm font-bold ${item.type === 'Entrada' ? 'text-green-600' : 'text-red-600'}`}>{item.type}</td>
                                    <td className="p-2 text-sm">{item.quantity}</td>
                                    <td className="p-2 text-sm">{item.user}</td>
                                    <td className="p-2 text-sm">
                                      {item.type === 'Entrada' ? item.details : `Solic.: ${item.requester} / Resp.: ${item.responsible}`}
                                    </td>
                                </tr>
                            ))}
                            {filteredHistory.length === 0 && (
                                <tr><td colSpan={7} className="text-center p-4 text-gray-500">Nenhuma movimentação encontrada para o período.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const ValorPorLocalReport: React.FC<{ stockItems: StockItem[] }> = ({ stockItems }) => {
    const reportPrintRef = useRef<HTMLDivElement>(null);
    const valorPorLocal = useMemo(() => {
        const data = stockItems.reduce((acc, item) => {
            const location = item.location || 'Não Localizado';
            if (!acc[location]) {
                acc[location] = { itemCount: 0, totalValue: 0 };
            }
            acc[location].itemCount++;
            acc[location].totalValue += item.system_stock * item.value;
            return acc;
        }, {} as Record<string, { itemCount: number, totalValue: number }>);

        return Object.keys(data).map((location) => {
            const values = data[location];
            return {
                location,
                ...values
            };
        }).sort((a, b) => b.totalValue - a.totalValue);
    }, [stockItems]);

    return (
        <div>
            <div className="flex justify-end mb-4 no-print">
                <button onClick={() => printContent(reportPrintRef.current, 'Relatório de Valor por Localização')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md text-sm">Gerar Relatório</button>
            </div>
            <div ref={reportPrintRef} className="border rounded-md p-4">
                <h4 className="font-bold">Valor Consolidado por Localização</h4>
                <p className="text-xs text-gray-500 mb-4">Data de Geração: {new Date().toLocaleString('pt-BR')}</p>
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="p-2 text-sm font-semibold text-gray-600">Localização</th>
                            <th className="p-2 text-sm font-semibold text-gray-600">Qtd. Itens no Local</th>
                            <th className="p-2 text-sm font-semibold text-gray-600">Valor Total em Estoque</th>
                        </tr>
                    </thead>
                    <tbody>
                        {valorPorLocal.map(item => (
                            <tr key={item.location} className="border-b">
                                <td className="p-2 text-sm">{item.location}</td>
                                <td className="p-2 text-sm">{item.itemCount}</td>
                                <td className="p-2 text-sm font-bold">{item.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            </tr>
                        ))}
                         {valorPorLocal.length === 0 && (
                            <tr><td colSpan={3} className="text-center p-4 text-gray-500">Nenhum item encontrado para gerar o relatório.</td></tr>
                         )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


const RelatoriosPage: React.FC<RelatoriosPageProps> = ({ title, stockItems, historyData, suppliers }) => {
  const [activeTab, setActiveTab] = useState('abaixoMinimo');
  
  const renderContent = () => {
    switch (activeTab) {
        case 'movimentacao':
            return <MovimentacaoReport stockItems={stockItems} historyData={historyData} />;
        case 'valorPorLocal':
            return <ValorPorLocalReport stockItems={stockItems} />;
        case 'abaixoMinimo':
        default:
            return <AbaixoMinimoReport stockItems={stockItems} suppliers={suppliers} />;
    }
  };

  return (
    <div>
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">{title}</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
             <nav className="mb-4 border-b no-print">
                <button onClick={() => setActiveTab('abaixoMinimo')} className={`py-2 px-4 inline-block text-sm font-medium ${activeTab === 'abaixoMinimo' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 border-b-2 border-transparent'}`}>Itens Abaixo do Mínimo</button>
                <button onClick={() => setActiveTab('movimentacao')} className={`py-2 px-4 inline-block text-sm font-medium ${activeTab === 'movimentacao' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 border-b-2 border-transparent'}`}>Movimentação por Período</button>
                <button onClick={() => setActiveTab('valorPorLocal')} className={`py-2 px-4 inline-block text-sm font-medium ${activeTab === 'valorPorLocal' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 border-b-2 border-transparent'}`}>Valor por Local</button>
            </nav>
            
            {renderContent()}

        </div>
    </div>
  );
};

export default RelatoriosPage;