import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store';
import api from '../api';
import { Package, Store, ShoppingCart, PlusCircle, TrendingUp, Award, DollarSign, Eye, X } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
    const user = useAuthStore((state) => state.user);
    const navigate = useNavigate();
    const [stats, setStats] = useState({ orders: 0, pharmacies: 0, products: 0 });
    const [advancedStats, setAdvancedStats] = useState({ totalAmount: 0, topPlasiyer: null, topProduct: null });
    const [recentOrders, setRecentOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        // Fetch initial data
        const fetchData = async () => {
            try {
                const [ordersRes, pharmaciesRes, statsRes] = await Promise.all([
                    api.get('/orders'),
                    api.get('/pharmacies'),
                    api.get('/stats')
                ]);

                let productsCount = 0;
                if (user.role === 'Admin') {
                    const productsRes = await api.get('/products');
                    productsCount = productsRes.data.length;
                }

                setStats({
                    orders: ordersRes.data.length,
                    pharmacies: pharmaciesRes.data.length,
                    products: productsCount
                });

                setAdvancedStats(statsRes.data);
                setRecentOrders(ordersRes.data.slice(0, 5));
            } catch (error) {
                console.error("Failed to fetch initial data", error);
            }
        };

        fetchData();
    }, [user.role]);

    const handleViewOrder = async (orderId) => {
        setLoadingDetails(true);
        setShowModal(true);
        try {
            const res = await api.get(`/orders/${orderId}`);
            setSelectedOrder(res.data);
        } catch (error) {
            console.error("Order details fetch error", error);
            alert("Sipariş detayı alınamadı!");
        } finally {
            setLoadingDetails(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedOrder(null);
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            const res = await api.put(`/orders/${orderId}/status`, { status: newStatus });
            // Update local state without refetching all orders
            setRecentOrders(recentOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }
            alert('Sipariş durumu güncellendi.');
        } catch (error) {
            console.error("Status update error", error);
            alert(error.response?.data?.error || "Durum güncellenirken hata oluştu!");
        }
    };

    const getStatusText = (status) => {
        if (status === 'Pending' || status === 'Bekliyor') return 'Bekliyor';
        if (status === 'Completed' || status === 'Tamamlandı') return 'Tamamlandı';
        if (status === 'Cancelled' || status === 'İptal') return 'İptal';
        return status;
    };

    const getStatusStyle = (status) => {
        if (status === 'Pending' || status === 'Bekliyor') return 'bg-yellow-100 text-yellow-800';
        if (status === 'Completed' || status === 'Tamamlandı') return 'bg-green-100 text-green-800';
        if (status === 'Cancelled' || status === 'İptal') return 'bg-red-100 text-red-800';
        return 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">
                    Hoşgeldiniz, {user.username}
                </h1>
                <div className="mt-4 md:mt-0">
                    <button
                        onClick={() => navigate('/orders/new')}
                        className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg shadow transition-colors"
                    >
                        <PlusCircle size={20} />
                        <span>Yeni Sipariş Oluştur</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Toplam Ciro"
                    value={`${Number(advancedStats.totalAmount).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺`}
                    icon={<DollarSign size={24} />}
                    color="text-emerald-600" bgColor="bg-emerald-100"
                />

                <StatCard
                    title="Toplam Siparişler"
                    value={stats.orders}
                    icon={<ShoppingCart size={24} />}
                    color="text-blue-600" bgColor="bg-blue-100"
                />

                {user.role === 'Admin' && advancedStats.topPlasiyer && (
                    <StatCard
                        title="En İyi Plasiyer"
                        value={advancedStats.topPlasiyer.username.toLocaleUpperCase('tr-TR')}
                        subValue={`Ciro: ${Number(advancedStats.topPlasiyer.total_sales).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺`}
                        icon={<Award size={24} />}
                        color="text-amber-600" bgColor="bg-amber-100"
                    />
                )}

                {advancedStats.topProduct && (
                    <StatCard
                        title="En Çok Satan Ürün"
                        value={advancedStats.topProduct.name}
                        subValue={`${advancedStats.topProduct.total_quantity} Adet`}
                        icon={<TrendingUp size={24} />}
                        color="text-purple-600" bgColor="bg-purple-100"
                    />
                )}
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Son Siparişler</h3>
                    <button onClick={() => navigate('/reports')} className="text-sm text-primary-600 hover:text-primary-800 font-medium">Tümünü Gör</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sipariş ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutar</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recentOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500">Henüz sipariş bulunmuyor.</td>
                                </tr>
                            ) : (
                                recentOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id.split('-')[0]}...</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Number(order.total_amount).toLocaleString('tr-TR')} ₺</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(order.status)}`}>
                                                {getStatusText(order.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => handleViewOrder(order.id)}
                                                className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                                            >
                                                <Eye size={16} />
                                                İncele
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Details Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">Sipariş Detayı</h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-red-500 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 flex-1 overflow-y-auto">
                            {loadingDetails ? (
                                <div className="flex justify-center items-center h-40">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                </div>
                            ) : selectedOrder ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                        <div>
                                            <p className="text-xs text-gray-500 font-semibold uppercase">Eczane</p>
                                            <p className="font-bold text-gray-900">{selectedOrder.pharmacy_name}</p>
                                            <p className="text-sm text-gray-600">{selectedOrder.pharmacy_city}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-semibold uppercase">Sipariş Bilgileri</p>
                                            <p className="font-bold text-gray-900">ID: {selectedOrder.id.split('-')[0]}</p>
                                            <p className="text-sm text-gray-600">{format(new Date(selectedOrder.created_at), 'dd.MM.yyyy HH:mm')}</p>
                                            <p className="text-sm text-gray-600">Depo: {selectedOrder.warehouse_name}</p>
                                            <div className="mt-2 flex items-center space-x-2">
                                                <span className="text-xs text-gray-500 font-semibold uppercase">Durum:</span>
                                                {user.role === 'Admin' ? (
                                                    <select
                                                        value={getStatusText(selectedOrder.status)}
                                                        onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                                                        className="border-gray-300 rounded text-sm p-1"
                                                    >
                                                        <option value="Bekliyor">Bekliyor</option>
                                                        <option value="Tamamlandı">Tamamlandı</option>
                                                        <option value="İptal">İptal</option>
                                                    </select>
                                                ) : (
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(selectedOrder.status)}`}>
                                                        {getStatusText(selectedOrder.status)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ürün Adı</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Adet</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">MF</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Ek MF</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Toplam Adet</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">İsk %</th>
                                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Net Fiyat</th>
                                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">B. Fiyat</th>
                                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Toplam</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 truncate max-w-[200px]" title={item.product_name}>{item.product_name}</td>
                                                        <td className="px-4 py-3 text-sm font-bold text-gray-700 text-center">{item.quantity}</td>
                                                        <td className="px-4 py-3 text-sm font-bold text-green-600 text-center">+{item.mf_free || 0}</td>
                                                        <td className="px-4 py-3 text-sm font-bold text-blue-600 text-center">+{item.ek_mf || 0}</td>
                                                        <td className="px-4 py-3 text-sm font-black text-gray-800 text-center">{Number(item.quantity) + Number(item.mf_free || 0) + Number(item.ek_mf || 0)}</td>
                                                        <td className="px-4 py-3 text-sm font-bold text-red-500 text-center">{item.iskonto || 0}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-800 text-right font-medium">{Number(item.net_price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                                        <td className="px-4 py-3 text-sm text-gray-500 text-right line-through">{Number(item.unit_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">{Number(item.total_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex justify-end p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500 font-semibold">GENEL TOPLAM</p>
                                            <p className="text-2xl font-black text-orange-600">{Number(selectedOrder.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-center text-gray-500">Detay bulunamadı.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ title, value, subValue, icon, color, bgColor }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${bgColor} ${color}`}>
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <p className="text-2xl font-bold text-gray-900 truncate" title={value}>{value}</p>
                {subValue && <p className="text-xs text-gray-400 mt-1 font-medium">{subValue}</p>}
            </div>
        </div>
    );
}
