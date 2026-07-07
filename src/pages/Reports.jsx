import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../store';
import api from '../api';
import { Download, Search, Filter, FileSpreadsheet, FileText, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

export default function Reports() {
    const user = useAuthStore((state) => state.user);
    const [orders, setOrders] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [plasiyers, setPlasiyers] = useState([]);

    // Filters
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        warehouseId: '',
        plasiyerId: ''
    });

    // Custom Date Picker States
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [rangeStart, setRangeStart] = useState(null);
    const [rangeEnd, setRangeEnd] = useState(null);
    const [currentMonthLeft, setCurrentMonthLeft] = useState(new Date());
    const datePickerRef = useRef(null);

    useEffect(() => {
        fetchFilterOptions();
        fetchOrders();

        const handleClickOutside = (event) => {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
                setShowDatePicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Sync state range view with filters when filters update
    useEffect(() => {
        if (filters.startDate) {
            setRangeStart(parseLocalDate(filters.startDate));
        } else {
            setRangeStart(null);
        }
        if (filters.endDate) {
            setRangeEnd(parseLocalDate(filters.endDate));
        } else {
            setRangeEnd(null);
        }
    }, [filters.startDate, filters.endDate]);

    const parseLocalDate = (dateStr) => {
        if (!dateStr) return null;
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const fetchFilterOptions = async () => {
        try {
            const warehousesRes = await api.get('/warehouses');
            setWarehouses(warehousesRes.data);

            const ordersRes = await api.get('/orders');
            const allOrders = ordersRes.data;

            const uniquePlasiyers = [];
            const plasiyerMap = new Map();

            allOrders.forEach(o => {
                if (o.plasiyer_name && !plasiyerMap.has(o.plasiyer_id)) {
                    plasiyerMap.set(o.plasiyer_id, true);
                    uniquePlasiyers.push({ id: o.plasiyer_id, name: o.plasiyer_name });
                }
            });

            setPlasiyers(uniquePlasiyers);
        } catch (error) {
            console.error("Filter options fetch error", error);
        }
    };

    const fetchOrders = async (currentFilters = filters) => {
        try {
            const params = new URLSearchParams();
            if (currentFilters.startDate) params.append('start_date', currentFilters.startDate);
            if (currentFilters.endDate) params.append('end_date', currentFilters.endDate);
            if (currentFilters.warehouseId) params.append('warehouse_id', currentFilters.warehouseId);
            if (currentFilters.plasiyerId) params.append('plasiyer_id', currentFilters.plasiyerId);

            const res = await api.get(`/orders/reports/items?${params.toString()}`);
            setOrders(res.data);
        } catch (error) {
            console.error("Orders fetch error", error);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        fetchOrders();
    };

    // Custom Date Range Helpers
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0, Sun=6
        const totalDays = new Date(year, month + 1, 0).getDate();
        
        const days = [];
        for (let i = 0; i < firstDayIndex; i++) {
            days.push(null);
        }
        for (let d = 1; d <= totalDays; d++) {
            days.push(new Date(year, month, d));
        }
        return days;
    };

    const isSameDay = (d1, d2) => {
        if (!d1 || !d2) return false;
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    };

    const isBetweenDays = (day, start, end) => {
        if (!day || !start || !end) return false;
        const t = day.getTime();
        const s = new Date(start).setHours(0,0,0,0);
        const e = new Date(end).setHours(0,0,0,0);
        return t > s && t < e;
    };

    const prevMonth = () => {
        setCurrentMonthLeft(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonthLeft(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const handleDayClick = (day) => {
        if (!day) return;
        if (!rangeStart || (rangeStart && rangeEnd)) {
            setRangeStart(day);
            setRangeEnd(null);
        } else if (rangeStart && !rangeEnd) {
            if (day < rangeStart) {
                setRangeStart(day);
                setRangeEnd(null);
            } else {
                setRangeEnd(day);
            }
        }
    };

    const getRangeDisplayText = () => {
        if (filters.startDate && filters.endDate) {
            const startFmt = format(parseLocalDate(filters.startDate), 'dd/MM/yyyy');
            const endFmt = format(parseLocalDate(filters.endDate), 'dd/MM/yyyy');
            return `${startFmt} - ${endFmt}`;
        }
        return 'Tarih Aralığı Seçin';
    };

    const selectQuickRange = (type) => {
        const today = new Date();
        today.setHours(0,0,0,0);
        let start = new Date();
        let end = new Date();
        
        if (type === 'bugun') {
            start = today;
            end = today;
        } else if (type === 'dun') {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            start = yesterday;
            end = yesterday;
        } else if (type === 'son7') {
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
            start = sevenDaysAgo;
            end = today;
        } else if (type === 'buay') {
            start = new Date(today.getFullYear(), today.getMonth(), 1);
            end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        } else if (type === 'gecenay') {
            start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            end = new Date(today.getFullYear(), today.getMonth(), 0);
        }
        
        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');
        
        const newFilters = {
            ...filters,
            startDate: startStr,
            endDate: endStr
        };
        
        setFilters(newFilters);
        setShowDatePicker(false);
        fetchOrders(newFilters);
    };

    const handleClearRange = () => {
        setRangeStart(null);
        setRangeEnd(null);
        const newFilters = {
            ...filters,
            startDate: '',
            endDate: ''
        };
        setFilters(newFilters);
        setShowDatePicker(false);
        fetchOrders(newFilters);
    };

    const handleApplyRange = () => {
        if (!rangeStart) return;
        const end = rangeEnd || rangeStart;
        const startStr = format(rangeStart, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');
        const newFilters = {
            ...filters,
            startDate: startStr,
            endDate: endStr
        };
        setFilters(newFilters);
        setShowDatePicker(false);
        fetchOrders(newFilters);
    };

    const exportToExcel = () => {
        const exportData = orders.map(o => ({
            'Sipariş Tarihi': format(new Date(o.created_at), 'dd/MM/yyyy'),
            'Sipariş Saati': format(new Date(o.created_at), 'HH:mm:ss'),
            'Plasiyer': o.plasiyer_name || '',
            'Eczane Adı': o.pharmacy_name || '',
            'İlçe': o.pharmacy_district || '',
            'İl': o.pharmacy_city || '',
            'Ürün Tanımı': o.product_name || '',
            'Adet': Number(o.adet) || 0,
            'MF Adeti': Number(o.mf_adeti) || 0,
            'Ek MF Adeti': Number(o.ek_mf_adeti) || 0,
            'Toplam Adet': Number(o.toplam_adet) || 0,
            "Fatura Altı (KDV'li)": Number(o.fatura_alti_kdvli) || 0,
            "Fatura Altı (KDV'siz)": Number(o.fatura_alti_kdvsiz) || 0,
            'Ek İsk.': Number(o.ek_iskonto) || 0,
            'Klasman Adı': o.klasman_adi || '',
            'Not': o.not_field || ''
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        ws['!cols'] = [
            { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 },
            { wch: 35 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
            { wch: 18 }, { wch: 18 }, { wch: 10 }, { wch: 12 }, { wch: 15 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Rapor");
        XLSX.writeFile(wb, `B2B_Rapor_${format(new Date(), 'ddMMyyyy')}.xlsx`);
    };

    const exportToPDF = () => {
        const doc = new jsPDF('landscape');
        doc.text("B2B Satis Raporu", 14, 15);

        const tableColumn = [
            "Tarih", "Saat", "Plasiyer", "Eczane", "Urun", "Top.Adet", "Fatura Alti (KDV'li)"
        ];
        const tableRows = [];

        orders.forEach(o => {
            const orderData = [
                format(new Date(o.created_at), 'dd/MM/yyyy'),
                format(new Date(o.created_at), 'HH:mm:ss'),
                o.plasiyer_name || '',
                (o.pharmacy_name || '-').substring(0, 20),
                (o.product_name || '-').substring(0, 25),
                o.toplam_adet,
                Number(o.fatura_alti_kdvli || 0).toLocaleString('tr-TR') + ' TL'
            ];
            tableRows.push(orderData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 20,
            styles: { fontSize: 8 },
            theme: 'striped'
        });

        doc.save(`B2B_Rapor_${format(new Date(), 'ddMMyyyy')}.pdf`);
    };

    const renderCalendarMonthBlock = (monthDate, isLeft) => {
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();
        const monthName = new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(monthDate);
        const days = getDaysInMonth(monthDate);

        return (
            <div className="w-56 flex flex-col select-none">
                <div className="flex items-center justify-between font-semibold text-xs text-slate-800 mb-2 px-1">
                    {isLeft ? (
                        <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded transition-colors cursor-pointer"><ChevronLeft size={14} /></button>
                    ) : <span className="w-6"></span>}
                    <span className="capitalize">{monthName}</span>
                    {!isLeft ? (
                        <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded transition-colors cursor-pointer"><ChevronRight size={14} /></button>
                    ) : <span className="w-6"></span>}
                </div>
                
                <div className="grid grid-cols-7 gap-y-0.5 text-[10px] text-center font-medium text-slate-400 mb-1">
                    <span>Pt</span><span>Sa</span><span>Ça</span><span>Pe</span><span>Cu</span><span>Ct</span><span>Pz</span>
                </div>
                
                <div className="grid grid-cols-7 gap-y-0.5">
                    {days.map((day, idx) => {
                        if (!day) return <div key={`empty-${idx}`} className="w-8 h-8"></div>;
                        
                        const isStart = isSameDay(day, rangeStart);
                        const isEnd = isSameDay(day, rangeEnd);
                        const isBetween = isBetweenDays(day, rangeStart, rangeEnd);
                        const isToday = isSameDay(day, new Date());
                        
                        let btnClass = "w-8 h-8 text-[11px] flex items-center justify-center font-medium transition-colors focus:outline-none cursor-pointer ";
                        if (isStart || isEnd) {
                            btnClass += "bg-primary-500 text-white font-bold rounded-md";
                        } else if (isBetween) {
                            btnClass += "bg-slate-100 text-slate-900";
                        } else {
                            btnClass += "text-slate-700 hover:bg-slate-100 rounded-md";
                            if (isToday) btnClass += " border border-primary-500 font-bold";
                        }
                        
                        return (
                            <button
                                key={day.toISOString()}
                                type="button"
                                onClick={() => handleDayClick(day)}
                                className={btnClass}
                            >
                                {day.getDate()}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    const totalFilteredAmount = orders.reduce((sum, order) => sum + Number(order.fatura_alti_kdvli || 0), 0);

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-xl font-bold text-slate-900">Gelişmiş Raporlar</h1>
                <div className="flex space-x-2">
                    <button onClick={exportToExcel} className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-sm text-xs font-semibold transition-colors cursor-pointer">
                        <FileSpreadsheet size={14} />
                        <span>Excel İndir</span>
                    </button>
                    <button onClick={exportToPDF} className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-sm text-xs font-semibold transition-colors cursor-pointer">
                        <FileText size={14} />
                        <span>PDF İndir</span>
                    </button>
                </div>
            </div>

            {/* Filters Section (Compact Bar) */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                    {/* Custom Date Range Picker */}
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Tarih Aralığı</span>
                        <div className="relative" ref={datePickerRef}>
                            <button
                                onClick={() => setShowDatePicker(!showDatePicker)}
                                className="w-56 bg-white border border-slate-300 rounded-lg p-2 text-left text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 flex items-center justify-between cursor-pointer h-8"
                            >
                                <span className="flex items-center gap-2">
                                    <Calendar size={13} className="text-slate-400" />
                                    {getRangeDisplayText()}
                                </span>
                            </button>

                            {showDatePicker && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 flex flex-col md:flex-row overflow-hidden font-sans border-slate-200">
                                    {/* Quick Selection Panel */}
                                    <div className="w-full md:w-36 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50 p-2 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
                                        <button onClick={() => selectQuickRange('bugun')} className="text-left px-3 py-1.5 text-[11px] rounded-md font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer">Bugün</button>
                                        <button onClick={() => selectQuickRange('dun')} className="text-left px-3 py-1.5 text-[11px] rounded-md font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer">Dün</button>
                                        <button onClick={() => selectQuickRange('son7')} className="text-left px-3 py-1.5 text-[11px] rounded-md font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer">Son 7 Gün</button>
                                        <button onClick={() => selectQuickRange('buay')} className="text-left px-3 py-1.5 text-[11px] rounded-md font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer">Bu Ay</button>
                                        <button onClick={() => selectQuickRange('gecenay')} className="text-left px-3 py-1.5 text-[11px] rounded-md font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer">Geçen Ay</button>
                                    </div>

                                    {/* Calendar Panel */}
                                    <div className="flex flex-col">
                                        <div className="p-3 flex gap-4 border-b border-slate-100">
                                            {renderCalendarMonthBlock(currentMonthLeft, true)}
                                            {renderCalendarMonthBlock(
                                                new Date(currentMonthLeft.getFullYear(), currentMonthLeft.getMonth() + 1, 1),
                                                false
                                            )}
                                        </div>
                                        <div className="p-2 bg-slate-50 flex justify-end gap-2">
                                            <button onClick={handleClearRange} className="px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer">Temizle</button>
                                            <button onClick={handleApplyRange} className="px-3 py-1.5 text-[11px] font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-md transition-colors shadow-sm cursor-pointer">Uygula</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Warehouse Select */}
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Depo</span>
                        <select name="warehouseId" value={filters.warehouseId} onChange={handleFilterChange} className="bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 h-8 min-w-[120px] cursor-pointer">
                            <option value="">Tümü</option>
                            {warehouses.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Plasiyer Select */}
                    {user.role === 'Admin' && (
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Plasiyer</span>
                            <select name="plasiyerId" value={filters.plasiyerId} onChange={handleFilterChange} className="bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 h-8 min-w-[120px] cursor-pointer">
                                <option value="">Tümü</option>
                                {plasiyers.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div>
                    <button onClick={applyFilters} className="bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 h-8 cursor-pointer">
                        <Search size={13} />
                        <span>Listele</span>
                    </button>
                </div>
            </div>

            {/* Results Table (Data Grid) */}
            <div className="bg-white shadow rounded-lg border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Arama Sonuçları ({orders.length} Kayıt)</h3>
                    <div className="text-xs font-semibold text-slate-500">
                        Toplam Filtrelenen Tutar (KDV'li): <span className="text-primary-500 font-bold text-sm">{totalFilteredAmount.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺</span>
                    </div>
                </div>
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Sipariş Tarihi</th>
                                <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Sipariş Saati</th>
                                <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Plasiyer</th>
                                <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Eczane Adı</th>
                                <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ürün Tanımı</th>
                                <th className="px-2 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Adet</th>
                                <th className="px-2 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">MF</th>
                                <th className="px-2 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Ek MF</th>
                                <th className="px-2 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Top. Adet</th>
                                <th className="px-2 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Tutar (KDV'li)</th>
                                <th className="px-2 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Tutar (KDV'siz)</th>
                                <th className="px-2 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">İsk %</th>
                                <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Klasman</th>
                                <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Not</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={14} className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center">
                                            <Filter size={36} className="text-slate-300 mb-2" />
                                            <p className="font-medium text-slate-500">Filtrelere uygun kayıt bulunamadı.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-b-0">
                                        <td className="px-3 py-2.5 text-slate-600 text-center whitespace-nowrap">{format(new Date(order.created_at), 'dd/MM/yyyy')}</td>
                                        <td className="px-3 py-2.5 text-slate-600 text-center whitespace-nowrap">{format(new Date(order.created_at), 'HH:mm:ss')}</td>
                                        <td className="px-3 py-2.5 font-medium text-slate-700 whitespace-nowrap">{order.plasiyer_name}</td>
                                        <td className="px-3 py-2.5 text-slate-900 font-semibold whitespace-nowrap">
                                            <div>{order.pharmacy_name}</div>
                                            <div className="text-[10px] text-slate-400 font-normal mt-0.5">{order.pharmacy_district} / {order.pharmacy_city}</div>
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-900 max-w-[200px] truncate" title={order.product_name}>{order.product_name}</td>
                                        <td className="px-2 py-2.5 text-slate-600 text-right">{order.adet}</td>
                                        <td className="px-2 py-2.5 text-slate-600 text-right">+{order.mf_adeti}</td>
                                        <td className="px-2 py-2.5 text-slate-600 text-right">+{order.ek_mf_adeti}</td>
                                        <td className="px-2 py-2.5 text-slate-900 text-right font-bold bg-slate-50/30">{order.toplam_adet}</td>
                                        <td className="px-2 py-2.5 text-slate-900 text-right font-semibold">{Number(order.fatura_alti_kdvli || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                        <td className="px-2 py-2.5 text-slate-600 text-right">{Number(order.fatura_alti_kdvsiz || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                        <td className="px-2 py-2.5 text-slate-600 text-right">{order.ek_iskonto || 0}%</td>
                                        <td className="px-3 py-2.5 text-slate-600 text-center whitespace-nowrap">{order.klasman_adi}</td>
                                        <td className="px-3 py-2.5 text-slate-500 text-center truncate max-w-[80px]" title={order.not_field}>{order.not_field || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
