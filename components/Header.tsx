import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { StockItem, User } from '../types';

interface HeaderProps {
    user?: User;
    stockItems: StockItem[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}

const Header: React.FC<HeaderProps> = ({ user, stockItems, searchTerm, setSearchTerm }) => {
    const [avatarUrl, setAvatarUrl] = useState('https://i.pravatar.cc/150?u=admin@alumasa.com');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const location = useLocation();
    
    const itemsAbaixoMinimoCount = stockItems.filter(i => i.systemStock <= i.minStock).length;

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // In a real app, you'd upload this file to a server.
            // For this demo, we'll use a local object URL.
            setAvatarUrl(URL.createObjectURL(file));
        }
    };
    
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        if (location.pathname !== '/estoque/atual') {
            navigate('/estoque/atual');
        }
    };

    return (
        <header className="flex items-center justify-between px-6 bg-white border-b h-16 shadow-sm flex-shrink-0">
            <div className="flex items-center">
                {/* Hamburger for mobile can be added here */}
            </div>

            <div className="flex items-center w-full">
                 <div className="relative text-gray-500 w-full max-w-md">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 21L15.803 15.803M15.803 15.803A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                    </span>
                    <input 
                        className="block w-full bg-white border border-gray-200 rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        type="search" 
                        placeholder="Buscar item por código ou descrição..." 
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>
            </div>

            <div className="flex items-center space-x-5 ml-4 flex-shrink-0">
                <Link
                  to="/estoque/atual?filtro=abaixo-minimo"
                  className="relative p-2 text-gray-500 hover:text-gray-700"
                  title={`${itemsAbaixoMinimoCount} item(s) abaixo do estoque mínimo`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                    {itemsAbaixoMinimoCount > 0 && (
                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                           {itemsAbaixoMinimoCount}
                        </span>
                    )}
                </Link>
                
                <div className="flex items-center space-x-4">
                    <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">Bem vindo, {user?.name || 'Usuário'}</p>
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                    />
                    <button 
                        onClick={handleAvatarClick} 
                        title="Alterar imagem do perfil"
                        className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <img className="h-9 w-9 rounded-full object-cover" src={avatarUrl} alt="Admin" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;