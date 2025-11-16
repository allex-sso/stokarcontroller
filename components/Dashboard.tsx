

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CategoryDistribution, StockItem, ItemHistory } from '../types';

interface DashboardCardProps {
  title: React.ReactNode;
  value: React.ReactNode;
  icon: React.ReactNode;
  bgColor: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon, bgColor }) => (
  <div className={`rounded-lg shadow-md p-4 flex items-center space-x-4 text-white ${bgColor} h-full`}>
    <div className="bg-black/20 rounded-full p-3.5 flex-shrink-0">
      {icon}
    </div>
    <div className="flex-grow">
      <p className="text-sm leading-tight">{title}</p>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  </div>
);

interface PainelProps {
    stockItems: StockItem[];
    historyData: Record<string, ItemHistory[]>;
}

const Painel: React.FC<PainelProps> = ({ stockItems, historyData }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const parseDate = (dateString: string) => {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return null;
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  const filteredData = useMemo(() => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);

    let totalEntradas = 0;
    let totalSaidas = 0;
    const consumptionMap = new Map<string, number>();

    for (const itemId in historyData) {
      const itemHistories = historyData[itemId];
      const item = stockItems.find(i => i.id === itemId);
      if (!item) continue;

      for (const history of itemHistories) {
        const historyDate = parseDate(history.date);
        if (!historyDate) continue;

        const isAfterStart = start ? historyDate >= start : true;
        const isBeforeEnd = end ? historyDate <= end : true;

        if (isAfterStart && isBeforeEnd) {
          if (history.type === 'Entrada') {
            totalEntradas += history.quantity;
          } else if (history.type === 'Saída') {
            totalSaidas += history.quantity;
            const consumedValue = (consumptionMap.get(item.description) || 0) + (history.quantity * item.value);
            consumptionMap.set(item.description, consumedValue);
          }
        }
      }
    }

    const topConsumed = Array.from(consumptionMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
      
    const finalTopConsumed = topConsumed.length > 0 ? topConsumed : [];

    return { totalEntradas, totalSaidas, topConsumed: finalTopConsumed };
  }, [stockItems, historyData, startDate, endDate]);
  
  const categoryDistribution: CategoryDistribution[] = useMemo(() => {
    if (!stockItems || stockItems.length === 0) return [];

    const categoryMap = new Map<string, { value: number, items: number }>();
    const totalValue = stockItems.reduce((acc, item) => acc + (item.system_stock * item.value), 0);

    stockItems.forEach(item => {
        const category = item.category || 'Sem Categoria';
        const itemValue = item.system_stock * item.value;
        const current = categoryMap.get(category) || { value: 0, items: 0 };
        current.value += itemValue;
        current.items += 1;
        categoryMap.set(category, current);
    });
    
    if (totalValue === 0) {
        return Array.from(categoryMap.entries()).map(([name, data]) => ({
            name,
            value: 0,
            items: data.items,
            color: '#cccccc' // a default color
        }));
    }

    const COLORS = ['#34D399', '#FBBF24', '#60A5FA', '#F87171', '#A78BFA', '#F472B6', '#38BDF8', '#818CF8', '#FCD34D', '#A3E635'];

    return Array.from(categoryMap.entries())
        .map(([name, data], index) => ({
            name,
            value: parseFloat(((data.value / totalValue) * 100).toFixed(1)),
            items: data.items,
            color: COLORS[index % COLORS.length]
        }))
        .sort((a, b) => b.value - a.value);

}, [stockItems]);


  const { totalEntradas, totalSaidas, topConsumed } = filteredData;
  const displayTopConsumed = topConsumed

  const maxBarValue = Math.max(...displayTopConsumed.map(item => item.value), 1);
  const itemsAbaixoMinimo = stockItems.filter(i => i.system_stock <= i.min_stock).length;
  const totalValue = stockItems.reduce((acc, item) => acc + (item.system_stock * item.value), 0);

  const icons = {
    estoque: <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-1.414 1.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-1.414-1.414A1 1 0 006.586 13H4" /></svg>,
    quantidade: <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>,
    minimo: <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V17a2 2 0 01-2 2z" /></svg>,
    entradas: <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h5a3 3 0 013 3v1" /></svg>,
    saidas: <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  };

  return (
    <div>
       <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Painel</h1>
        <div className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm border">
            <label htmlFor="start-date" className="text-sm font-medium text-gray-700">Período:</label>
            <input 
                type="date" 
                id="start-date"
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                className="p-1 border border-gray-300 rounded-md text-sm"
            />
            <span className="text-gray-500">-</span>
            <input 
                type="date" 
                id="end-date"
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                className="p-1 border border-gray-300 rounded-md text-sm"
            />
            <button 
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-sm text-blue-600 hover:underline px-2"
                title="Limpar filtros"
            >
                Limpar
            </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
        <Link to="/estoque/atual" className="transform hover:-translate-y-1 transition-transform duration-200">
          <DashboardCard
            bgColor="bg-cyan-500"
            icon={icons.estoque}
            title={<>Valor Total em<br/>Estoque</>}
            value={
              <div className="flex items-baseline space-x-1">
                <span className="text-xl font-medium">R$</span>
                <span>{totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            }
          />
        </Link>
        <Link to="/estoque/atual" className="transform hover:-translate-y-1 transition-transform duration-200">
          <DashboardCard
            bgColor="bg-slate-600"
            icon={icons.quantidade}
            title={<>Total de<br/>Itens</>}
            value={stockItems.length.toString()}
          />
        </Link>
        <Link to="/estoque/atual?filtro=abaixo-minimo" className="transform hover:-translate-y-1 transition-transform duration-200">
          <DashboardCard
            bgColor="bg-amber-500"
            icon={icons.minimo}
            title={<>Itens Abaixo do<br/>Mínimo</>}
            value={itemsAbaixoMinimo}
          />
        </Link>
        <Link to="/movimentacoes/nova-entrada" className="transform hover:-translate-y-1 transition-transform duration-200">
          <DashboardCard
            bgColor="bg-emerald-500"
            icon={icons.entradas}
            title={<>Entradas no<br/>Período</>}
            value={totalEntradas.toLocaleString('pt-BR')}
          />
        </Link>
        <Link to="/movimentacoes/nova-saida" className="transform hover:-translate-y-1 transition-transform duration-200">
          <DashboardCard
            bgColor="bg-orange-600"
            icon={icons.saidas}
            title={<>Saídas no<br/>Período</>}
            value={totalSaidas.toLocaleString('pt-BR')}
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md xl:col-span-3">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Top 7 Itens Consumidos (Valor)</h2>
          <div className="space-y-4">
            {displayTopConsumed.map((item, index) => (
              <div key={`${item.name}-${index}`} className="relative group">
                <div className="flex items-center">
                    <p className="w-24 text-sm text-gray-600 shrink-0">{item.name}</p>
                    <div className="flex-1 bg-gray-200 rounded-full h-5">
                      <div 
                        className="bg-blue-500 h-5 rounded-full flex items-center justify-end pr-2 text-white text-xs"
                        style={{ width: `${(item.value / maxBarValue) * 100}%` }}
                      >
                        {item.value > 0 ? item.value.toLocaleString('pt-BR') : ''}
                      </div>
                    </div>
                </div>
                 <div className="absolute bottom-full left-24 mb-1 w-max p-2 text-xs text-white bg-gray-900 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 invisible group-hover:visible z-10">
                    {item.name}: {item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
            ))}
             {displayTopConsumed.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                    Nenhum dado de consumo para o período selecionado.
                </div>
            )}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md xl:col-span-2">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Itens por Categoria (Valor)</h2>
          {categoryDistribution.length > 0 ? (
            <div className="flex items-center justify-center space-x-8">
              <div className="relative w-40 h-40">
                  <svg viewBox="0 0 36 36" className="transform -rotate-90">
                      {(() => {
                          let accumulated = 0;
                          return categoryDistribution.map((cat: CategoryDistribution) => {
                              if (cat.value === 0) return null;
                              const dasharray = `${cat.value} ${100 - cat.value}`;
                              const dashoffset = -accumulated;
                              accumulated += cat.value;
                              return (
                                  <circle key={cat.name} cx="18" cy="18" r="15.9155" fill="transparent" stroke={cat.color} strokeWidth="3.8" strokeDasharray={dasharray} strokeDashoffset={dashoffset}>
                                      <title>{`${cat.name}: ${cat.value}% (${cat.items} ${cat.items === 1 ? 'item' : 'itens'})`}</title>
                                  </circle>
                              )
                          })
                      })()}
                  </svg>
              </div>
              <div className="text-sm space-y-2">
                  {categoryDistribution.slice(0, 7).map((cat: CategoryDistribution) => (
                      <div key={cat.name} className="flex items-center">
                          <span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: cat.color}}></span>
                          <span>{cat.name} {cat.value}%</span>
                      </div>
                  ))}
              </div>
            </div>
             ) : (
                <div className="text-center text-gray-500 py-8">
                    Nenhum item em estoque para exibir as categorias.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Painel;