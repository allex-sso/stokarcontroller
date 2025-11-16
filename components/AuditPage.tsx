
import React, { useState, useMemo } from 'react';
import { AuditLog } from '../types';

const LOGS_PER_PAGE = 10;

interface AuditPageProps {
  auditLogs: AuditLog[];
}

const AuditPage: React.FC<AuditPageProps> = ({ auditLogs }) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const uniqueUsers = useMemo(() => {
    const users = new Set(auditLogs.map(log => log.user));
    return ['all', ...Array.from(users)];
  }, [auditLogs]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const userMatch = userFilter === 'all' || log.user === userFilter;
      const searchMatch = log.action.toLowerCase().includes(searchFilter.toLowerCase());
      return userMatch && searchMatch;
    });
  }, [auditLogs, userFilter, searchFilter]);
  
  const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * LOGS_PER_PAGE;
    return filteredLogs.slice(startIndex, startIndex + LOGS_PER_PAGE);
  }, [currentPage, filteredLogs]);
  
  const handleExportLogs = () => {
     const headers = ["Data e Hora", "Usuário", "Ação Realizada"];
     const csvRows = [
         headers.join(';'),
         ...filteredLogs.map(log => [
             log.timestamp,
             log.user,
             `"${log.action.replace(/"/g, '""')}"` // Handle quotes in action string
         ].join(';'))
     ];
     const csvString = csvRows.join('\n');
     const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
     const link = document.createElement('a');
     link.href = URL.createObjectURL(blob);
     link.download = 'audit_logs.csv';
     link.click();
  };


  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Monitoramento de Auditoria</h1>

      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Usuário</label>
                  <select 
                    value={userFilter}
                    onChange={(e) => {
                        setUserFilter(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                      {uniqueUsers.map(user => (
                        <option key={user} value={user}>
                            {user === 'all' ? 'Todos os usuários' : user}
                        </option>
                      ))}
                  </select>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buscar na Ação</label>
                  <input 
                    type="text"
                    placeholder="Ex: login, item, etc." 
                    value={searchFilter}
                    onChange={(e) => {
                        setSearchFilter(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
              </div>
               <div className="flex justify-end">
                 <button onClick={handleExportLogs} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md">
                    Exportar Logs
                 </button>
               </div>
          </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3 text-sm font-semibold text-gray-600">Data e Hora</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Usuário</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Ação Realizada</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map(log => (
                <tr key={log.id} className="border-b">
                  <td className="p-3 text-sm text-gray-500 whitespace-nowrap">{log.timestamp}</td>
                  <td className="p-3 text-sm text-gray-800 font-medium">{log.user}</td>
                  <td className="p-3 text-sm text-gray-600">{log.action}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                    <td colSpan={3} className="text-center p-6 text-gray-500">Nenhum registro encontrado com os filtros aplicados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
                <p>Mostrando {paginatedLogs.length} de {filteredLogs.length} registros</p>
                <div className="flex items-center space-x-1">
                    <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-2 py-1 border rounded-md disabled:opacity-50">Primeira</button>
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-1 border rounded-md disabled:opacity-50">Anterior</button>
                    <span className="px-3 py-1 bg-gray-200 rounded-md">Página {currentPage} de {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2 py-1 border rounded-md disabled:opacity-50">Próxima</button>
                    <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-2 py-1 border rounded-md disabled:opacity-50">Última</button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AuditPage;
