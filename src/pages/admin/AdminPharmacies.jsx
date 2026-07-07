import { useState, useEffect, useRef } from 'react';
import api from '../../api';
import { Store, UserPlus, FileEdit, Upload, X } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function AdminPharmacies() {
    const [pharmacies, setPharmacies] = useState([]);
    const [users, setUsers] = useState([]); // To list plasiyers
    const [formData, setFormData] = useState({
        name: '', city: '', district: '', address: '', tax_number: ''
    });
    const [loading, setLoading] = useState(false);

    // Bulk Import States
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importData, setImportData] = useState([]);
    const [importPlasiyerId, setImportPlasiyerId] = useState('');
    const [importLoading, setImportLoading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [pharmaciesRes, usersRes] = await Promise.all([
                api.get('/pharmacies'),
                api.get('/auth/users')
            ]);
            setPharmacies(pharmaciesRes.data);
            setUsers(usersRes.data.filter(u => u.role === 'Plasiyer'));
        } catch (err) {
            console.error(err);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/pharmacies', formData);
            setFormData({ name: '', city: '', district: '', address: '', tax_number: '' });
            fetchData();
        } catch (err) {
            alert('Eczane eklenirken hata: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleAssignPlasiyer = async (pharmacyId, plasiyerId) => {
        try {
            await api.put(`/pharmacies/${pharmacyId}/assign`, { plasiyer_id: plasiyerId });
            alert('Plasiyer ataması başarıyla güncellendi.');
            fetchData(); // Refresh the list
        } catch (err) {
            alert('Atama yapılırken hata: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            // Expecting columns: name, tax_no, city, district, address
            const data = XLSX.utils.sheet_to_json(ws);
            setImportData(data);
        };
        reader.readAsBinaryString(file);
    };

    const handleBulkImportSubmit = async () => {
        if (importData.length === 0) {
            alert('Lütfen geçerli bir Excel dosyası yükleyin.');
            return;
        }
        setImportLoading(true);
        try {
            const payload = {
                pharmacies: importData.map(r => ({
                    name: r['Eczane Adı'] || r.name,
                    address: r['Adres'] || r.address,
                    location: r['Lokasyon'] || r.location,
                    district: r['İlçe'] || r.district,
                    neighborhood: r['Semt'] || r.neighborhood,
                    city: r['İl'] || r.city,
                    phone: r['Telefon'] || r.phone,
                    tax_no: r['Vergi No'] || '' // Optional fallback
                })),
                assigned_plasiyer_id: importPlasiyerId || null
            };
            const res = await api.post('/pharmacies/bulk', payload);
            alert(res.data.message);
            setIsImportModalOpen(false);
            setImportData([]);
            setImportPlasiyerId('');
            if (fileInputRef.current) fileInputRef.current.value = '';
            fetchData();
        } catch (err) {
            alert('Toplu yükleme hatası: ' + (err.response?.data?.error || err.message));
        } finally {
            setImportLoading(false);
        }
    };

    const downloadTemplate = () => {
        const ws = XLSX.utils.json_to_sheet([{
            'Eczane Adı': 'Aktaş Eczanesi',
            'Adres': 'yeni mahalle, cengiz topel caddesi no:33/f',
            'Lokasyon': 'Hastane Kavşağı A101 Market sırası',
            'İlçe': 'Aliağa',
            'Semt': '',
            'İl': 'İzmir',
            'Telefon': '0 (542) 319-18-78'
        }]);
        ws['!cols'] = [
            { wch: 25 }, // Eczane Adı
            { wch: 45 }, // Adres
            { wch: 35 }, // Lokasyon
            { wch: 15 }, // İlçe
            { wch: 15 }, // Semt
            { wch: 15 }, // İl
            { wch: 20 }  // Telefon
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sablon");
        XLSX.writeFile(wb, "eczane_yukleme_sablonu.xlsx");
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Eczane ve Atama Yönetimi</h1>
                <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow"
                >
                    <Upload size={18} /> Excel'den Toplu Yükle
                </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Store size={20} /> Yeni Eczane Ekle
                </h2>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Eczane Adı</label>
                        <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vergi No</label>
                        <input type="text" name="tax_number" value={formData.tax_number} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
                        <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">İlçe</label>
                        <input type="text" name="district" value={formData.district} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                    </div>
                    <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Açık Adres</label>
                        <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                    </div>

                    <div className="md:col-span-4 mt-2">
                        <button type="submit" disabled={loading} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg shadow transition-colors disabled:opacity-50">
                            {loading ? 'Ekleniyor...' : 'Eczane Ekle'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-md font-medium text-gray-700">Tüm Eczaneler ve Plasiyer Atamaları ({pharmacies.length})</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Eczane Adı</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lokasyon</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vergi No</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Atalı Plasiyer</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {pharmacies.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.city} / {p.district}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.tax_number || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <select
                                            className="border-gray-300 rounded text-sm shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                            onChange={(e) => handleAssignPlasiyer(p.id, e.target.value)}
                                            defaultValue={p.assigned_plasiyer_id || ""}
                                        >
                                            <option value="" disabled>Plasiyer Seç</option>
                                            <option value={null}>Boşa Çıkar (Atamasız)</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>{u.username}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-gray-400 hover:text-blue-600 transition-colors" title="Düzenle">
                                            <FileEdit size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Import Wizard Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Upload size={20} className="text-green-600" /> Toplu Eczane Yükleme Sihirbazı
                            </h3>
                            <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-red-500">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">

                            <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <div>
                                    <h4 className="font-medium text-blue-800 text-sm">Adım 1: Şablonu İndirin veya Hazırlayın</h4>
                                    <p className="text-xs text-blue-600 mt-1">Excel dosyanızda şu başlıklar olmalıdır: Eczane Adı, Adres, Lokasyon, İlçe, Semt, İl, Telefon</p>
                                </div>
                                <button onClick={downloadTemplate} className="text-sm bg-white border border-blue-200 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors">Şablon İndir</button>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-800 text-sm mb-2">Adım 2: Excel Dosyasını Seçin</h4>
                                <input
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={handleFileUpload}
                                    ref={fileInputRef}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                />
                                {importData.length > 0 && (
                                    <p className="text-sm text-green-600 mt-2 font-medium">✅ {importData.length} kayıt okundu.</p>
                                )}
                            </div>

                            {importData.length > 0 && (
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h4 className="font-medium text-gray-800 text-sm mb-2">Adım 3: Atama (Opsiyonel)</h4>
                                    <label className="block text-xs text-gray-600 mb-1">Bu dosyadan yüklenecek olan {importData.length} eczane aşağıdaki plasiyere atansın mı?</label>
                                    <select
                                        value={importPlasiyerId}
                                        onChange={(e) => setImportPlasiyerId(e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
                                    >
                                        <option value="">-- Atama Yapma (Boş Bırak) --</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.username}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => setIsImportModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleBulkImportSubmit}
                                    disabled={importData.length === 0 || importLoading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {importLoading ? 'Yükleniyor...' : 'Kayıtları İçe Aktar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
