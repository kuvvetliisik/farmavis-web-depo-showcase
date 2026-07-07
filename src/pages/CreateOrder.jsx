import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store';
import api from '../api';
import { Search, Save, XCircle, Building2, Package } from 'lucide-react';

export default function CreateOrder() {
    const navigate = useNavigate();
    const { user, selectedWarehouse, setSelectedWarehouse } = useAuthStore();

    const [pharmacies, setPharmacies] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Modal
    const [showWarehouseModal, setShowWarehouseModal] = useState(false);

    // Pharmacy Autocomplete
    const [pharmacySearch, setPharmacySearch] = useState('');
    const [filteredPharmacies, setFilteredPharmacies] = useState([]);
    const [isPharmacyDropdownOpen, setIsPharmacyDropdownOpen] = useState(false);
    const [selectedPharmacy, setSelectedPharmacy] = useState(null);

    // Product List & Nav
    const [productSearch, setProductSearch] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [highlightedProductIndex, setHighlightedProductIndex] = useState(0);

    // Active Product (Middle Area)
    const [activeProduct, setActiveProduct] = useState(null);
    const [activeQuantity, setActiveQuantity] = useState(1);
    const [activeEkMf, setActiveEkMf] = useState(0);
    const [activeIskonto, setActiveIskonto] = useState(0);

    // Cart
    const [cart, setCart] = useState([]);

    const productListRef = useRef(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [pharmaciesRes, productsRes, warehousesRes] = await Promise.all([
                    api.get('/pharmacies'),
                    api.get('/products'),
                    api.get('/warehouses')
                ]);

                setPharmacies(pharmaciesRes.data);
                setProducts(productsRes.data);
                setFilteredProducts(productsRes.data);
                setWarehouses(warehousesRes.data);

                if (selectedWarehouse) {
                    const isValid = warehousesRes.data.some(w => w.id === selectedWarehouse);
                    if (!isValid) {
                        setSelectedWarehouse(null);
                        setShowWarehouseModal(true);
                    }
                } else {
                    setShowWarehouseModal(true);
                }

            } catch (err) {
                setError('Veriler yüklenirken hata oluştu');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [selectedWarehouse]);

    // Pharmacy Search Logic
    useEffect(() => {
        if (pharmacySearch) {
            const lowerSearch = pharmacySearch.toLowerCase();
            const filtered = pharmacies.filter(p =>
                p.name.toLowerCase().includes(lowerSearch) ||
                p.tax_no.includes(lowerSearch)
            );
            setFilteredPharmacies(filtered);
            setIsPharmacyDropdownOpen(true);
        } else {
            setFilteredPharmacies([]);
            setIsPharmacyDropdownOpen(false);
        }
    }, [pharmacySearch, pharmacies]);

    const handleSelectPharmacy = (pharmacy) => {
        setSelectedPharmacy(pharmacy);
        setPharmacySearch(pharmacy.name);
        setIsPharmacyDropdownOpen(false);
    };

    // Product Search Logic
    useEffect(() => {
        const filtered = products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
        setFilteredProducts(filtered);
        setHighlightedProductIndex(0);
    }, [productSearch, products]);

    // Keyboard Navigation for Product List
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (showWarehouseModal) return;

            // Don't hijack if typing in inputs other than product search
            if (e.target.tagName === 'INPUT' && e.target.id !== 'product-search') {
                return;
            }

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedProductIndex(prev => Math.min(prev + 1, filteredProducts.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedProductIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredProducts[highlightedProductIndex]) {
                    handleSelectProduct(filteredProducts[highlightedProductIndex]);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [filteredProducts, highlightedProductIndex, showWarehouseModal]);

    // Scroll highlighted product into view
    useEffect(() => {
        if (productListRef.current && productListRef.current.children[highlightedProductIndex]) {
            productListRef.current.children[highlightedProductIndex].scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }, [highlightedProductIndex]);

    const handleSelectProduct = (product) => {
        if (!selectedPharmacy) {
            alert('Lütfen önce eczane seçiniz!');
            return;
        }
        if (!selectedWarehouse) {
            alert('Lütfen önce depo seçiniz (Sağ üstten)');
            return;
        }

        setActiveProduct(product);
        setActiveQuantity(1);
        setActiveEkMf(0);
        setActiveIskonto(0);
        // Focus quantity input only on desktop
        if (window.innerWidth >= 1024) {
            setTimeout(() => {
                const qtyInput = document.getElementById('active-quantity');
                if (qtyInput) qtyInput.focus();
            }, 100);
        }
    };

    const parseMFRatio = (mfString) => {
        if (!mfString) return { buy: 0, free: 0 };
        const parts = mfString.split('+');
        if (parts.length === 2) {
            return { buy: parseInt(parts[0]) || 0, free: parseInt(parts[1]) || 0 };
        }
        return { buy: 0, free: 0 };
    };

    const calculateItemTotals = () => {
        if (!activeProduct) return { mfFree: 0, subtotal: 0, netPrice: 0 };

        const qty = parseInt(activeQuantity) || 0;
        const ekMf = parseInt(activeEkMf) || 0;
        const iskonto = parseFloat(activeIskonto) || 0;
        const unitPrice = parseFloat(activeProduct.unit_price) || 0;

        // MF Calculation
        const { buy, free } = parseMFRatio(activeProduct.mf_ratio);
        let mfFree = 0;
        if (buy > 0 && free > 0) {
            mfFree = Math.floor(qty / buy) * free;
        }
        mfFree += ekMf; // Add Extra MF

        // Price Calculation
        const rawTotal = qty * unitPrice;
        const discountAmount = rawTotal * (iskonto / 100);
        const finalTotal = rawTotal - discountAmount;

        const totalItemsReceived = qty + mfFree;
        const netPrice = totalItemsReceived > 0 ? (finalTotal / totalItemsReceived) : 0;

        return {
            mfFree,
            subtotal: finalTotal,
            netPrice
        };
    };

    const activeTotals = calculateItemTotals();

    const handleAddToCart = () => {
        if (!activeProduct || activeQuantity <= 0) return;

        // Check if product is already in cart
        const existingItemIndex = cart.findIndex(item => item.id === activeProduct.id);
        if (existingItemIndex !== -1) {
            alert('Bu ürün zaten sepette ekli!');
            return;
        }

        const qty = parseInt(activeQuantity);

        setCart([...cart, {
            ...activeProduct,
            quantity: qty,
            mfFree: activeTotals.mfFree,
            ekMf: parseInt(activeEkMf) || 0,
            iskonto: parseFloat(activeIskonto) || 0,
            subtotal: activeTotals.subtotal,
            netPrice: activeTotals.netPrice
        }]);

        setActiveProduct(null);
        // Focus back to product search only if it's a desktop-sized screen to prevent mobile keyboard from popping up
        if (window.innerWidth >= 1024) {
            const searchInput = document.getElementById('product-search');
            if (searchInput) searchInput.focus();
        }
    };

    const adjustQuantity = (amount) => {
        const current = parseInt(activeQuantity) || 0;
        const next = current + amount;
        if (next > 0) setActiveQuantity(next);
    };

    const removeFromCart = (index) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

    const handleSubmitOrder = async () => {
        if (!selectedPharmacy) {
            setError('Lütfen eczane seçiniz!');
            return;
        }
        if (cart.length === 0) {
            setError('Sepette ürün yok!');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await api.post('/orders', {
                pharmacy_id: selectedPharmacy.id,
                warehouse_id: selectedWarehouse || warehouses[0]?.id, // fallback
                total_amount: cartTotal,
                items: cart // This is mocked, needs backend support if backend processes items list
            });
            alert('Sipariş başarıyla oluşturuldu!');
            setSelectedWarehouse(null); // Reset the selected warehouse for future orders
            navigate('/');
        } catch (err) {
            console.error('Sipariş Hatası:', err.response?.data);
            const backendError = err.response?.data?.errors?.[0]?.msg || err.response?.data?.error;
            setError(backendError || 'Sipariş kaydedilirken bir hata oluştu');
            setSubmitting(false);
        }
    };

    const getWarehouseName = () => {
        return warehouses.find(w => w.id === selectedWarehouse)?.name || 'Depo Seçilmedi';
    };

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50 overflow-hidden relative">
            {/* WAREHOUSE SELECTOR MODAL */}
            {showWarehouseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Building2 className="text-primary-600" />
                            İşlem Yapılacak Depo
                        </h3>
                        <p className="text-gray-500 text-sm mb-4">Siparişleriniz için lütfen bir depo seçiniz. Bu seçim oturum boyunca hatırlanacaktır.</p>
                        <select
                            className="w-full border-gray-300 rounded-lg p-3 border focus:ring-2 focus:ring-primary-500"
                            onChange={(e) => {
                                setSelectedWarehouse(e.target.value);
                                setShowWarehouseModal(false);
                            }}
                            defaultValue=""
                        >
                            <option value="" disabled>-- Depo Seçilmedi --</option>
                            {warehouses.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* TOP BAR: Pharmacy Search & Info */}
            <div className="relative z-30 bg-white shadow-sm border-b border-gray-200 p-2 lg:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                <div className="w-full lg:flex-1 lg:max-w-2xl relative flex items-center gap-2 lg:gap-4">
                    <span className="font-bold text-orange-500 whitespace-nowrap text-sm lg:text-base">ECZANE ARA</span>
                    <div className="relative flex-1">
                        <div className="flex bg-white border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                            <input
                                type="text"
                                className="w-full p-1.5 lg:p-2 outline-none text-sm"
                                placeholder="Eczane Adı veya VN..."
                                value={pharmacySearch}
                                onChange={(e) => setPharmacySearch(e.target.value)}
                                onClick={() => { if (filteredPharmacies.length > 0) setIsPharmacyDropdownOpen(true); }}
                            />
                            <button className="bg-blue-100 px-3 flex items-center justify-center border-l border-gray-300 hover:bg-blue-200">
                                <Search size={18} className="text-blue-600" />
                            </button>
                        </div>
                        {/* Autocomplete Dropdown */}
                        {isPharmacyDropdownOpen && (
                            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 shadow-xl rounded-md max-h-60 overflow-y-auto z-50">
                                {filteredPharmacies.length > 0 ? (
                                    filteredPharmacies.map(p => (
                                        <div
                                            key={p.id}
                                            className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                            onClick={() => handleSelectPharmacy(p)}
                                        >
                                            <div className="font-semibold text-gray-800">{p.name}</div>
                                            <div className="text-xs text-gray-500">
                                                {p.city} - {p.district}{p.neighborhood ? ` - ${p.neighborhood}` : ''} (VN: {p.tax_no})
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-3 text-sm text-gray-500">Sonuç bulunamadı.</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center self-end lg:self-auto w-full lg:w-auto mt-1 lg:mt-0">
                    <button
                        onClick={() => setShowWarehouseModal(true)}
                        className="text-xs lg:text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 px-3 rounded-md flex items-center justify-center gap-2 border border-gray-300 w-full"
                    >
                        <Building2 size={16} />
                        Aktif Depo: <span className="font-bold">{getWarehouseName()}</span>
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden relative pb-20 lg:pb-0">

                {/* LEFT SIDEBAR: Product List */}
                <div className="flex w-full lg:w-[320px] h-[35%] lg:h-full flex-shrink-0 bg-white border-b-4 lg:border-b-0 lg:border-r border-blue-400 flex-col z-20 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
                    <div className="p-2 border-b border-gray-200 bg-[#E8F1FC] flex flex-col gap-1.5">
                        <select className="w-full text-xs p-1 border border-gray-400 bg-white outline-none h-7">
                            <option>Hepsi</option>
                        </select>
                        <div className="relative flex border border-blue-400 bg-white h-7">
                            <input
                                id="product-search"
                                type="text"
                                className="w-full px-2 py-1 text-sm outline-none"
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                            />
                            <button className="px-2 border-l border-blue-200 hover:bg-gray-50 flex items-center justify-center">
                                <Search size={14} className="text-blue-500" />
                            </button>
                        </div>
                        <div className="flex items-center justify-center gap-4 text-xs font-bold text-white bg-[#5D9CEC] py-1.5 mt-0.5 rounded-sm">
                            <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="ptype" className="accent-white scale-110" /> İlaç</label>
                            <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="ptype" className="accent-white scale-110" /> İlaç Dışı</label>
                            <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="ptype" defaultChecked className="accent-white scale-110" /> Hepsi</label>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-white" ref={productListRef}>
                        {filteredProducts.map((p, idx) => (
                            <div
                                key={p.id}
                                onClick={() => handleSelectProduct(p)}
                                className={`px-2 py-2 border-b border-gray-100 cursor-pointer flex items-center gap-2 transition-colors ${idx === highlightedProductIndex ? 'bg-[#cbd5e1]' : 'hover:bg-gray-50'}`}
                            >
                                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-[#4C566A] text-white flex-shrink-0">
                                    i
                                </div>
                                <div className="text-[11px] font-semibold text-[#4C566A] truncate uppercase leading-tight">{p.name}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT AREA: Active Product & Cart */}
                <div className="flex flex-1 flex-col overflow-y-auto lg:overflow-hidden bg-gray-100 p-2 lg:p-4 z-10 gap-2">
                    {/* Active Pharmacy Banner */}
                    {selectedPharmacy && (
                        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg mb-4 text-center font-bold text-sm shadow-sm flex items-center justify-center gap-2">
                            <span>"{selectedPharmacy.name.toLocaleUpperCase('tr-TR')} ({selectedPharmacy.district.toLocaleUpperCase('tr-TR')}-{selectedPharmacy.city.toLocaleUpperCase('tr-TR')})" İÇİN SİPARİŞ GİRİŞİ YAPMAKTASINIZ!</span>
                        </div>
                    )}

                    {error && <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded mb-4">{error}</div>}

                    {/* ACTIVE PRODUCT EDITOR */}
                    {activeProduct ? (
                        <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6 overflow-hidden shrink-0">
                            <div className="bg-blue-400 text-white px-2 lg:px-4 py-2 flex justify-between text-[10px] lg:text-xs font-bold font-mono">
                                <div className="flex-1 truncate">İSK.</div>
                                <div className="flex-1 text-center leading-tight">ÖDEME<br className="lg:hidden" /> İSK.</div>
                                <div className="flex-1 text-center">VADE</div>
                                <div className="flex-1 text-center">BAREM</div>
                                <div className="flex-1 text-right">MF</div>
                            </div>
                            <div className="px-2 lg:px-4 py-2 bg-gray-200 text-gray-600 flex justify-between text-[10px] lg:text-xs font-bold font-mono border-b border-gray-300 items-center">
                                <div className="flex-1"></div>
                                <div className="flex-1 text-center"></div>
                                <div className="flex-1 text-center">120 gün</div>
                                <div className="flex-1 text-center"></div>
                                <div className="flex-1 text-right text-blue-700 text-xs lg:text-sm">{activeProduct.mf_ratio || '-'}</div>
                            </div>

                            <div className="p-3 lg:p-4 flex flex-wrap gap-2 lg:gap-3 items-end bg-gray-50">
                                <div className="w-[48%] md:w-[23%] lg:flex-1">
                                    <label className="block text-[10px] sm:text-xs font-bold text-gray-500 mb-1 text-center">PSF / B.Fiyat</label>
                                    <div className="text-center font-bold text-gray-700 h-[38px] flex flex-col items-center justify-center leading-tight bg-white border border-gray-200 rounded shadow-sm">
                                        <span className="text-[10px] sm:text-xs">{activeProduct.psf.toLocaleString('tr-TR')} /</span>
                                        <span className="text-blue-600 text-xs sm:text-sm">{activeProduct.unit_price.toLocaleString('tr-TR')}</span>
                                    </div>
                                </div>
                                <div className="w-[48%] md:w-[23%] lg:flex-1">
                                    <label className="block text-[10px] sm:text-xs font-bold text-gray-500 mb-1 text-center">KDV %</label>
                                    <div className="text-center font-bold text-gray-600 h-[38px] flex items-center justify-center bg-white border border-gray-200 rounded shadow-sm">{activeProduct.kdv}</div>
                                </div>
                                <div className="w-[48%] md:w-[23%] lg:flex-1">
                                    <label className="block text-[10px] sm:text-xs font-bold text-gray-500 mb-1 text-center">MİKTAR</label>
                                    <div className="flex items-center h-[38px] rounded overflow-hidden shadow-sm border border-gray-300">
                                        <button type="button" onClick={() => adjustQuantity(-1)} className="bg-gray-200 hover:bg-gray-300 w-8 h-full flex items-center justify-center font-bold text-gray-600 focus:outline-none">-</button>
                                        <input
                                            id="active-quantity"
                                            type="number" min="1"
                                            className="w-full text-center font-bold text-base focus:outline-none appearance-none h-full bg-white"
                                            value={activeQuantity}
                                            onChange={(e) => setActiveQuantity(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddToCart(); }}
                                        />
                                        <button type="button" onClick={() => adjustQuantity(1)} className="bg-gray-200 hover:bg-gray-300 w-8 h-full flex items-center justify-center font-bold text-gray-600 focus:outline-none">+</button>
                                    </div>
                                </div>
                                <div className="w-[48%] md:w-[23%] lg:flex-1">
                                    <label className="block text-[10px] sm:text-xs font-bold text-gray-500 mb-1 text-center">MF</label>
                                    <div className="text-center font-bold text-green-600 text-lg bg-green-50 rounded border border-green-200 h-[38px] flex items-center justify-center shadow-sm">
                                        {activeTotals.mfFree}
                                    </div>
                                </div>
                                <div className="w-[48%] md:w-[23%] lg:flex-1">
                                    <label className="block text-[10px] sm:text-xs font-bold text-gray-500 mb-1 text-center">EK MF</label>
                                    <input
                                        type="number" min="0"
                                        className="w-full border border-gray-300 rounded p-1.5 h-[38px] text-center font-bold shadow-sm"
                                        value={activeEkMf}
                                        onChange={(e) => setActiveEkMf(e.target.value)}
                                    />
                                </div>
                                <div className="w-[48%] md:w-[23%] lg:flex-1">
                                    <label className="block text-[10px] sm:text-xs font-bold text-gray-500 mb-1 text-center">EK İsk. (%)</label>
                                    <input
                                        type="number" min="0" max="100" step="0.1"
                                        className="w-full border border-gray-300 rounded p-1.5 h-[38px] text-center font-bold shadow-sm"
                                        value={activeIskonto}
                                        onChange={(e) => setActiveIskonto(e.target.value)}
                                    />
                                </div>
                                <div className="w-[48%] md:w-[23%] lg:flex-1">
                                    <label className="block text-[10px] sm:text-xs font-bold text-gray-500 mb-1 text-center">NET FYT</label>
                                    <div className="text-center font-bold text-gray-800 text-base flex items-center justify-center h-[38px] bg-white border border-gray-200 rounded shadow-sm">
                                        {activeTotals.netPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div className="w-[48%] md:w-[23%] lg:flex-1">
                                    <button
                                        type="button"
                                        onClick={handleAddToCart}
                                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm h-[38px] lg:h-full lg:min-h-[44px] rounded shadow-md transition-all active:scale-95 flex items-center justify-center gap-1 mt-[16px] lg:mt-0"
                                    >
                                        <Package size={16} />
                                        <span>EKLE</span>
                                    </button>
                                </div>
                            </div>
                            <div className="bg-gray-800 text-white p-2 flex justify-between text-sm font-bold items-center sticky top-0">
                                <span>{activeProduct.name}</span>
                                <span>TUTAR: <span className="text-yellow-400 text-lg">{activeTotals.subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span></span>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-gray-400 mb-6 shrink-0">
                            <Search size={48} className="mb-2 opacity-50" />
                            <p>İşlem yapmak için sol menüden ürün seçiniz</p>
                            <p className="text-xs uppercase mt-2 font-mono">veya [Aşağı/Yukarı] Yön Tuşlarını Kullanın</p>
                        </div>
                    )}

                    {/* CART TABLE */}
                    <div className="bg-white shadow-md rounded-lg flex-1 min-h-[300px] lg:min-h-0 shrink-0 lg:shrink flex flex-col overflow-hidden border border-gray-200">
                        <div className="bg-gray-600 text-white px-4 py-2 flex text-xs font-bold font-mono">
                            <div className="flex-[3]">ÜRÜN ADI</div>
                            <div className="flex-1 text-center">MV. ŞUBE</div>
                            <div className="flex-1 text-center">VADE</div>
                            <div className="flex-1 text-center">ADET</div>
                            <div className="flex-1 text-center">MF</div>
                            <div className="flex-1 text-center">İSKONTO</div>
                            <div className="flex-1 text-right">NET. B.F.</div>
                            <div className="flex-1 text-right">TUTAR</div>
                            <div className="w-10"></div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 bg-gray-50">
                            {cart.length === 0 ? (
                                <div className="text-center text-gray-400 py-10 font-medium">Sepetiniz boş</div>
                            ) : (
                                cart.map((item, index) => (
                                    <div key={index} className="flex text-sm border-b border-gray-200 py-3 px-2 items-center hover:bg-white transition-colors group">
                                        <div className="flex-[3] font-bold text-gray-700">{item.name}</div>
                                        <div className="flex-1 text-center text-gray-500 text-xs">Aktif</div>
                                        <div className="flex-1 text-center text-gray-500 text-xs">120G</div>
                                        <div className="flex-1 text-center font-bold text-gray-800">{item.quantity}</div>
                                        <div className="flex-1 text-center font-bold text-green-600">+{item.mfFree}</div>
                                        <div className="flex-1 text-center text-red-500 font-medium">{item.iskonto}%</div>
                                        <div className="flex-1 text-right font-mono text-gray-600">{item.netPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                                        <div className="flex-1 text-right font-bold text-gray-900">{item.subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
                                        <div className="w-10 flex justify-end">
                                            <button onClick={() => removeFromCart(index)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        {/* FOOTER TOTALS & ACTION BUTTONS (Desktop ONLY) */}
                        <div className="hidden lg:flex bg-gray-100 p-4 border-t border-gray-300 justify-between items-center">
                            <div className="text-gray-700">
                                Toplam Ürün Çeşidi: <span className="font-bold">{cart.length}</span>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <div className="text-xs text-gray-500 font-bold">GENEL TOPLAM</div>
                                    <div className="text-2xl font-bold text-orange-600 leading-none">
                                        {cartTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded shadow font-bold text-sm transition-colors"
                                        onClick={() => setCart([])}
                                    >
                                        İPTAL
                                    </button>
                                    <button
                                        onClick={handleSubmitOrder}
                                        disabled={submitting || cart.length === 0 || !selectedPharmacy}
                                        className={`bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded shadow-lg font-bold text-lg transition-colors flex items-center gap-2 ${submitting ? 'opacity-70 cursor-wait' : ''}`}
                                    >
                                        <Save size={20} />
                                        SİPARİŞİ ONAYLA
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* STICKY BOTTOM BAR (MOBILE ONLY) */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-orange-500 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40 px-4 py-3 flex justify-between items-center pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500">EKSTRA TOPLAM</span>
                    <span className="text-xl font-black text-orange-600 leading-tight">
                        {cartTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">{cart.length} Ürün Çeşidi</span>
                </div>
                <button
                    onClick={handleSubmitOrder}
                    disabled={submitting || cart.length === 0 || !selectedPharmacy}
                    className={`bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-xl shadow-lg font-bold text-sm transition-transform active:scale-95 flex items-center gap-2 ${submitting ? 'opacity-70 cursor-wait' : ''}`}
                >
                    <Save size={18} />
                    SİPARİŞİ BİTİR
                </button>
            </div>
        </div>
    );
}
