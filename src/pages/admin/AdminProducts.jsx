import { useState, useEffect } from 'react';
import api from '../../api';
import { PackageX, PackagePlus, Edit } from 'lucide-react';

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [formData, setFormData] = useState({
        name: '', description: '', category: '',
        price: '', unit_price: '', vat_rate: 0, mf_base: 0, mf_free: 0
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            setProducts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/products', formData);
            setFormData({
                name: '', description: '', category: '',
                price: '', unit_price: '', vat_rate: 0, mf_base: 0, mf_free: 0
            });
            fetchProducts();
        } catch (err) {
            alert('Ürün eklenirken hata: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Ürün Yönetimi</h1>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <PackagePlus size={20} /> Yeni Ürün Ekle
                    </h2>
                    <button
                        onClick={() => alert('Toplu ürün yükleme ekranı (Şablon vs.) yapım aşamasındadır. Daha sonra detayları belirleyeceğiz.')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow font-medium text-sm transition-colors flex items-center justify-center gap-2">
                        Toplu Ürün Ekle (Excel)
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Adı</label>
                        <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                        <input type="text" name="category" value={formData.category} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PSF (Liste Fiyatı)</label>
                        <input type="number" step="0.01" name="price" required value={formData.price} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Birim Fiyat (Maliyet)</label>
                        <input type="number" step="0.01" name="unit_price" value={formData.unit_price} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">KDV Oranı (%)</label>
                        <input type="number" name="vat_rate" required value={formData.vat_rate} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                    </div>
                    <div className="flex gap-2">
                        <div className="w-1/2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">MF Alım</label>
                            <input type="number" name="mf_base" required value={formData.mf_base} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                        </div>
                        <div className="w-1/2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">MF Bedelsiz</label>
                            <input type="number" name="mf_free" required value={formData.mf_free} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                        </div>
                    </div>

                    <div className="md:col-span-4 mt-2">
                        <button type="submit" disabled={loading} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg shadow transition-colors disabled:opacity-50">
                            {loading ? 'Ekleniyor...' : 'Ürün Ekle'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-md font-medium text-gray-700">Mevcut Ürünler ({products.length})</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ürün Adı</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kategori</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">PSF</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Birim F.</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">KDV</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">MF Kuralı</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {products.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.category || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-700">{Number(p.price).toFixed(2)} ₺</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-500">{Number(p.unit_price || 0).toFixed(2)} ₺</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">% {p.vat_rate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                        {p.mf_base > 0 ? `${p.mf_base} + ${p.mf_free}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-gray-400 hover:text-blue-600 transition-colors" title="Düzenle">
                                            <Edit size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
