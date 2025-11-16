

import React, { useState, useRef, useMemo } from 'react';
import { StockItem, ItemHistory } from '../types';

interface RelatoriosPageProps {
  title: string;
  stockItems: StockItem[];
  historyData: Record<string, ItemHistory[]>;
}

const AbaixoMinimoReport: React.FC<{ stockItems: StockItem[] }> = ({ stockItems }) => {
  const itemsAbaixoMinimo = stockItems.filter(i => i.systemStock <= i.minStock);
  const [pedidoItems, setPedidoItems] = useState<Record<string, string>>({});
  const printRef = useRef<HTMLDivElement>(null);

  const handlePedidoChange = (code: string, quantity: string) => {
    setPedidoItems(prev => ({ ...prev, [code]: quantity }));
  };
  
  const itemsParaPedir = itemsAbaixoMinimo.filter(item => {
    const description = pedidoItems[item.code];
    return description && description.trim() !== '';
  });
  
  const handleExportCsv = () => {
    const headers = ["CÓDIGO", "DESCRIÇÃO", "ESTOQUE ATUAL", "ESTOQUE MÍNIMO", "FORNECEDOR"];
    const csvRows = [
        headers.join(';'),
        ...itemsAbaixoMinimo.map(item => [
            item.code,
            `"${item.description}"`,
            item.systemStock,
            item.minStock,
            `"${item.supplier}"`
        ].join(';'))
    ];
    const csvString = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'relatorio_estoque_baixo.csv';
    link.click();
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
        <div className="flex justify-end space-x-2 mb-4">
            <button onClick={handleExportCsv} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md text-sm">Exportar para CSV</button>
        </div>
        <div className="border rounded-md p-4">
            <h4 className="font-bold">Itens Abaixo do Mínimo</h4>
            <p className="text-xs text-gray-500 mb-4">Data de Geração: {new Date().toLocaleString('pt-BR')}</p>
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-gray-50 border-b">
                        <th className="p-2 text-sm font-semibold text-gray-600">CÓDIGO</th>
                        <th className="p-2 text-sm font-semibold text-gray-600">DESCRIÇÃO</th>
                        <th className="p-2 text-sm font-semibold text-gray-600">QTD. REAL</th>
                        <th className="p-2 text-sm font-semibold text-gray-600">QTD. MÍNIMA</th>
                        <th className="p-2 text-sm font-semibold text-gray-600">Descrição do pedido</th>
                    </tr>
                </thead>
                <tbody>
                    {itemsAbaixoMinimo.map(item => (
                        <tr key={item.id} className="border-b">
                            <td className="p-2 text-sm">{item.code}</td>
                            <td className="p-2 text-sm">{item.description}</td>
                            <td className="p-2 text-sm text-red-600 font-bold">{item.systemStock}</td>
                            <td className="p-2 text-sm">{item.minStock}</td>
                            <td className="p-2"><input type="text" placeholder="Ex: Pedir 2 caixas" value={pedidoItems[item.code] || ''} onChange={e => handlePedidoChange(item.code, e.target.value)} className="w-40 p-1 border border-gray-300 rounded-md" /></td>
                        </tr>
                    ))}
                     {itemsAbaixoMinimo.length === 0 && (
                        <tr><td colSpan={5} className="text-center p-4 text-gray-500">Nenhum item abaixo do estoque mínimo.</td></tr>
                     )}
                </tbody>
            </table>
             <div className="flex justify-end mt-4">
                <button onClick={handlePrint} disabled={itemsParaPedir.length === 0} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                   🖨️ Imprimir Pedido ({itemsParaPedir.length})
                </button>
            </div>
        </div>
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
                                <td className="border p-2">{item.supplier}</td>
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

    const allHistory = useMemo(() => {
        // FIX: Replaced Object.entries with Object.keys to fix a type inference issue where
        // the value from the record was being typed as 'unknown' instead of 'ItemHistory[]'.
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

    const handleExportCsv = () => {
        const headers = ["Data", "Cód. Item", "Descrição", "Tipo", "Quantidade", "Usuário", "Setor/Solicitante", "Responsável", "Detalhes Entrada"];
        const csvRows = [
            headers.join(';'),
            ...filteredHistory.map(row => {
                const base = [row.date, row.code, `"${row.description.replace(/"/g, '""')}"`, row.type, row.quantity, row.user];
                if (row.type === 'Saída') {
                    return [...base, `"${row.requester.replace(/"/g, '""')}"`, `"${row.responsible.replace(/"/g, '""')}"`, ''].join(';');
                } else { // Entrada
                    return [...base, '', '', `"${row.details.replace(/"/g, '""')}"`].join(';');
                }
            })
        ];
        const csvString = csvRows.join('\n');
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `relatorio_movimentacao_${new Date().toISOString().slice(0,10)}.csv`;
        link.click();
    };

    return (
        <div>
            <div className="flex justify-between items-end mb-4">
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
                <button onClick={handleExportCsv} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md text-sm">Exportar para CSV</button>
            </div>
            <div className="border rounded-md p-4">
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
    const valorPorLocal = useMemo(() => {
        const data = stockItems.reduce((acc, item) => {
            const location = item.location || 'Não Localizado';
            if (!acc[location]) {
                acc[location] = { itemCount: 0, totalValue: 0 };
            }
            acc[location].itemCount++;
            acc[location].totalValue += item.systemStock * item.value;
            return acc;
        }, {} as Record<string, { itemCount: number, totalValue: number }>);

        // FIX: Replaced Object.entries with Object.keys to fix a type inference issue where
        // the value from the record was being typed as 'unknown', which is not a spreadable type.
        return Object.keys(data).map((location) => {
            const values = data[location];
            return {
                location,
                ...values
            };
        }).sort((a, b) => b.totalValue - a.totalValue);
    }, [stockItems]);

    const handleExportCsv = () => {
        const headers = ["Localização", "Qtd. Itens no Local", "Valor Total em Estoque (R$)"];
        const csvRows = [
            headers.join(';'),
            ...valorPorLocal.map(item => [
                `"${item.location}"`,
                item.itemCount,
                item.totalValue.toFixed(2).replace('.', ',')
            ].join(';'))
        ];
        const csvString = csvRows.join('\n');
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `relatorio_valor_por_local.csv`;
        link.click();
    };

    return (
        <div>
            <div className="flex justify-end mb-4">
                <button onClick={handleExportCsv} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md text-sm">Exportar para CSV</button>
            </div>
            <div className="border rounded-md p-4">
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


const RelatoriosPage: React.FC<RelatoriosPageProps> = ({ title, stockItems, historyData }) => {
  const [activeTab, setActiveTab] = useState('abaixoMinimo');
  
  const renderContent = () => {
    switch (activeTab) {
        case 'movimentacao':
            return <MovimentacaoReport stockItems={stockItems} historyData={historyData} />;
        case 'valorPorLocal':
            return <ValorPorLocalReport stockItems={stockItems} />;
        case 'abaixoMinimo':
        default:
            return <AbaixoMinimoReport stockItems={stockItems} />;
    }
  };

  return (
    <div>
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">{title}</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
             <nav className="mb-4 border-b">
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