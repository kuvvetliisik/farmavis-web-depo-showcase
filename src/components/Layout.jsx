import { useState } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import useAuthStore from '../store';
import { LogOut, User, Menu, X } from 'lucide-react';

export default function Layout() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItemProps = (path) => ({
        onClick: () => {
            navigate(path);
            setIsMobileMenuOpen(false);
        },
        className: "text-white hover:bg-primary-500 px-3 py-2 rounded-md font-medium text-sm transition-colors block text-left w-full"
    });

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-primary-600 text-white shadow-md relative z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center space-x-4">
                            {/* Mobile menu button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden text-white hover:bg-primary-500 p-2 rounded-md transition-colors"
                            >
                                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>

                            <div className="flex-shrink-0 font-bold text-xl cursor-pointer flex items-center gap-2" onClick={() => navigate('/')}>
                                Farmavis Web Depo <span className="text-xl">💊</span>
                            </div>

                            {/* Desktop Menu */}
                            <div className="hidden md:flex space-x-1 items-center ml-8">
                                <button {...navItemProps('/')} className="text-white hover:bg-primary-500 px-3 py-2 rounded-md font-medium text-sm transition-colors">Ana Sayfa</button>

                                {user.role === 'Plasiyer' && (
                                    <button {...navItemProps('/orders/new')} className="text-white hover:bg-primary-500 px-3 py-2 rounded-md font-medium text-sm transition-colors">Yeni Sipariş</button>
                                )}

                                <button {...navItemProps('/reports')} className="text-white hover:bg-primary-500 px-3 py-2 rounded-md font-medium text-sm transition-colors">Raporlar</button>

                                {user.role === 'Admin' && (
                                    <>
                                        <div className="h-6 w-px bg-primary-400 mx-2"></div>
                                        <button {...navItemProps('/admin/users')} className="text-white hover:bg-primary-500 px-3 py-2 rounded-md font-medium text-sm transition-colors">Kullanıcılar</button>
                                        <button {...navItemProps('/admin/products')} className="text-white hover:bg-primary-500 px-3 py-2 rounded-md font-medium text-sm transition-colors">Ürünler</button>
                                        <button {...navItemProps('/admin/pharmacies')} className="text-white hover:bg-primary-500 px-3 py-2 rounded-md font-medium text-sm transition-colors">Eczaneler</button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right side Profile & Logout */}
                        <div className="flex items-center space-x-4">
                            <div className="hidden sm:flex items-center space-x-2 bg-primary-500 px-3 py-1 rounded-full">
                                <User size={18} />
                                <span className="text-sm font-medium">{user.username} ({user.role})</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-1 hover:bg-primary-500 px-3 py-2 rounded-md transition-colors"
                                title="Çıkış Yap"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-16 left-0 right-0 bg-primary-600 border-t border-primary-500 shadow-xl">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex flex-col">
                            <div className="sm:hidden px-3 py-2 text-sm text-primary-200 border-b border-primary-500 mb-2 flex items-center gap-2">
                                <User size={16} /> Giriş yapan: {user.username} ({user.role})
                            </div>
                            <button {...navItemProps('/')}>Ana Sayfa</button>

                            {user.role === 'Plasiyer' && (
                                <button {...navItemProps('/orders/new')}>Yeni Sipariş</button>
                            )}

                            <button {...navItemProps('/reports')}>Raporlar</button>

                            {user.role === 'Admin' && (
                                <>
                                    <div className="h-px w-full bg-primary-500 my-2"></div>
                                    <button {...navItemProps('/admin/users')}>Kullanıcılar</button>
                                    <button {...navItemProps('/admin/products')}>Ürünler</button>
                                    <button {...navItemProps('/admin/pharmacies')}>Eczaneler</button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <Outlet />
            </main>
        </div>
    );
}
