# Farmavis Web Depo - B2B Sipariş ve Raporlama Sistemi

Farmavis Web Depo, plasiyerler ve yöneticiler (admin) için geliştirilmiş modern, hızlı ve kurumsal bir B2B sipariş yönetim ve gelişmiş raporlama sistemidir.

> [!NOTE]
> Bu depo, projenin arayüz tasarımlarını, özelliklerini ve mimarisini sergilemek amacıyla oluşturulmuş bir **Portfolyo / Showcase** deposudur. Fikri mülkiyet haklarını korumak amacıyla kaynak kodları bu depoda yer almamaktadır.

---

## 🚀 Temel Özellikler

* **Kurumsal ve Modern Tasarım (UI/UX):** Göz yormayan kurumsal renk paleti (Navy/Slate) ve ferah "Data Grid" tarzında tablo görünümleri.
* **Akıllı Sipariş Yönetimi:** Plasiyerler için eczane bazlı ürün ekleme, otomatik mal fazlası (MF) hesaplama, ek iskonto girişleri ve anlık sepet tutarı hesaplama süreçleri.
* **Gelişmiş Raporlama:** Satışların detaylı dökümünü içeren, dikey çizgilerden arındırılmış modern rapor tablosu.
* **Özel Tarih Aralığı Seçici (Date Range Picker):** Bugün, Dün, Son 7 Gün, Bu Ay ve Geçen Ay gibi hızlı seçim paneli ve yan yana iki takvim içeren özel takvim bileşeni.
* **Rapor Dışa Aktarma (Export):** Tek tıkla Excel (`.xlsx`) ve PDF formatlarında rapor indirebilme özelliği.
* **Güvenli Veritabanı Mimarisi (PostgreSQL RLS):** Veritabanı seviyesinde Row Level Security (Satır Bazlı Güvenlik) politikaları kullanılarak plasiyerlerin yalnızca kendi eczanelerini ve siparişlerini görmesi sağlanmıştır.

---

## 🛠️ Kullanılan Teknolojiler

* **Frontend:** React, Vite, Tailwind CSS, Lucide React, Zustand (State Management)
* **Backend:** Node.js, Express, JWT (JSON Web Token), Helmet (Güvenlik), Express Rate Limit
* **Veritabanı:** PostgreSQL (RLS, PL/pgSQL Triggers, UUID)
* **Dışa Aktarma:** XLSX, jsPDF, jsPDF-AutoTable

---

## 📸 Ekran Görüntüleri

### 1. Giriş Ekranı (Login)
*Kullanıcı dostu, modern ve güvenli giriş paneli.*

`[Buraya giris_ekrani.png görselinizi ekleyin]`

---

### 2. Sipariş Giriş Ekranı (Create Order)
*Eczane seçimi sonrasında aktif olan, barem ve MF oranlarını otomatik hesaplayan sepet ekranı.*

`[Buraya siparis_ekrani.png görselinizi ekleyin]`

---

### 3. Gelişmiş Raporlar ve Özel Tarih Seçici (Reports & Date Range Picker)
*Yan yana çift takvim ve hızlı tarih seçim butonlarına sahip, dikey çizgilerden arındırılmış temiz raporlama arayüzü.*

`[Buraya raporlar_ekranı.png görselinizi ekleyin]`

---

## 📞 İletişim & Detaylar

Projenin canlı demosu veya kaynak kod erişimi (kod inceleme amaçlı) hakkında görüşmek isterseniz benimle iletişime geçebilirsiniz.
