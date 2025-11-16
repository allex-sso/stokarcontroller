

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, Link, useParams } from 'react-router-dom';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Painel from './components/Dashboard';
import EstoquePage, { InventoryPage } from './components/ItemListPage';
import RelatoriosPage from './components/PlaceholderPage';
import AuditPage from './components/AuditPage';
import { mockUsers, mockSuppliers, mockStockItems, mockAuditLogs, mockHistoryData } from './constants';
import { User, Supplier, StockItem, AuditLog, ItemHistory, EntryItemHistory, ExitItemHistory } from './types';


// ============================================================================
// Movimentacoes Page Component
// ============================================================================
interface MovimentacoesPageProps {
  stockItems: StockItem[];
  suppliers: Supplier[];
  onRegisterEntry: (data: { itemId: string; quantity: number; supplier: string; nf: string; observations: string; }) => void;
  onRegisterExit: (data: { itemId: string; quantity: number; requester: string; responsible: string; }) => void;
  showToast: (message: string) => void;
}

const MovimentacoesPage: React.FC<MovimentacoesPageProps> = ({ stockItems, suppliers, onRegisterEntry, onRegisterExit, showToast }) => {
    const { tab = 'nova-entrada' } = useParams<{ tab: string }>();
    const [search, setSearch] = useState('');
    const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
    const [quantity, setQuantity] = useState('');
    const [selectedSupplier, setSelectedSupplier] = useState('');

    useEffect(() => {
        if (selectedItem) {
            setSelectedSupplier(selectedItem.supplier || '');
        } else {
            setSelectedSupplier('');
        }
    }, [selectedItem]);


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

    const handleRegisterExitSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      if (selectedItem && quantity) {
          onRegisterExit({
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
    };
    
    const handleRegisterEntrySubmit = (e: React.FormEvent<HTMLFormElement>) => {
       e.preventDefault();
       const formData = new FormData(e.currentTarget);
       if(selectedItem && quantity) {
         onRegisterEntry({
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
    };


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
                        </div>
                        <div className="grid grid-cols-2 gap-4">
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
                            <button type="submit" className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-md transition duration-300" disabled={!selectedItem}>
                                Registrar
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
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade*</label>
                          <input type="number" name="quantity" placeholder="Exemplo: 100" className="w-full p-2 border border-gray-300 rounded-md" value={quantity} onChange={e => setQuantity(e.target.value)} required />
                      </div>
                     <div className="grid grid-cols-2 gap-4">
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
                         <button type="submit" className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-md transition duration-300" disabled={!selectedItem}>
                            Registrar Entrada
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
    allData: object;
    onAddUser: (user: Omit<User, 'id'|'avatarUrl'>) => boolean;
    onUpdateUser: (user: User) => void;
    onDeleteUser: (userId: number) => void;
    onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
    onUpdateSupplier: (supplier: Supplier) => void;
    onDeleteSupplier: (supplierId: number) => void;
    onRestoreBackup: (data: any) => void;
    showToast: (message: string) => void;
}
const ControlePage: React.FC<ControlePageProps> = ({ 
    users, suppliers, allData,
    onAddUser, onUpdateUser, onDeleteUser,
    onAddSupplier, onUpdateSupplier, onDeleteSupplier,
    onRestoreBackup,
    showToast
}) => {
    const { tab = 'usuarios' } = useParams<{ tab: string }>();
    
    // Modals state - Users
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [userToChangePassword, setUserToChangePassword] = useState<User | null>(null);
    const [showAddUserModal, setShowAddUserModal] = useState(false);
     // Modals state - Suppliers
    const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
    const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
    const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
    
    // Form states - Users
    const [newUser, setNewUser] = useState<Omit<User, 'id' | 'avatarUrl'>>({ name: '', email: '', profile: 'Operador' });
    const [addUserError, setAddUserError] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    // Form states - Suppliers
    const [newSupplier, setNewSupplier] = useState<Omit<Supplier, 'id'>>({ name: '', contact: '', email: '', phone: '' });
    const restoreInputRef = useRef<HTMLInputElement>(null);
    
    // Mock logged-in user for permission check. Let's assume the admin is logged in.
    const loggedInUser: User | undefined = users.find(u => u.profile === 'Administrador');

    const handleOpenEditUserModal = (user: User) => setUserToEdit({ ...user });
    const handleSaveUserChanges = () => {
        if (userToEdit) {
            onUpdateUser(userToEdit);
            setUserToEdit(null);
            showToast('Usuário atualizado com sucesso!');
        }
    };
    const handleConfirmDeleteUser = () => {
        if (userToDelete) {
            onDeleteUser(userToDelete.id);
            setUserToDelete(null);
            showToast('Usuário excluído com sucesso!');
        }
    };
    const handleAddNewUser = (e: React.FormEvent) => {
        e.preventDefault();
        const success = onAddUser(newUser);
        if (success) {
            setShowAddUserModal(false);
            setNewUser({ name: '', email: '', profile: 'Operador' });
            setAddUserError('');
            showToast('Usuário adicionado com sucesso!');
        } else {
            setAddUserError('Este e-mail já está em uso.');
        }
    };
    const handleChangePassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setPasswordError('As senhas não coincidem.');
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        showToast(`Senha do usuário ${userToChangePassword?.name} alterada com sucesso!`);
        setUserToChangePassword(null);
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
    };
    const handleOpenChangePasswordModal = (user: User) => {
        if (loggedInUser?.profile !== 'Administrador') {
            alert('Apenas administradores podem alterar senhas.');
            return;
        }
        setUserToChangePassword(user);
    };

    // Supplier Handlers
    const handleOpenEditSupplierModal = (supplier: Supplier) => setSupplierToEdit({ ...supplier });
    const handleSaveSupplierChanges = () => {
        if (supplierToEdit) {
            onUpdateSupplier(supplierToEdit);
            setSupplierToEdit(null);
            showToast('Fornecedor atualizado com sucesso!');
        }
    };
    const handleConfirmDeleteSupplier = () => {
        if (supplierToDelete) {
            onDeleteSupplier(supplierToDelete.id);
            setSupplierToDelete(null);
            showToast('Fornecedor excluído com sucesso!');
        }
    };
    const handleAddNewSupplier = (e: React.FormEvent) => {
        e.preventDefault();
        onAddSupplier(newSupplier);
        setShowAddSupplierModal(false);
        setNewSupplier({ name: '', contact: '', email: '', phone: '' });
        showToast('Fornecedor adicionado com sucesso!');
    };

    // Backup handlers
    const handleCreateBackup = () => {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(allData, null, 2)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `backup-alumasa-${new Date().toISOString()}.json`;
        link.click();
    };

    const handleRestoreClick = () => {
        restoreInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target?.result;
                    if (typeof text !== 'string') throw new Error("File content is not a string");
                    const data = JSON.parse(text);
                    if (window.confirm("Tem certeza que deseja restaurar este backup? Todos os dados atuais serão substituídos.")) {
                       onRestoreBackup(data);
                       showToast("Backup restaurado com sucesso!");
                    }
                } catch (error) {
                    alert("Erro ao ler o arquivo de backup. Verifique se o arquivo é um JSON válido.");
                    console.error("Backup restore error:", error);
                }
            };
            reader.readAsText(file);
             // Reset input value to allow selecting the same file again
            event.target.value = '';
        }
    };


    const renderContent = () => {
        switch (tab) {
            case 'usuarios':
                return (
                  <>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <div className="flex justify-between items-center mb-4">
                          <h2 className="text-xl font-semibold text-gray-800">Gerenciamento de Usuários</h2>
                          <button onClick={() => setShowAddUserModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md text-sm">+ Novo usuário</button>
                      </div>
                      <table className="w-full text-left">
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
                              {users.map(user => (
                                  <tr key={user.id} className="border-b">
                                      <td className="p-3"><img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full" /></td>
                                      <td className="p-3 text-sm text-gray-800">{user.name}</td>
                                      <td className="p-3 text-sm text-gray-500">{user.email}</td>
                                      <td className="p-3"><span className={`px-2 py-1 text-xs rounded-full ${user.profile === 'Administrador' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{user.profile}</span></td>
                                      <td className="p-3 text-gray-500 flex items-center space-x-3">
                                          <button onClick={() => handleOpenEditUserModal(user)} className="hover:text-blue-600 transition-colors duration-200" title="Editar">
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
                                              </svg>
                                          </button>
                                          <button onClick={() => handleOpenChangePasswordModal(user)} className="hover:text-yellow-600 transition-colors duration-200" title="Alterar Senha">
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
                    
                    {/* Add User Modal */}
                    {showAddUserModal && (
                         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Adicionar Novo Usuário</h3>
                                <form onSubmit={handleAddNewUser}>
                                    {addUserError && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{addUserError}</p>}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Nome</label>
                                            <input type="text" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required/>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">E-mail</label>
                                            <input type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required/>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Perfil</label>
                                            <select value={newUser.profile} onChange={(e) => setNewUser({...newUser, profile: e.target.value as 'Administrador' | 'Operador'})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                                                <option value="Operador">Operador</option>
                                                <option value="Administrador">Administrador</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end space-x-2 mt-6">
                                        <button type="button" onClick={() => setShowAddUserModal(false)} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                                        <button type="submit" className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">Adicionar</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Edit User Modal */}
                    {userToEdit && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Editar Usuário</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Nome</label>
                                        <input type="text" value={userToEdit.name} onChange={(e) => setUserToEdit({...userToEdit, name: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">E-mail</label>
                                        <input type="email" value={userToEdit.email} onChange={(e) => setUserToEdit({...userToEdit, email: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Perfil</label>
                                        <select value={userToEdit.profile} onChange={(e) => setUserToEdit({...userToEdit, profile: e.target.value as 'Administrador' | 'Operador'})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                                            <option>Administrador</option>
                                            <option>Operador</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-2 mt-6">
                                    <button onClick={() => setUserToEdit(null)} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                                    <button onClick={handleSaveUserChanges} className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">Salvar</button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Delete User Modal */}
                    {userToDelete && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                                <h3 className="text-lg font-bold text-gray-800">Confirmar Exclusão</h3>
                                <p className="text-gray-600 my-4">Tem certeza que deseja excluir o usuário <span className="font-semibold">{userToDelete.name}</span>? Esta ação não pode ser desfeita.</p>
                                <div className="flex justify-end space-x-2">
                                    <button onClick={() => setUserToDelete(null)} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                                    <button onClick={handleConfirmDeleteUser} className="py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700">Excluir</button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Change Password Modal */}
                     {userToChangePassword && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Alterar Senha para {userToChangePassword.name}</h3>
                                <form onSubmit={handleChangePassword}>
                                    {passwordError && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{passwordError}</p>}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Nova Senha</label>
                                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required/>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Confirmar Senha</label>
                                            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required/>
                                        </div>
                                    </div>
                                    <div className="flex justify-end space-x-2 mt-6">
                                        <button type="button" onClick={() => setUserToChangePassword(null)} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                                        <button type="submit" className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">Alterar</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                  </>
                );
            case 'fornecedores':
                 return (
                  <>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">Gerenciamento de Fornecedores</h2>
                            <button onClick={() => setShowAddSupplierModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md text-sm">+ Novo</button>
                        </div>
                        <table className="w-full text-left">
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
                                {suppliers.map(sup => (
                                    <tr key={sup.id} className="border-b">
                                        <td className="p-3 text-sm text-gray-800">{sup.name}</td>
                                        <td className="p-3 text-sm text-gray-500">{sup.contact}</td>
                                        <td className="p-3 text-sm text-gray-500">{sup.email}</td>
                                        <td className="p-3 text-sm text-gray-500">{sup.phone}</td>
                                        <td className="p-3 text-gray-500 flex items-center space-x-3">
                                            <button onClick={() => handleOpenEditSupplierModal(sup)} className="hover:text-blue-600 transition-colors duration-200" title="Editar">
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

                    {/* Add Supplier Modal */}
                    {showAddSupplierModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Adicionar Novo Fornecedor</h3>
                                <form onSubmit={handleAddNewSupplier} className="space-y-4">
                                    <input type="text" placeholder="Nome" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} className="w-full px-3 py-2 border rounded-md" required />
                                    <input type="text" placeholder="Contato" value={newSupplier.contact} onChange={e => setNewSupplier({...newSupplier, contact: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                                    <input type="email" placeholder="E-mail" value={newSupplier.email} onChange={e => setNewSupplier({...newSupplier, email: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                                    <input type="text" placeholder="Telefone" value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                                    <div className="flex justify-end space-x-2 mt-4">
                                        <button type="button" onClick={() => setShowAddSupplierModal(false)} className="py-2 px-4 bg-gray-200 rounded-md">Cancelar</button>
                                        <button type="submit" className="py-2 px-4 bg-blue-600 text-white rounded-md">Adicionar</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                    
                    {/* Edit Supplier Modal */}
                    {supplierToEdit && (
                         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Editar Fornecedor</h3>
                                <form onSubmit={(e) => { e.preventDefault(); handleSaveSupplierChanges(); }} className="space-y-4">
                                    <input type="text" placeholder="Nome" value={supplierToEdit.name} onChange={e => setSupplierToEdit({...supplierToEdit, name: e.target.value})} className="w-full px-3 py-2 border rounded-md" required />
                                    <input type="text" placeholder="Contato" value={supplierToEdit.contact} onChange={e => setSupplierToEdit({...supplierToEdit, contact: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                                    <input type="email" placeholder="E-mail" value={supplierToEdit.email} onChange={e => setSupplierToEdit({...supplierToEdit, email: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                                    <input type="text" placeholder="Telefone" value={supplierToEdit.phone} onChange={e => setSupplierToEdit({...supplierToEdit, phone: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                                    <div className="flex justify-end space-x-2 mt-4">
                                        <button type="button" onClick={() => setSupplierToEdit(null)} className="py-2 px-4 bg-gray-200 rounded-md">Cancelar</button>
                                        <button type="submit" className="py-2 px-4 bg-blue-600 text-white rounded-md">Salvar</button>
                                    </div>
                                </form>
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
                  </>
                );
            case 'backup':
                 return (
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h2 className="text-xl font-semibold text-gray-800 mb-4">Criar Backup do Sistema</h2>
                      <p className="text-gray-600 mb-4 text-sm">Crie um arquivo de backup com todos os dados atuais do sistema, incluindo itens, usuários e histórico de movimentações. Guarde este arquivo em um local seguro.</p>
                      <button onClick={handleCreateBackup} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md">
                        ↓ Criar e Baixar Backup
                      </button>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h2 className="text-xl font-semibold text-gray-800 mb-4">Restaurar a partir de um backup</h2>
                       <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                        <p className="font-bold text-red-800">Atenção</p>
                        <p className="text-sm text-red-700">Restaurar um backup substituirá TODOS os dados atuais do sistema pelos dados do arquivo. Esta ação não pode ser desfeita.</p>
                       </div>
                       <div className="flex items-center space-x-4">
                         <input type="file" ref={restoreInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                         <button onClick={handleRestoreClick} className="border border-gray-300 py-2 px-4 rounded-md text-gray-700">
                           🗂️ Escolher Arquivo de Backup
                         </button>
                       </div>
                    </div>
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
        </div>
    );
};

// ============================================================================
// Main App Component
// ============================================================================
const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [stockItems, setStockItems] = useState<StockItem[]>(mockStockItems);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [historyData, setHistoryData] = useState<Record<string, ItemHistory[]>>(mockHistoryData);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage('');
    }, 3000);
  }, []);

  const handleLogin = useCallback(() => setIsLoggedIn(true), []);
  const handleLogout = useCallback(() => setIsLoggedIn(false), []);

  const addAuditLog = (action: string) => {
    const newLog: AuditLog = {
      id: Date.now(),
      timestamp: new Date().toLocaleString('pt-BR'),
      user: 'Administrador', // Mocked user
      action,
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // User Handlers
  const handleAddUser = (user: Omit<User, 'id' | 'avatarUrl'>) => {
    if (users.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
        return false;
    }
    const newUser: User = {
        id: Date.now(),
        ...user,
        avatarUrl: `https://i.pravatar.cc/150?u=${user.email}`
    };
    setUsers(prev => [newUser, ...prev]);
    addAuditLog(`Criou o usuário ${user.name}.`);
    return true;
  };
  const handleUpdateUser = (updatedUser: User) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    addAuditLog(`Atualizou o usuário ${updatedUser.name}.`);
  };
  const handleDeleteUser = (userId: number) => {
    const user = users.find(u => u.id === userId);
    setUsers(users.filter(u => u.id !== userId));
    if(user) addAuditLog(`Excluiu o usuário ${user.name}.`);
  };
  
  // Supplier Handlers
  const handleAddSupplier = (supplier: Omit<Supplier, 'id'>) => {
    const newSupplier = { id: Date.now(), ...supplier };
    setSuppliers(prev => [newSupplier, ...prev]);
    addAuditLog(`Adicionou o fornecedor ${supplier.name}.`);
  };
  const handleUpdateSupplier = (updatedSupplier: Supplier) => {
    setSuppliers(suppliers.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
     addAuditLog(`Atualizou o fornecedor ${updatedSupplier.name}.`);
  };
  const handleDeleteSupplier = (supplierId: number) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    setSuppliers(suppliers.filter(s => s.id !== supplierId));
    if (supplier) addAuditLog(`Excluiu o fornecedor ${supplier.name}.`);
  };
  
  // Movement Handlers
  const handleRegisterEntry = (data: { itemId: string; quantity: number; supplier: string; nf: string; observations: string; }) => {
      const item = stockItems.find(i => i.id === data.itemId);
      if (item) {
        setStockItems(prev => prev.map(i => i.id === data.itemId ? {...i, systemStock: i.systemStock + data.quantity} : i));
        
        const newHistoryEntry: EntryItemHistory = {
            id: `h-${Date.now()}`,
            date: new Date().toLocaleDateString('pt-BR'),
            type: 'Entrada',
            quantity: data.quantity,
            user: 'Administrador', // Mocked user
            details: `Fornecedor: ${data.supplier || 'N/A'}. NF: ${data.nf || 'N/A'}. Obs: ${data.observations || 'N/A'}`
        };

        setHistoryData(prev => ({
            ...prev,
            [data.itemId]: [newHistoryEntry, ...(prev[data.itemId] || [])]
        }));
        
        addAuditLog(`Registrou entrada de ${data.quantity} unidade(s) do item ${item.code}. NF: ${data.nf}.`);
      }
  };
  const handleRegisterExit = (data: { itemId: string; quantity: number; requester: string; responsible: string; }) => {
      const item = stockItems.find(i => i.id === data.itemId);
      if (item) {
        const newStock = item.systemStock - data.quantity;
        if(newStock < 0) {
          alert('A quantidade de saída é maior que o estoque atual!');
          return;
        }
        setStockItems(prev => prev.map(i => i.id === data.itemId ? {...i, systemStock: newStock} : i));
        
        const newHistoryEntry: ExitItemHistory = {
            id: `h-${Date.now()}`,
            date: new Date().toLocaleDateString('pt-BR'),
            type: 'Saída',
            quantity: data.quantity,
            user: 'Administrador', // Mocked user
            requester: data.requester,
            responsible: data.responsible,
        };

        setHistoryData(prev => ({
            ...prev,
            [data.itemId]: [newHistoryEntry, ...(prev[data.itemId] || [])]
        }));

        addAuditLog(`Registrou saída de ${data.quantity} unidade(s) do item ${item.code} para ${data.requester}.`);
      }
  };
  
  // Backup Handler
  const handleRestoreBackup = (data: any) => {
      // Basic validation
      if (data.stockItems && data.users && data.suppliers && data.auditLogs && data.historyData) {
        setStockItems(data.stockItems);
        setUsers(data.users);
        setSuppliers(data.suppliers);
        setAuditLogs(data.auditLogs);
        setHistoryData(data.historyData);
        addAuditLog('Sistema restaurado a partir de um backup.');
      } else {
        alert('Arquivo de backup inválido ou corrompido.');
      }
  };


  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }
  
  const PageWrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
     <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
       {children}
     </div>
  );
  
  const allData = { stockItems, users, suppliers, auditLogs, historyData };
  
  const loggedInUser = users.find(u => u.profile === 'Administrador');

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={loggedInUser} stockItems={stockItems} searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
        <main className="flex-1 flex overflow-hidden">
          <Routes>
            <Route path="/" element={<Navigate to="/painel" replace />} />
            <Route path="/painel" element={<PageWrapper><Painel stockItems={stockItems}/></PageWrapper>} />
            <Route path="/estoque/atual" element={<PageWrapper><EstoquePage stockItems={stockItems} setStockItems={setStockItems} suppliers={suppliers} searchTerm={searchTerm} addAuditLog={addAuditLog} showToast={showToast} historyData={historyData} /></PageWrapper>} />
            <Route path="/estoque/inventario" element={<PageWrapper><InventoryPage stockItems={stockItems} setStockItems={setStockItems} addAuditLog={addAuditLog} showToast={showToast} /></PageWrapper>} />
            <Route path="/movimentacoes/:tab" element={<PageWrapper><MovimentacoesPage stockItems={stockItems} suppliers={suppliers} onRegisterEntry={handleRegisterEntry} onRegisterExit={handleRegisterExit} showToast={showToast} /></PageWrapper>} />
            <Route path="/controle/:tab" element={<PageWrapper><ControlePage 
                users={users} 
                suppliers={suppliers} 
                allData={allData}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                onAddSupplier={handleAddSupplier}
                onUpdateSupplier={handleUpdateSupplier}
                onDeleteSupplier={handleDeleteSupplier}
                onRestoreBackup={handleRestoreBackup}
                showToast={showToast}
            /></PageWrapper>} />
            <Route path="/auditoria/monitoramento" element={<PageWrapper><AuditPage auditLogs={auditLogs} /></PageWrapper>} />
            <Route path="/relatorios" element={<PageWrapper><RelatoriosPage title="Relatórios" stockItems={stockItems} historyData={historyData} /></PageWrapper>} />
            <Route path="*" element={<Navigate to="/painel" replace />} />
          </Routes>
        </main>
      </div>
      <div className={`toast success ${toastMessage ? 'show' : ''}`}>
        {toastMessage}
      </div>
    </div>
  );
};

export default App;