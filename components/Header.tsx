import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { StockItem, User } from '../types';

interface HeaderProps {
    user: User | null;
    stockItems: StockItem[];
    onUpdateAvatar: (file: File) => Promise<void>;
}

const Header: React.FC<HeaderProps> = ({ user, stockItems, onUpdateAvatar }) => {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const itemsAbaixoMinimoCount = stockItems.filter(i => i.system_stock <= i.min_stock).length;

    const handleAvatarClick = () => {
        if (!isUploading) {
            fileInputRef.current?.click();
        }
    };
    
    const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsUploading(true);
            await onUpdateAvatar(file);
            setIsUploading(false);
        }
        if (event.target) {
            event.target.value = '';
        }
    };
    
    return (
        <header className="flex items-center justify-between px-6 bg-white border-b h-16 shadow-sm flex-shrink-0">
            <div className="flex-grow">
                {/* This div pushes the content to the right */}
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
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelected}
                    />
                    <button 
                        onClick={handleAvatarClick} 
                        title="Alterar imagem do perfil"
                        className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        disabled={isUploading}
                    >
                        <img className="h-9 w-9 rounded-full object-cover" src={user?.avatar_url} alt="User avatar" />
                         {isUploading && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;