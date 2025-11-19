
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ICONS, AlumasaLogo } from '../constants';

interface NavItem {
    path?: string;
    label: string;
    icon: React.ReactNode;
    subItems?: { path: string; label: string; }[];
}

interface SidebarProps {
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const navItems: NavItem[] = [
    { path: '/painel', icon: ICONS.panel, label: 'Painel' },
    { 
        label: 'Cadastros', 
        icon: ICONS.cadastros, 
        subItems: [
            { path: '/controle/fornecedores', label: 'Fornecedores' },
            { path: '/controle/usuarios', label: 'Usuários' },
        ]
    },
    { 
        label: 'Estoque', 
        icon: ICONS.stock, 
        subItems: [
            { path: '/estoque/atual', label: 'Estoque Atual' },
            { path: '/estoque/inventario', label: 'Inventário' },
        ]
    },
    { 
        label: 'Movimentações', 
        icon: ICONS.movements,
        subItems: [
            { path: '/movimentacoes/nova-entrada', label: 'Nova Entrada' },
            { path: '/movimentacoes/nova-saida', label: 'Nova Saída' },
        ]
    },
    { 
        label: 'Auditoria', 
        icon: ICONS.audit,
        subItems: [
            { path: '/auditoria/monitoramento', label: 'Monitoramento' },
        ]
    },
    { path: '/relatorios', icon: ICONS.reports, label: 'Relatórios' },
];

const Sidebar: React.FC<SidebarProps> = ({ onLogout, isOpen, setIsOpen }) => {
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const activeMenu = navItems.find(item => 
            item.subItems?.some(sub => location.pathname.startsWith(sub.path))
        );
        if (activeMenu) {
            setOpenMenus(prev => ({ ...prev, [activeMenu.label]: true }));
        }
    }, [location.pathname]);

    const toggleMenu = (label: string) => {
        setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
    };

    const isSubItemActive = (subItems: {path: string}[]) => {
        return subItems.some(sub => location.pathname.startsWith(sub.path));
    };

    const handleLinkClick = () => {
        if (window.innerWidth < 768) { // Corresponds to md breakpoint
            setIsOpen(false);
        }
    };

    return (
        <aside className={`bg-[#002B4E] text-blue-100 flex-shrink-0 w-60 flex flex-col fixed md:static inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out z-30`}>
            <div className="flex items-center justify-between h-16 px-4 border-b border-blue-900/50">
                <AlumasaLogo />
                <button onClick={() => setIsOpen(false)} className="md:hidden p-1 text-blue-300 rounded-md hover:bg-blue-800 hover:text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <nav className="flex-1 mt-4 px-2">
                <ul>
                    {navItems.map(item => (
                        <li key={item.label} className="mb-1">
                            {item.subItems ? (
                                <>
                                    <button 
                                        onClick={() => toggleMenu(item.label)}
                                        className={`w-full flex items-center justify-between py-2.5 px-3 rounded-md transition-colors duration-200 hover:bg-blue-800 text-left text-sm ${isSubItemActive(item.subItems) ? 'text-white' : 'text-blue-300'}`}
                                    >
                                        <div className="flex items-center">
                                            {item.icon}
                                            <span className="ml-3 font-medium">{item.label}</span>
                                        </div>
                                        {openMenus[item.label] ? ICONS.chevronUp : ICONS.chevronDown}
                                    </button>
                                    {openMenus[item.label] && (
                                        <ul className="pl-6 mt-1 border-l border-blue-800 ml-4">
                                            {item.subItems.map(subItem => (
                                                <li key={subItem.path}>
                                                    <NavLink 
                                                        to={subItem.path} 
                                                        onClick={handleLinkClick}
                                                        className={({ isActive }) => `block w-full py-2 px-4 my-0.5 rounded-md text-sm transition-colors duration-200 hover:bg-blue-800 ${isActive ? 'bg-blue-600 text-white' : 'text-blue-300'}`
                                                    }>
                                                        {subItem.label}
                                                    </NavLink>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </>
                            ) : (
                                <NavLink 
                                    to={item.path!} 
                                    onClick={handleLinkClick}
                                    className={({ isActive }) => `flex items-center py-2.5 px-3 rounded-md transition-colors duration-200 hover:bg-blue-800 text-sm ${isActive ? 'bg-blue-600 text-white' : 'text-blue-300'}`
                                }>
                                    {item.icon}
                                    <span className="ml-3 font-medium">{item.label}</span>
                                </NavLink>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="px-2 py-4">
               <div className="border-t border-blue-900/50 mb-4"></div>
                <button 
                    onClick={onLogout}
                    className="w-full flex items-center py-2.5 px-3 rounded-md transition-colors duration-200 hover:bg-blue-800 text-sm text-blue-300"
                >
                   {ICONS.logout}
                   <span className="ml-3 font-medium">Sair</span>
                </button>
           </div>
        </aside>
    );
};

export default Sidebar;
