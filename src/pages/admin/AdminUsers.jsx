import { useState, useEffect } from 'react';
import api from '../../api';
import { UserPlus, Edit, Trash2 } from 'lucide-react';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({ username: '', password: '', role: 'Plasiyer' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            // We need a backend route to get users. Let's create one or just use a placeholder if it doesn't exist yet.
            // For now, assuming GET /auth/users exists or will be added.
            const res = await api.get('/auth/users');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
            // setError('Kullanıcılar yüklenemedi.');
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await api.post('/auth/register', formData);
            setFormData({ username: '', password: '', role: 'Plasiyer' });
            await fetchUsers();
            alert('Kullanıcı başarıyla eklendi!');
        } catch (err) {
            setError(err.response?.data?.error || 'Kullanıcı oluşturulamadı.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Kullanıcı (Plasiyer) Yönetimi</h1>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <UserPlus size={20} /> Yeni Kullanıcı Ekle
                </h2>

                {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Adı</label>
                        <input
                            type="text" name="username" required
                            value={formData.username} onChange={handleInputChange}
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
                        <input
                            type="password" name="password" required
                            value={formData.password} onChange={handleInputChange}
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                        <select
                            name="role" value={formData.role} onChange={handleInputChange}
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="Plasiyer">Plasiyer</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>
                    <div>
                        <button
                            type="submit" disabled={loading}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg shadow transition-colors disabled:opacity-50 h-[42px]"
                        >
                            {loading ? 'Ekleniyor...' : 'Kullanıcı Ekle'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="text-md font-medium text-gray-700">Mevcut Kullanıcılar</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kullanıcı Adı</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rol</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-gray-400 hover:text-red-600 transition-colors ml-3" title="Sil (Demo)">
                                            <Trash2 size={18} />
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
