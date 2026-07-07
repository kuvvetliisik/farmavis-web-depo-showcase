import { create } from 'zustand';

const useAuthStore = create((set) => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    selectedWarehouse: localStorage.getItem('selectedWarehouse') || null,
    login: (userData, token) => {
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        set({ user: userData, token });
    },
    logout: () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('selectedWarehouse');
        set({ user: null, token: null, selectedWarehouse: null });
    },
    setSelectedWarehouse: (warehouseId) => {
        if (warehouseId) {
            localStorage.setItem('selectedWarehouse', warehouseId);
        } else {
            localStorage.removeItem('selectedWarehouse');
        }
        set({ selectedWarehouse: warehouseId });
    }
}));

export default useAuthStore;
