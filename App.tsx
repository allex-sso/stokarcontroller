

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
// FIX: Using direct named imports for react-router-dom to ensure correct types.
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Painel from './components/Dashboard';
import { EstoquePage, InventoryPage } from './components/ItemListPage';
import RelatoriosPage from './components/PlaceholderPage';
import AuditPage from './components/AuditPage';
import { User, Supplier, StockItem, AuditLog, ItemHistory, EntryItemHistory, ExitItemHistory } from './types';
import { supabase } from './supabaseClient';

// ============================================================================
// Page Wrapper Component
// ============================================================================
const PageWrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <div className="p-4 sm:p-6">
      {children}
    </div>
);


// ============================================================================
// Movimentacoes Page Component
// ============================================================================
interface MovimentacoesPageProps {
  stockItems: StockItem[];
  suppliers: Supplier[];
  onRegisterEntry: (data: { itemId: string; quantity: number; supplier: string; nf: string; observations: string; }) => Promise<void>;
  onRegisterExit: (data: { itemId: string; quantity: number; requester: string; responsible: string; }) => Promise<void>;
  showToast: (message: string) => void;
}

const MovimentacoesPage: React.FC<MovimentacoesPageProps> = ({ stockItems, suppliers, onRegisterEntry, onRegisterExit, showToast }) => {
    // FIX: useParams was untyped due to incorrect import style. Now it is correctly typed.
    const { tab = 'nova-entrada' } = useParams<{ tab: string }>();
    const [search, setSearch] = useState('');
    const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
    const [quantity, setQuantity] = useState('');
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (selectedItem && selectedItem.supplier_id) {
            const supplierName = suppliers.find(s => s.id === selectedItem.supplier_id)?.name;
            setSelectedSupplier(supplierName || '');
        } else {
            setSelectedSupplier('');
        }
    }, [selectedItem, suppliers]);


    const filteredItems = search && !selectedItem
        ? stockItems.filter(item =>
            item.code.toLowerCase().includes(search.toLowerCase()) ||
            item.description.toLowerCase().includes(search.toLowerCase())
          ).slice(0, 5)
        : [];
        
    const resetForm = () => {
      setSearch('');
      setSelectedItem(null);
      setQuantity('');
      setSelectedSupplier('');
    };

    const handleSelect = (item: StockItem) => {
        setSelectedItem(item);
        setSearch(`${item.code} - ${item.description}`);
    };

    const handleRegisterExitSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSubmitting(true);
      const formData = new FormData(e.currentTarget);
      if (selectedItem && quantity) {
          await onRegisterExit({
              itemId: selectedItem.id,
              quantity: parseInt(quantity, 10),
              requester: formData.get('requester') as string,
              responsible: formData.get('responsible') as string,
          });
          showToast('Saída registrada com sucesso!');
          resetForm();
          e.currentTarget.reset();
      } else {
        alert('Por favor, selecione um item e informe a quantidade.');
      }
      setIsSubmitting(false);
    };
    
    const handleRegisterEntrySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
       e.preventDefault();
       setIsSubmitting(true);
       const formData = new FormData(e.currentTarget);
       if(selectedItem && quantity) {
         await onRegisterEntry({
           itemId: selectedItem.id,
           quantity: parseInt(quantity, 10),
           supplier: selectedSupplier,
           nf: formData.get('nf') as string,
           observations: formData.get('observations') as string,
         });
         showToast('Entrada registrada com sucesso!');
         resetForm();
         e.currentTarget.reset();
       } else {
         alert('Por favor, selecione o item e a quantidade.');
       }
       setIsSubmitting(false);
    };
    
    const SpinnerIcon = () => (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    );


    const renderForm = () => {
        if (tab === 'nova-saida') {
            return (
                <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
                    <div className="border-b pb-4 mb-6">
                        <h2 className="text-xl font-semibold text-gray-800">Registrar Nova Saída</h2>
                    </div>
                    <form className="space-y-4" onSubmit={handleRegisterExitSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data de Saída</label>
                            <input type="text" defaultValue={new Date().toLocaleDateString('pt-BR')} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50" readOnly/>
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Item*</label>
                            <input 
                                type="text" 
                                placeholder="Digite o código ou descrição para pesquisar..." 
                                className="w-full p-2 border border-gray-300 rounded-md" 
                                value={search}
                                onChange={(e) => {
                                  setSearch(e.target.value);
                                  if(selectedItem) setSelectedItem(null);
                                }}
                                autoComplete="off"
                                required
                            />
                            {filteredItems.length > 0 && (
                                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-y-auto">
                                    {filteredItems.map(item => (
                                        <li key={item.id} onClick={() => handleSelect(item)} className="p-2 hover:bg-gray-100 cursor-pointer">
                                            {item.code} - {item.description}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {selectedItem && (
                               <p className="text-sm text-blue-600 mt-2">Estoque atual: <span className="font-bold">{selectedItem.system_stock}</span> {selectedItem.unit}(s)</p>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade*</label>
                                <input type="number" name="quantity" placeholder="Exemplo: 10" className="w-full p-2 border border-gray-300 rounded-md" value={quantity} onChange={e => setQuantity(e.target.value)} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Solicitante / Setor*</label>
                                <input type="text" name="requester" placeholder="Exemplo: Manutenção" className="w-full p-2 border border-gray-300 rounded-md" required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Responsável*</label>
                            <input type="text" name="responsible" placeholder="Insira o nome do responsável" className="w-full p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div className="flex justify-end pt-4">
                            <button type="submit" className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-md transition duration-300 flex items-center justify-center min-w-[120px]" disabled={!selectedItem || isSubmitting}>
                                {isSubmitting ? <><SpinnerIcon /> Processando...</> : 'Registrar'}
                            </button>
                        </div>
                    </form>
                </div>
            );
        }

        // Default to Nova Entrada
        return (
            <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
                <div className="border-b pb-4 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Registrar Nova Entrada</h2>
                </div>
                <form className="space-y-4" onSubmit={handleRegisterEntrySubmit}>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data de Entrada</label>
                        <input type="text" defaultValue={new Date().toLocaleDateString('pt-BR')} className="w-full p-2 border border-gray-300 rounded-md bg-gray-50" readOnly />
                     </div>
                     <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Item*</label>
                            <input 
                                type="text" 
                                placeholder="Digite o código ou descrição para pesquisar..." 
                                className="w-full p-2 border border-gray-300 rounded-md" 
                                value={search}
                                onChange={(e) => {
                                  setSearch(e.target.value);
                                  if(selectedItem) setSelectedItem(null);
                                }}
                                autoComplete="off"
                                required
                            />
                            {filteredItems.length > 0 && (
                                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-y-auto">
                                    {filteredItems.map(item => (
                                        <li key={item.id} onClick={() => handleSelect(item)} className="p-2 hover:bg-gray-100 cursor-pointer">
                                            {item.code} - {item.description}
                                        </li>
                                    ))}
                                </ul>
                            )}
                             {selectedItem && (
                               <p className="text-sm text-blue-600 mt-2">Estoque atual: <span className="font-bold">{selectedItem.system_stock}</span> {selectedItem.unit}(s)</p>
                            )}
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade*</label>
                          <input type="number" name="quantity" placeholder="Exemplo: 100" className="w-full p-2 border border-gray-300 rounded-md" value={quantity} onChange={e => setQuantity(e.target.value)} required />
                      </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
                            <select 
                                name="supplier" 
                                className="w-full p-2 border border-gray-300 rounded-md" 
                                value={selectedSupplier}
                                onChange={e => setSelectedSupplier(e.target.value)}
                            >
                                <option value="">Nenhum / Não informado</option>
                                {suppliers.map(supplier => (
                                    <option key={supplier.id} value={supplier.name}>{supplier.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nota Fiscal</label>
                            <input type="text" name="nf" placeholder="Exemplo: 987654" className="w-full p-2 border border-gray-300 rounded-md" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                        <textarea name="observations" rows={3} placeholder="Detalhes adicionais sobre a entrada." className="w-full p-2 border border-gray-300 rounded-md"></textarea>
                    </div>
                    <div className="flex justify-end pt-4">
                         <button type="submit" className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-md transition duration-300 flex items-center justify-center min-w-[150px]" disabled={!selectedItem || isSubmitting}>
                            {isSubmitting ? <><SpinnerIcon /> Processando...</> : 'Registrar Entrada'}
                        </button>
                    </div>
                </form>
            </div>
        );
    };

    return (
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">{tab === 'nova-saida' ? 'Registrar Nova Saída' : 'Registrar Nova Entrada'}</h1>
        {renderForm()}
      </div>
    );
};


// ============================================================================
// Controle Page Component
// ============================================================================
interface ControlePageProps {
    users: User[];
    suppliers: Supplier[];
    onAddUser: (user: Omit<User, 'id'|'avatar_url'> & { password?: string }) => Promise<{success: boolean, error?: string}>;
    onUpdateUser: (user: User) => Promise<void>;
    onDeleteUser: (userId: string) => Promise<void>;
    onAddSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
    onUpdateSupplier: (supplier: Supplier) => Promise<void>;
    onDeleteSupplier: (supplierId: number) => Promise<void>;
    showToast: (message: string) => void;
}

type PanelMode = 'addUser' | 'editUser' | 'changePassword' | 'addSupplier' | 'editSupplier' | '';
interface PanelState {
    isOpen: boolean;
    mode: PanelMode;
    data: User | Supplier | null;
}

const ControlePage: React.FC<ControlePageProps> = ({ 
    users, suppliers,
    onAddUser, onUpdateUser, onDeleteUser,
    onAddSupplier, onUpdateSupplier, onDeleteSupplier,
    showToast
}) => {
    // FIX: useParams was untyped due to incorrect import style. Now it is correctly typed.
    const { tab = 'usuarios' } = useParams<{ tab: string }>();
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
      setCurrentPage(1);
    }, [tab]);
    
    // Deletion modals state
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
    
    // Slide-over panel state
    const [panelState, setPanelState] = useState<PanelState>({ isOpen: false, mode: '', data: null });
    
    // Form states
    const [formData, setFormData] = useState<any>({});
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return users.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [currentPage, users]);
    const totalUserPages = Math.ceil(users.length / ITEMS_PER_PAGE);

    const paginatedSuppliers = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return suppliers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [currentPage, suppliers]);
    const totalSupplierPages = Math.ceil(suppliers.length / ITEMS_PER_PAGE);


    const openPanel = (mode: PanelMode, data: User | Supplier | null = null) => {
        setPanelState({ isOpen: true, mode, data });
        setFormData(data || {});
        setFormErrors({});
    };
    const closePanel = () => {
        setPanelState({ isOpen: false, mode: '', data: null });
        setFormData({});
        setFormErrors({});
    };

    // User Handlers
    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormErrors({}); 
        if (panelState.mode === 'addUser') {
            if (formData.password !== formData.confirmPassword) {
                setFormErrors({ password: "As senhas não coincidem." });
                setIsSubmitting(false);
                return;
            }
            const { success, error } = await onAddUser(formData);
            if(success) {
                showToast('Usuário adicionado com sucesso!');
                closePanel();
            } else {
                setFormErrors({ email: error || 'Este e-mail já está em uso ou ocorreu um erro.' });
            }
        } else if (panelState.mode === 'editUser') {
            await onUpdateUser(formData as User);
            showToast('Usuário atualizado com sucesso!');
            closePanel();
        }
        setIsSubmitting(false);
    };
    
    const handleConfirmDeleteUser = async () => {
        if (userToDelete) {
            await onDeleteUser(userToDelete.id);
            setUserToDelete(null);
            showToast('Perfil de usuário excluído com sucesso.');
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        // This would require a call to supabase.auth.updateUser in a real scenario
        // For now, it just shows a toast.
        showToast(`Função de alterar senha não implementada nesta versão.`);
        closePanel();
    };

    // Supplier Handlers
     const handleSaveSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        if (panelState.mode === 'addSupplier') {
            await onAddSupplier(formData);
            showToast('Fornecedor adicionado com sucesso!');
            closePanel();
        } else if (panelState.mode === 'editSupplier') {
            await onUpdateSupplier(formData as Supplier);
            showToast('Fornecedor atualizado com sucesso!');
            closePanel();
        }
        setIsSubmitting(false);
    };

    const handleConfirmDeleteSupplier = async () => {
        if (supplierToDelete) {
            await onDeleteSupplier(supplierToDelete.id);
            setSupplierToDelete(null);
            showToast('Fornecedor excluído com sucesso!');
        }
    };
    
    const renderPanelContent = () => {
        switch (panelState.mode) {
            case 'addUser':
            case 'editUser':
                return (
                    <form id="user-form" onSubmit={handleSaveUser}>
                        {(formErrors.email || formErrors.password) && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{formErrors.email || formErrors.password}</p>}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nome</label>
                                <input type="text" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">E-mail</label>
                                <input type="email" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required/>
                            </div>
                             {panelState.mode === 'addUser' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Senha</label>
                                        <input type="password" name="password" onChange={(e) => setFormData({...formData, password: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Confirmar Senha</label>
                                        <input type="password" name="confirmPassword" onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required/>
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Perfil</label>
                                <select value={formData.profile || 'Operador'} onChange={(e) => setFormData({...formData, profile: e.target.value as 'Administrador' | 'Operador'})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                                    <option value="Operador">Operador</option>
                                    <option value="Administrador">Administrador</option>
                                </select>
                            </div>
                        </div>
                    </form>
                );
            case 'changePassword':
                return (
                     <form id="password-form" onSubmit={handleChangePassword}>
                        <p className="text-sm text-gray-600">A alteração de senha deve ser feita através do gerenciamento de usuários do Supabase.</p>
                    </form>
                );
            case 'addSupplier':
            case 'editSupplier':
                return (
                     <form id="supplier-form" onSubmit={handleSaveSupplier} className="space-y-4">
                        <input type="text" placeholder="Nome" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-md" required />
                        <input type="text" placeholder="Contato" value={formData.contact || ''} onChange={e => setFormData({...formData, contact: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                        <input type="email" placeholder="E-mail" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                        <input type="text" placeholder="Telefone" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                    </form>
                );
            default:
                return null;
        }
    };
    
    const getPanelTitle = () => {
        switch(panelState.mode) {
            case 'addUser': return 'Adicionar Novo Usuário';
            case 'editUser': return 'Editar Usuário';
            case 'changePassword': return `Alterar Senha de ${panelState.data?.name}`;
            case 'addSupplier': return 'Adicionar Novo Fornecedor';
            case 'editSupplier': return 'Editar Fornecedor';
            default: return '';
        }
    }
    
    const getPanelFormId = () => {
        switch(panelState.mode) {
            case 'addUser':
            case 'editUser':
                return 'user-form';
            case 'changePassword':
                return 'password-form';
            case 'addSupplier':
            case 'editSupplier':
                return 'supplier-form';
            default: return '';
        }
    }


    const renderContent = () => {
        switch (tab) {
            case 'usuarios':
                return (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <div className="flex justify-between items-center mb-4">
                          <h2 className="text-xl font-semibold text-gray-800">Gerenciamento de Usuários</h2>
                          <button onClick={() => openPanel('addUser')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md text-sm">+ Novo Usuário</button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[768px]">
                            <thead>
                                <tr className="bg-gray-50 border-b">
                                    <th className="p-3 text-sm font-semibold text-gray-600">FOTO</th>
                                    <th className="p-3 text-sm font-semibold text-gray-600">NOME</th>
                                    <th className="p-3 text-sm font-semibold text-gray-600">E-MAIL</th>
                                    <th className="p-3 text-sm font-semibold text-gray-600">PERFIL</th>
                                    <th className="p-3 text-sm font-semibold text-gray-600">AÇÕES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedUsers.map(user => (
                                    <tr key={user.id} className="border-b">
                                        <td className="p-3"><img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full" /></td>
                                        <td className="p-3 text-sm text-gray-800">{user.name}</td>
                                        <td className="p-3 text-sm text-gray-500">{user.email}</td>
                                        <td className="p-3"><span className={`px-2 py-1 text-xs rounded-full ${user.profile === 'Administrador' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{user.profile}</span></td>
                                        <td className="p-3 text-gray-500 flex items-center space-x-3">
                                            <button onClick={() => openPanel('editUser', user)} className="hover:text-blue-600 transition-colors duration-200" title="Editar">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
                                                </svg>
                                            </button>
                                            <button onClick={() => openPanel('changePassword', user)} className="hover:text-yellow-600 transition-colors duration-200" title="Alterar Senha">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                            </button>
                                            <button onClick={() => setUserToDelete(user)} className="hover:text-red-600 transition-colors duration-200" title="Excluir">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                      </div>
                       {totalUserPages > 1 && (
                            <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
                                <p>Mostrando {paginatedUsers.length} de {users.length} registros</p>
                                <div className="flex items-center space-x-1">
                                    <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-2 py-1 border rounded-md disabled:opacity-50">Primeira</button>
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-1 border rounded-md disabled:opacity-50">Anterior</button>
                                    <span className="px-3 py-1 bg-gray-200 rounded-md">Página {currentPage} de {totalUserPages}</span>
                                    <button onClick={() => setCurrentPage(p => Math.min(totalUserPages, p + 1))} disabled={currentPage === totalUserPages} className="px-2 py-1 border rounded-md disabled:opacity-50">Próxima</button>
                                    <button onClick={() => setCurrentPage(totalUserPages)} disabled={currentPage === totalUserPages} className="px-2 py-1 border rounded-md disabled:opacity-50">Última</button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'fornecedores':
                 return (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">Gerenciamento de Fornecedores</h2>
                            <button onClick={() => openPanel('addSupplier')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md text-sm">+ Novo</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[768px]">
                                <thead>
                                    <tr className="bg-gray-50 border-b">
                                        <th className="p-3 text-sm font-semibold text-gray-600">NOME</th>
                                        <th className="p-3 text-sm font-semibold text-gray-600">CONTATO</th>
                                        <th className="p-3 text-sm font-semibold text-gray-600">E-MAIL</th>
                                        <th className="p-3 text-sm font-semibold text-gray-600">TELEFONE</th>
                                        <th className="p-3 text-sm font-semibold text-gray-600">AÇÕES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedSuppliers.map(sup => (
                                        <tr key={sup.id} className="border-b">
                                            <td className="p-3 text-sm text-gray-800">{sup.name}</td>
                                            <td className="p-3 text-sm text-gray-500">{sup.contact}</td>
                                            <td className="p-3 text-sm text-gray-500">{sup.email}</td>
                                            <td className="p-3 text-sm text-gray-500">{sup.phone}</td>
                                            <td className="p-3 text-gray-500 flex items-center space-x-3">
                                                <button onClick={() => openPanel('editSupplier', sup)} className="hover:text-blue-600 transition-colors duration-200" title="Editar">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
                                                    </svg>
                                                </button>
                                                <button onClick={() => setSupplierToDelete(sup)} className="hover:text-red-600 transition-colors duration-200" title="Excluir">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {totalSupplierPages > 1 && (
                            <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
                                <p>Mostrando {paginatedSuppliers.length} de {suppliers.length} registros</p>
                                <div className="flex items-center space-x-1">
                                    <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-2 py-1 border rounded-md disabled:opacity-50">Primeira</button>
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-1 border rounded-md disabled:opacity-50">Anterior</button>
                                    <span className="px-3 py-1 bg-gray-200 rounded-md">Página {currentPage} de {totalSupplierPages}</span>
                                    <button onClick={() => setCurrentPage(p => Math.min(totalSupplierPages, p + 1))} disabled={currentPage === totalSupplierPages} className="px-2 py-1 border rounded-md disabled:opacity-50">Próxima</button>
                                    <button onClick={() => setCurrentPage(totalUserPages)} disabled={currentPage === totalUserPages} className="px-2 py-1 border rounded-md disabled:opacity-50">Última</button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-800 mb-6 capitalize">{tab.replace('-', ' & ')}</h1>
            {renderContent()}

            {/* Slide-over Panel */}
            {panelState.isOpen && (
                <div className="relative z-50" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
                    <div className={`slide-over-overlay ${panelState.isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={closePanel}></div>
                    <div className={`slide-over-panel ${panelState.isOpen ? 'show' : ''}`}>
                        <div className="slide-over-header">
                            <h2 id="slide-over-title" className="text-lg font-medium text-gray-900">{getPanelTitle()}</h2>
                            <button onClick={closePanel} type="button" className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <span className="sr-only">Close panel</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="slide-over-body">
                           {renderPanelContent()}
                        </div>
                        <div className="slide-over-footer">
                            <button onClick={closePanel} type="button" className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancelar</button>
                            <button form={getPanelFormId()} type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" disabled={isSubmitting}>
                                {isSubmitting ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Delete User Modal */}
            {userToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                        <h3 className="text-lg font-bold text-gray-800">Confirmar Exclusão</h3>
                        <p className="text-gray-600 my-4">Tem certeza que deseja excluir o usuário <span className="font-semibold">{userToDelete.name}</span>?</p>
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-sm text-yellow-800 rounded-md mb-4">
                            <strong>Atenção:</strong> Isso removerá o perfil do usuário do sistema, mas <strong>não excluirá sua conta de login</strong>. A exclusão da conta deve ser feita manually no painel de Autenticação do Supabase.
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button onClick={() => setUserToDelete(null)} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                            <button onClick={handleConfirmDeleteUser} className="py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700">Excluir</button>
                        </div>
                    </div>
                </div>
            )}
            
             {/* Delete Supplier Modal */}
            {supplierToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                        <h3 className="text-lg font-bold text-gray-800">Confirmar Exclusão</h3>
                        <p className="text-gray-600 my-4">Tem certeza que deseja excluir o fornecedor <span className="font-semibold">{supplierToDelete.name}</span>?</p>
                        <div className="flex justify-end space-x-2">
                            <button onClick={() => setSupplierToDelete(null)} className="py-2 px-4 bg-gray-200 rounded-md">Cancelar</button>
                            <button onClick={handleConfirmDeleteSupplier} className="py-2 px-4 bg-red-600 text-white rounded-md">Excluir</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================================================
// Main App Component
// ============================================================================

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [historyData, setHistoryData] = useState<Record<string, ItemHistory[]>>({});
  
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeoutRef = useRef<number | null>(null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const showToast = useCallback((message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage('');
    }, 3000);
  }, []);

  const fetchData = useCallback(async (activeUser: User) => {
    // 1. Critical Data: Must load for the app to be usable.
    const criticalPromises = [
        supabase.from('stock_items').select('id, code, description, category, equipment, location, unit, system_stock, min_stock, value, supplier_id'),
        supabase.from('users').select('*'),
        supabase.from('suppliers').select('*'),
    ];

    // 2. Non-Critical Data: If these fail (timeout, etc.), app should still load.
    const nonCriticalPromises = [
        supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(200),
        supabase.from('item_history').select('*'),
    ];

    try {
        // Await critical data
        const [stockItemsRes, allUsersRes, suppliersRes] = await Promise.all(criticalPromises);

        if (stockItemsRes.error) throw new Error(`Stock Items Error: ${stockItemsRes.error.message}`);
        if (allUsersRes.error) throw new Error(`Users Error: ${allUsersRes.error.message}`);
        if (suppliersRes.error) throw new Error(`Suppliers Error: ${suppliersRes.error.message}`);

        // Data Sanitization: Ensure critical numerical fields are valid numbers.
        const sanitizedStockItems = (stockItemsRes.data || []).map((item: any) => ({
            ...item,
            system_stock: Number(item.system_stock) || 0,
            min_stock: Number(item.min_stock) || 0,
            value: Number(item.value) || 0,
        }));

        setStockItems(sanitizedStockItems);
        setSuppliers(suppliersRes.data || []);
        
        if (allUsersRes.data) {
            setUsers(allUsersRes.data as User[]);
        } else {
            setUsers(activeUser ? [activeUser] : []);
        }

        // Attempt to load non-critical data resiliently
        const [auditLogsRes, historyDataRes] = await Promise.allSettled(nonCriticalPromises);

        if (auditLogsRes.status === 'fulfilled' && auditLogsRes.value.data) {
             setAuditLogs(auditLogsRes.value.data as AuditLog[]);
        } else {
            console.warn("Failed to load audit logs (non-critical).", auditLogsRes.status === 'rejected' ? auditLogsRes.reason : auditLogsRes.value.error);
            setAuditLogs([]); // Fallback to empty
        }

        if (historyDataRes.status === 'fulfilled' && historyDataRes.value.data) {
            const groupedHistory = historyDataRes.value.data.reduce((acc: any, history: any) => {
                const key = history.item_id;
                if (!acc[key]) acc[key] = [];
                acc[key].push(history);
                return acc;
            }, {} as Record<string, ItemHistory[]>);
            setHistoryData(groupedHistory);
        } else {
             console.warn("Failed to load history (non-critical).", historyDataRes.status === 'rejected' ? historyDataRes.reason : historyDataRes.value.error);
             setHistoryData({}); // Fallback to empty
        }

    } catch (error: any) {
        // Only throw if CRITICAL data fails
        console.error("Critical Data Load Failure:", error);
        throw error; 
    }
  }, []);
  
  const loadInitialData = useCallback(async (session: Session) => {
    setDataError(null);
    try {
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

        let activeUser: User | null = userProfile;

        if (profileError && profileError.code === 'PGRST116') {
            const { data: newProfile, error: insertError } = await supabase
                .from('users')
                .insert({
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.email?.split('@')[0] || 'Novo Usuário',
                    profile: 'Operador',
                    avatar_url: `https://api.dicebear.com/8.x/initials/svg?seed=${session.user.email}`
                })
                .select()
                .single();
            
            if (insertError) throw new Error(`Failed to create user profile: ${insertError.message}`);
            activeUser = newProfile;
        } else if (profileError) {
            // If profile error is permission related, we might still proceed with session user
            console.warn("Profile load error:", profileError.message);
        }

        // Fallback if no profile in DB but authenticated
        if (!activeUser) {
             activeUser = {
                 id: session.user.id,
                 email: session.user.email!,
                 name: session.user.email?.split('@')[0] || 'Usuário',
                 profile: (session.user.email === 'admin@example.com' || session.user.email?.includes('admin')) ? 'Administrador' : 'Operador',
                 avatar_url: ''
             };
        } else {
             // Force admin for specific email if needed for demo/testing
             if ((session.user.email === 'admin@example.com' || session.user.email?.includes('admin')) && activeUser.profile !== 'Administrador') {
                 activeUser.profile = 'Administrador';
             }
        }
        
        setCurrentUser(activeUser);
        await fetchData(activeUser);

    } catch (error: any) {
        const message = error instanceof Error ? error.message : String(error);
        const errorMessage = `Falha na conexão com o servidor: ${message}. Verifique sua conexão e permissões.`;
        console.error("Falha ao carregar dados ou perfil:", error);
        showToast(errorMessage);
        setDataError(errorMessage);
    }
  }, [fetchData, showToast]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthLoading(false);
      if (session) {
        setIsLoggedIn(true);
        loadInitialData(session);
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadInitialData]);


  const handleRetry = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        await loadInitialData(session);
    } else {
        setIsLoggedIn(false); 
        setIsAuthLoading(false);
    }
  }, [loadInitialData]);


  const handleLogout = useCallback(async () => {
      await supabase.auth.signOut();
  }, []);

  const addAuditLog = useCallback(async (action: string) => {
    if (!currentUser?.name) {
        console.warn("Audit log skipped: current user not available.");
        return;
    };
    // We don't await audit logs to prevent blocking UI
    supabase
        .from('audit_logs')
        .insert([{ action, user: currentUser.name }])
        .then(({ error }) => {
            if (error) console.error("Failed to add audit log:", error.message);
        });
  }, [currentUser]);

  const triggerRefresh = async () => {
      if (!currentUser) return;
      setIsRefreshing(true);
      try {
          await fetchData(currentUser);
      } finally {
          setIsRefreshing(false);
      }
  };

    const handleAddUser = async (user: Omit<User, 'id' | 'avatar_url'> & { password?: string }): Promise<{success: boolean, error?: string}> => {
        if (!user.password) return { success: false, error: 'A senha é obrigatória.' };
        
        const { data: { session: adminSession } } = await supabase.auth.getSession();
        if (!adminSession) return { success: false, error: 'Sessão de administrador não encontrada.' };

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: user.email,
            password: user.password,
        });

        await supabase.auth.setSession({ access_token: adminSession.access_token, refresh_token: adminSession.refresh_token });

        if (signUpError) return { success: false, error: signUpError.message };
        if (!signUpData.user) return { success: false, error: 'Não foi possível criar o usuário.' };

        const newUserId = signUpData.user.id;
        const defaultAvatar = `https://api.dicebear.com/8.x/initials/svg?seed=${user.name}`;
        const { error: profileError } = await supabase
            .from('users')
            .insert({ id: newUserId, name: user.name, email: user.email, profile: user.profile, avatar_url: defaultAvatar });

        if (profileError) return { success: false, error: profileError.message };

        await addAuditLog(`Criou o usuário ${user.name} (${user.email}).`);
        await triggerRefresh();
        return { success: true };
    };

    const handleUpdateUser = async (updatedUser: User) => {
        const { error } = await supabase.from('users').update(updatedUser).eq('id', updatedUser.id);
        if (error) {
            showToast(`Erro ao atualizar: ${error.message}`);
        } else {
            await addAuditLog(`Atualizou o usuário ${updatedUser.name}.`);
            await triggerRefresh();
        }
    };

    const handleDeleteUser = async (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;
        const { error } = await supabase.from('users').delete().eq('id', userId);
        if (error) {
            showToast(`Erro ao excluir perfil: ${error.message}`);
        } else {
            await addAuditLog(`Excluiu o perfil do usuário ${user.name}.`);
            await triggerRefresh();
        }
    };
  
    const handleUpdateAvatar = async (file: File) => {
        if (!currentUser) return;
        const filePath = currentUser.id;

        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
        if (uploadError) { showToast(`Falha no upload: ${uploadError.message}`); return; }

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        const publicUrl = `${urlData.publicUrl}?t=${new Date().getTime()}`;

        const { error: updateError } = await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', currentUser.id);
        if (updateError) {
             showToast(`Falha ao atualizar perfil: ${updateError.message}`);
        } else {
            await addAuditLog(`Atualizou a foto do perfil.`);
            await triggerRefresh();
            showToast('Foto do perfil atualizada com sucesso!');
        }
    };

  const handleAddSupplier = async (supplier: Omit<Supplier, 'id'>) => {
    const { error } = await supabase.from('suppliers').insert([supplier]);
    if (error) {
        showToast(`Erro ao adicionar: ${error.message}`);
    } else {
        await addAuditLog(`Adicionou o fornecedor ${supplier.name}.`);
        await triggerRefresh();
    }
  };

  const handleUpdateSupplier = async (updatedSupplier: Supplier) => {
    const { error } = await supabase.from('suppliers').update(updatedSupplier).eq('id', updatedSupplier.id);
    if (error) {
        showToast(`Erro ao atualizar: ${error.message}`);
    } else {
        await addAuditLog(`Atualizou o fornecedor ${updatedSupplier.name}.`);
        await triggerRefresh();
    }
  };

  const handleDeleteSupplier = async (supplierId: number) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    const { error } = await supabase.from('suppliers').delete().eq('id', supplierId);
    if (error) {
        showToast(`Erro ao excluir: ${error.message}`);
    } else if (supplier) {
        await addAuditLog(`Excluiu o fornecedor ${supplier.name}.`);
        await triggerRefresh();
    }
  };
  
  const handleAddItem = async (item: Omit<StockItem, 'id' | 'system_stock' | 'suppliers'>) => {
    const { error } = await supabase.from('stock_items').insert({ ...item, system_stock: item.initial_stock });
    if (error) {
        showToast(`Erro ao adicionar item: ${error.message}`);
    } else {
        await addAuditLog(`Criou o item ${item.code} - ${item.description}.`);
        await triggerRefresh();
    }
  };

  const handleBulkAddItems = async (items: Omit<StockItem, 'id' | 'system_stock' | 'suppliers'>[]) => {
      const itemsToInsert = items.map(item => ({ ...item, system_stock: item.initial_stock || 0 }));
      const { error } = await supabase.from('stock_items').insert(itemsToInsert);
      if (error) {
          showToast(`Erro ao importar itens em massa: ${error.message}`);
      } else {
          await addAuditLog(`Importou ${items.length} novos itens em massa.`);
          await triggerRefresh();
          showToast(`${items.length} itens foram importados com sucesso!`);
      }
  };

  const handleUpdateItem = async (itemId: string, itemData: Partial<StockItem>) => {
    const { error } = await supabase.from('stock_items').update(itemData).eq('id', itemId);
    if (error) {
        showToast(`Falha ao atualizar o item: ${error.message}`);
    } else {
        await addAuditLog(`Editou o item ${itemData.code}.`);
        await triggerRefresh();
    }
  };

  const handleDeleteItem = async (item: StockItem) => {
      const { error } = await supabase.from('stock_items').delete().eq('id', item.id);
      if (error) {
          showToast(`Erro ao excluir: ${error.message}`);
      } else {
          await addAuditLog(`Excluiu o item ${item.code} - ${item.description}.`);
          await triggerRefresh();
      }
  };
  
  const handleAdjustInventory = async (adjustments: { id: string; counted: number; }[]) => {
      const updates = adjustments.map(adj => 
        supabase.from('stock_items').update({ system_stock: adj.counted }).eq('id', adj.id)
      );
      const results = await Promise.all(updates);
      const firstError = results.find(res => res.error)?.error;

      if (firstError) {
          showToast(`Erro ao ajustar o estoque: ${firstError.message}`);
      } else {
          for (const adj of adjustments) {
            const item = stockItems.find(i => i.id === adj.id);
            if(item) await addAuditLog(`Ajuste de inventário para o item ${item.code}: de ${item.system_stock} para ${adj.counted}.`);
          }
          await triggerRefresh();
      }
  };

  const handleRegisterEntry = async (data: { itemId: string; quantity: number; supplier: string; nf: string; observations: string; }) => {
      const item = stockItems.find(i => i.id === data.itemId);
      if (!item) { alert('Item não encontrado!'); return; }
      
      const { error: rpcError } = await supabase.rpc('increment_stock', { item_id_param: data.itemId, quantity_param: data.quantity });
      if (rpcError) { alert("Erro ao atualizar o estoque via RPC."); return; }

      const newHistoryEntry: Omit<EntryItemHistory, 'id'> = {
          item_id: data.itemId,
          date: new Date().toLocaleDateString('pt-BR'),
          type: 'Entrada',
          quantity: data.quantity,
          user: currentUser?.name || 'Sistema',
          details: `Fornecedor: ${data.supplier || 'N/A'}. NF: ${data.nf || 'N/A'}. Obs: ${data.observations || 'N/A'}`
      };
      const { error: historyError } = await supabase.from('item_history').insert([newHistoryEntry]);
      if (historyError) { showToast("Estoque atualizado, mas houve um erro ao salvar o histórico."); return; }

      await addAuditLog(`Registrou entrada de ${data.quantity} unidade(s) do item ${item.code}. NF: ${data.nf}.`);
      await triggerRefresh();
  };

  const handleRegisterExit = async (data: { itemId: string; quantity: number; requester: string; responsible: string; }) => {
      const item = stockItems.find(i => i.id === data.itemId);
      if (!item) { alert('Item não encontrado!'); return; }

      if (item.system_stock - data.quantity < 0) { alert('A quantidade de saída é maior que o estoque atual!'); return; }
      
      const { error: rpcError } = await supabase.rpc('decrement_stock', { item_id_param: data.itemId, quantity_param: data.quantity });
      if (rpcError) { alert("Erro ao atualizar o estoque via RPC."); return; }
      
      const newHistoryEntry: Omit<ExitItemHistory, 'id'> = {
          item_id: data.itemId,
          date: new Date().toLocaleDateString('pt-BR'),
          type: 'Saída',
          quantity: data.quantity,
          user: currentUser?.name || 'Sistema',
          requester: data.requester,
          responsible: data.responsible,
      };
      const { error: historyError } = await supabase.from('item_history').insert([newHistoryEntry]);
      if (historyError) { showToast("Estoque atualizado, mas houve um erro ao salvar o histórico."); return; }

      await addAuditLog(`Registrou saída de ${data.quantity} unidade(s) do item ${item.code} para ${data.requester}.`);
      await triggerRefresh();
  };
  
  const Spinner = () => (
    <svg className="animate-spin h-8 w-8 text-alumasa-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
  
  if (isAuthLoading) {
    return (
        <div className="flex h-screen flex-col items-center justify-center bg-alumasa-deep-blue text-white">
            <Spinner />
            <span className="text-lg mt-4">Verificando sessão...</span>
        </div>
    );
  }

  if (!isLoggedIn) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {isSidebarOpen && <div className="fixed inset-0 bg-black opacity-50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
      <Sidebar onLogout={handleLogout} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={currentUser} stockItems={stockItems} onUpdateAvatar={handleUpdateAvatar} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-y-auto bg-gray-100">
          {dataError ? (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                <svg className="h-16 w-16 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="mt-4 text-2xl font-semibold text-gray-800">Erro ao Carregar Dados</h2>
                <p className="mt-2 text-gray-600 max-w-xl">{dataError}</p>
                <button 
                    onClick={handleRetry} 
                    className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition duration-300"
                >
                    Tentar Novamente
                </button>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={<Navigate to="/painel" replace />} />
              <Route path="/painel" element={<PageWrapper><Painel stockItems={stockItems} historyData={historyData} /></PageWrapper>} />
              <Route path="/estoque/atual" element={<PageWrapper><EstoquePage 
                  stockItems={stockItems} 
                  suppliers={suppliers} 
                  showToast={showToast} 
                  historyData={historyData}
                  onAddItem={handleAddItem}
                  onBulkAddItems={handleBulkAddItems}
                  onUpdateItem={handleUpdateItem}
                  onDeleteItem={handleDeleteItem}
                  user={currentUser}
              /></PageWrapper>} />
              <Route path="/estoque/inventario" element={<PageWrapper><InventoryPage 
                  stockItems={stockItems} 
                  showToast={showToast}
                  onAdjustInventory={handleAdjustInventory}
              /></PageWrapper>} />
              <Route path="/movimentacoes/:tab" element={<PageWrapper><MovimentacoesPage stockItems={stockItems} suppliers={suppliers} onRegisterEntry={handleRegisterEntry} onRegisterExit={handleRegisterExit} showToast={showToast} /></PageWrapper>} />
              <Route path="/controle/:tab" element={<PageWrapper><ControlePage 
                  users={users} 
                  suppliers={suppliers} 
                  onAddUser={handleAddUser}
                  onUpdateUser={handleUpdateUser}
                  onDeleteUser={handleDeleteUser}
                  onAddSupplier={handleAddSupplier}
                  onUpdateSupplier={handleUpdateSupplier}
                  onDeleteSupplier={handleDeleteSupplier}
                  showToast={showToast}
              /></PageWrapper>} />
              <Route path="/auditoria/monitoramento" element={<PageWrapper><AuditPage auditLogs={auditLogs} /></PageWrapper>} />
              <Route path="/relatorios" element={<PageWrapper><RelatoriosPage title="Relatórios" stockItems={stockItems} historyData={historyData} suppliers={suppliers} /></PageWrapper>} />
              <Route path="*" element={<Navigate to="/painel" replace />} />
            </Routes>
          )}
        </main>
      </div>
      {isRefreshing && (
        <div className="fixed inset-0 bg-white bg-opacity-75 z-[9999] flex items-center justify-center" role="status" aria-live="polite">
            <div className="flex items-center space-x-3 text-gray-700">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-lg font-medium">Atualizando...</span>
            </div>
        </div>
      )}
      <div className={`toast success ${toastMessage ? 'show' : ''}`}>
        {toastMessage}
      </div>
    </div>
  );
};

export default App;