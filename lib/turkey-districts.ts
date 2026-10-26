// Türkiye ilçe veri seti — iller, ilçeler ve yaklaşık koordinatlar.
// Koordinatlar ilçe merkezi içindir; yarıçap tabanlı aramada harita merkezini konumlandırmak için kullanılır.

export interface PlaceEntry {
  name: string;
  lat: number;
  lng: number;
}

export interface PlaceMatch {
  label: string;
  province: string;
  lat: number;
  lng: number;
  kind: 'city' | 'district';
}

export const DISTRICTS: Record<string, PlaceEntry[]> = {
  'Istanbul': [
    { name: 'Adalar', lat: 40.87, lng: 29.12 }, { name: 'Arnavutköy', lat: 41.19, lng: 28.74 },
    { name: 'Ataşehir', lat: 40.99, lng: 29.13 }, { name: 'Avcılar', lat: 40.98, lng: 28.72 },
    { name: 'Bağcılar', lat: 41.04, lng: 28.85 }, { name: 'Bahçelievler', lat: 41.0, lng: 28.85 },
    { name: 'Bakırköy', lat: 40.98, lng: 28.87 }, { name: 'Başakşehir', lat: 41.09, lng: 28.8 },
    { name: 'Bayrampaşa', lat: 41.04, lng: 28.91 }, { name: 'Beşiktaş', lat: 41.04, lng: 29.01 },
    { name: 'Beykoz', lat: 41.13, lng: 29.11 }, { name: 'Beylikdüzü', lat: 41.0, lng: 28.64 },
    { name: 'Beyoğlu', lat: 41.03, lng: 28.98 }, { name: 'Büyükçekmece', lat: 41.02, lng: 28.58 },
    { name: 'Çatalca', lat: 41.14, lng: 28.46 }, { name: 'Çekmeköy', lat: 41.06, lng: 29.24 },
    { name: 'Esenler', lat: 41.05, lng: 28.88 }, { name: 'Esenyurt', lat: 41.03, lng: 28.67 },
    { name: 'Eyüpsultan', lat: 41.07, lng: 28.93 }, { name: 'Fatih', lat: 41.02, lng: 28.94 },
    { name: 'Gaziosmanpaşa', lat: 41.06, lng: 28.91 }, { name: 'Güngören', lat: 41.02, lng: 28.87 },
    { name: 'Kadıköy', lat: 40.99, lng: 29.04 }, { name: 'Kağıthane', lat: 41.08, lng: 28.97 },
    { name: 'Kartal', lat: 40.89, lng: 29.19 }, { name: 'Küçükçekmece', lat: 41.0, lng: 28.78 },
    { name: 'Maltepe', lat: 40.94, lng: 29.13 }, { name: 'Pendik', lat: 40.87, lng: 29.23 },
    { name: 'Sancaktepe', lat: 41.0, lng: 29.24 }, { name: 'Sarıyer', lat: 41.17, lng: 29.06 },
    { name: 'Silivri', lat: 41.07, lng: 28.25 }, { name: 'Sultanbeyli', lat: 40.96, lng: 29.27 },
    { name: 'Sultangazi', lat: 41.11, lng: 28.87 }, { name: 'Şile', lat: 41.17, lng: 29.61 },
    { name: 'Şişli', lat: 41.06, lng: 28.99 }, { name: 'Tuzla', lat: 40.82, lng: 29.3 },
    { name: 'Ümraniye', lat: 41.02, lng: 29.12 }, { name: 'Üsküdar', lat: 41.03, lng: 29.03 },
    { name: 'Zeytinburnu', lat: 40.99, lng: 28.9 },
  ],
  'Ankara': [
    { name: 'Akyurt', lat: 40.12, lng: 33.08 }, { name: 'Altındağ', lat: 39.94, lng: 32.88 },
    { name: 'Ayaş', lat: 39.97, lng: 32.14 }, { name: 'Bala', lat: 39.55, lng: 32.75 },
    { name: 'Beypazarı', lat: 40.24, lng: 31.92 }, { name: 'Çamlıdere', lat: 40.45, lng: 32.37 },
    { name: 'Çankaya', lat: 39.9, lng: 32.86 }, { name: 'Çubuk', lat: 40.24, lng: 33.04 },
    { name: 'Elmadağ', lat: 39.92, lng: 33.23 }, { name: 'Etimesgut', lat: 39.96, lng: 32.69 },
    { name: 'Evren', lat: 39.29, lng: 32.91 }, { name: 'Gölbaşı', lat: 39.79, lng: 32.74 },
    { name: 'Güdül', lat: 40.21, lng: 32.24 }, { name: 'Haymana', lat: 39.44, lng: 32.51 },
    { name: 'Kalecik', lat: 40.09, lng: 33.41 }, { name: 'Kahramankazan', lat: 40.2, lng: 32.67 },
    { name: 'Keçiören', lat: 39.98, lng: 32.86 }, { name: 'Kızılcahamam', lat: 40.47, lng: 32.65 },
    { name: 'Mamak', lat: 39.93, lng: 32.92 }, { name: 'Nallıhan', lat: 40.32, lng: 31.35 },
    { name: 'Polatlı', lat: 39.58, lng: 32.15 }, { name: 'Pursaklar', lat: 40.05, lng: 32.88 },
    { name: 'Sincan', lat: 39.96, lng: 32.58 }, { name: 'Şereflikoçhisar', lat: 38.94, lng: 33.51 },
    { name: 'Yenimahalle', lat: 39.97, lng: 32.78 },
  ],
  'İzmir': [
    { name: 'Aliağa', lat: 38.8, lng: 26.97 }, { name: 'Balçova', lat: 38.33, lng: 27.12 },
    { name: 'Bayındır', lat: 38.23, lng: 27.48 }, { name: 'Bayraklı', lat: 38.47, lng: 27.16 },
    { name: 'Bergama', lat: 39.12, lng: 27.18 }, { name: 'Beydağ', lat: 38.13, lng: 28.08 },
    { name: 'Bornova', lat: 38.46, lng: 27.22 }, { name: 'Buca', lat: 38.37, lng: 27.19 },
    { name: 'Çeşme', lat: 38.32, lng: 26.31 }, { name: 'Çiğli', lat: 38.51, lng: 27.04 },
    { name: 'Dikili', lat: 39.07, lng: 26.89 }, { name: 'Foça', lat: 38.67, lng: 26.76 },
    { name: 'Gaziemir', lat: 38.32, lng: 27.14 }, { name: 'Güzelbahçe', lat: 38.31, lng: 26.99 },
    { name: 'Karabağlar', lat: 38.34, lng: 27.15 }, { name: 'Karaburun', lat: 38.64, lng: 26.52 },
    { name: 'Kemalpaşa', lat: 38.43, lng: 27.42 }, { name: 'Kınık', lat: 39.08, lng: 27.37 },
    { name: 'Kiraz', lat: 38.25, lng: 28.17 }, { name: 'Konak', lat: 38.41, lng: 27.13 },
    { name: 'Menderes', lat: 38.25, lng: 27.13 }, { name: 'Menemen', lat: 38.61, lng: 27.07 },
    { name: 'Narlıdere', lat: 38.37, lng: 27.07 }, { name: 'Ödemiş', lat: 38.23, lng: 28.04 },
    { name: 'Seferihisar', lat: 38.2, lng: 26.84 }, { name: 'Selçuk', lat: 37.95, lng: 27.37 },
    { name: 'Tire', lat: 38.09, lng: 27.73 }, { name: 'Torbalı', lat: 38.15, lng: 27.35 },
    { name: 'Urla', lat: 38.32, lng: 26.77 },
  ],
  'Antalya': [
    { name: 'Akseki', lat: 37.04, lng: 31.79 }, { name: 'Aksu', lat: 36.95, lng: 30.84 },
    { name: 'Alanya', lat: 36.54, lng: 31.99 }, { name: 'Demre', lat: 36.24, lng: 29.99 },
    { name: 'Döşemealtı', lat: 37.02, lng: 30.61 }, { name: 'Elmalı', lat: 36.74, lng: 29.92 },
    { name: 'Finike', lat: 36.3, lng: 30.14 }, { name: 'Gazipaşa', lat: 36.27, lng: 32.31 },
    { name: 'Gündoğmuş', lat: 36.82, lng: 31.5 }, { name: 'İbradı', lat: 37.06, lng: 31.55 },
    { name: 'Kaş', lat: 36.2, lng: 29.64 }, { name: 'Kemer', lat: 36.6, lng: 30.56 },
    { name: 'Kepez', lat: 36.94, lng: 30.72 }, { name: 'Konyaaltı', lat: 36.86, lng: 30.63 },
    { name: 'Korkuteli', lat: 37.06, lng: 30.19 }, { name: 'Kumluca', lat: 36.37, lng: 30.29 },
    { name: 'Manavgat', lat: 36.79, lng: 31.44 }, { name: 'Muratpaşa', lat: 36.89, lng: 30.71 },
    { name: 'Serik', lat: 37.01, lng: 30.87 },
  ],
  'Adana': [
    { name: 'Aladağ', lat: 37.21, lng: 35.4 }, { name: 'Ceyhan', lat: 37.03, lng: 35.82 },
    { name: 'Çukurova', lat: 37.02, lng: 35.26 }, { name: 'Feke', lat: 37.34, lng: 35.9 },
    { name: 'İmamoğlu', lat: 37.27, lng: 35.65 }, { name: 'Karaisalı', lat: 37.19, lng: 34.99 },
    { name: 'Karataş', lat: 36.56, lng: 35.38 }, { name: 'Kozan', lat: 37.45, lng: 35.83 },
    { name: 'Pozantı', lat: 37.34, lng: 34.87 }, { name: 'Saimbeyli', lat: 37.98, lng: 36.22 },
    { name: 'Sarıçam', lat: 36.99, lng: 35.37 }, { name: 'Seyhan', lat: 36.99, lng: 35.32 },
    { name: 'Tufanbeyli', lat: 37.97, lng: 36.12 }, { name: 'Yumurtalık', lat: 36.78, lng: 35.64 },
    { name: 'Yüreğir', lat: 36.99, lng: 35.36 },
  ],
  'Bursa': [
    { name: 'Büyükorhan', lat: 40.04, lng: 28.91 }, { name: 'Gemlik', lat: 40.43, lng: 29.16 },
    { name: 'Gürsu', lat: 40.25, lng: 29.2 }, { name: 'Harmancık', lat: 39.98, lng: 29.12 },
    { name: 'İnegöl', lat: 40.09, lng: 29.51 }, { name: 'İznik', lat: 40.43, lng: 29.72 },
    { name: 'Karacabey', lat: 40.21, lng: 28.37 }, { name: 'Keleş', lat: 40.0, lng: 28.99 },
    { name: 'Kestel', lat: 40.22, lng: 29.22 }, { name: 'Mudanya', lat: 40.37, lng: 28.88 },
    { name: 'Mustafakemalpaşa', lat: 40.03, lng: 28.43 }, { name: 'Nilüfer', lat: 40.21, lng: 28.99 },
    { name: 'Orhaneli', lat: 40.14, lng: 28.95 }, { name: 'Orhangazi', lat: 40.49, lng: 29.31 },
    { name: 'Osmangazi', lat: 40.19, lng: 29.08 }, { name: 'Yenişehir', lat: 40.26, lng: 29.64 },
    { name: 'Yıldırım', lat: 40.19, lng: 29.13 },
  ],
  'Konya': [
    { name: 'Akören', lat: 37.68, lng: 32.38 }, { name: 'Akşehir', lat: 38.36, lng: 31.41 },
    { name: 'Altınekin', lat: 38.07, lng: 32.28 }, { name: 'Beyşehir', lat: 37.68, lng: 31.72 },
    { name: 'Bozkır', lat: 37.19, lng: 32.26 }, { name: 'Cihanbeyli', lat: 38.32, lng: 32.29 },
    { name: 'Çeltik', lat: 39.01, lng: 32.79 }, { name: 'Çumra', lat: 37.57, lng: 32.78 },
    { name: 'Derbent', lat: 38.09, lng: 32.0 }, { name: 'Doğanhisar', lat: 38.19, lng: 31.88 },
    { name: 'Emirgazi', lat: 37.68, lng: 33.22 }, { name: 'Ereğli', lat: 37.68, lng: 34.06 },
    { name: 'Güneysınır', lat: 37.36, lng: 32.62 }, { name: 'Hadım', lat: 36.98, lng: 32.47 },
    { name: 'Halkapınar', lat: 37.84, lng: 34.21 }, { name: 'Hüyük', lat: 37.95, lng: 31.96 },
    { name: 'Ilgın', lat: 38.28, lng: 32.03 }, { name: 'Kadınhanı', lat: 38.24, lng: 32.21 },
    { name: 'Karapınar', lat: 37.72, lng: 33.55 }, { name: 'Karatay', lat: 37.89, lng: 32.5 },
    { name: 'Kulu', lat: 39.09, lng: 32.64 }, { name: 'Meram', lat: 37.85, lng: 32.44 },
    { name: 'Sarayönü', lat: 38.37, lng: 32.39 }, { name: 'Selçuklu', lat: 37.92, lng: 32.52 },
    { name: 'Seydişehir', lat: 37.42, lng: 32.19 }, { name: 'Taşkent', lat: 36.98, lng: 32.4 },
    { name: 'Tuzlukçu', lat: 38.45, lng: 31.87 }, { name: 'Yalıhüyük', lat: 37.38, lng: 32.43 },
    { name: 'Yunak', lat: 38.81, lng: 31.74 },
  ],
  'Aydın': [
    { name: 'Bozdoğan', lat: 37.68, lng: 28.35 }, { name: 'Buharkent', lat: 37.88, lng: 28.65 },
    { name: 'Çine', lat: 37.58, lng: 28.06 }, { name: 'Didim', lat: 37.38, lng: 27.26 },
    { name: 'Germencik', lat: 37.58, lng: 27.64 }, { name: 'İncirliova', lat: 37.67, lng: 27.72 },
    { name: 'Karacasu', lat: 37.73, lng: 28.56 }, { name: 'Karpuzlu', lat: 37.57, lng: 28.24 },
    { name: 'Koçarlı', lat: 37.72, lng: 27.83 }, { name: 'Kuşadası', lat: 37.86, lng: 27.26 },
    { name: 'Kuyucak', lat: 37.93, lng: 28.46 }, { name: 'Nazilli', lat: 37.91, lng: 28.32 },
    { name: 'Söke', lat: 37.72, lng: 27.41 }, { name: 'Sultanhisar', lat: 37.92, lng: 28.17 },
    { name: 'Yenipazar', lat: 37.76, lng: 28.21 },
  ],
  'Balıkesir': [
    { name: 'Ayvalık', lat: 39.32, lng: 26.69 }, { name: 'Balya', lat: 39.75, lng: 27.66 },
    { name: 'Bandırma', lat: 40.35, lng: 27.97 }, { name: 'Bigadiç', lat: 39.67, lng: 28.14 },
    { name: 'Burhaniye', lat: 39.5, lng: 26.98 }, { name: 'Dursunbey', lat: 39.58, lng: 28.63 },
    { name: 'Edremit', lat: 39.6, lng: 27.02 }, { name: 'Erdek', lat: 40.4, lng: 27.79 },
    { name: 'Gömeç', lat: 39.48, lng: 26.84 }, { name: 'Gönen', lat: 40.35, lng: 27.65 },
    { name: 'Havran', lat: 39.55, lng: 27.11 }, { name: 'İvrindi', lat: 39.58, lng: 27.49 },
    { name: 'Karesi', lat: 39.65, lng: 27.89 }, { name: 'Kepsut', lat: 39.65, lng: 28.11 },
    { name: 'Manyas', lat: 40.05, lng: 27.97 }, { name: 'Marmara', lat: 40.59, lng: 27.54 },
    { name: 'Savaştepe', lat: 39.38, lng: 27.66 }, { name: 'Sındırgı', lat: 39.42, lng: 28.19 },
    { name: 'Susurluk', lat: 39.92, lng: 28.16 },
  ],
  'Çanakkale': [
    { name: 'Ayvacık', lat: 39.6, lng: 26.4 }, { name: 'Bayramiç', lat: 39.81, lng: 26.61 },
    { name: 'Biga', lat: 40.23, lng: 27.24 }, { name: 'Bozcaada', lat: 39.83, lng: 26.04 },
    { name: 'Çan', lat: 40.03, lng: 27.04 }, { name: 'Eceabat', lat: 40.18, lng: 26.37 },
    { name: 'Ezine', lat: 39.79, lng: 26.34 }, { name: 'Gelibolu', lat: 40.41, lng: 26.67 },
    { name: 'Gökçeada', lat: 40.2, lng: 25.9 }, { name: 'Lapseki', lat: 40.35, lng: 26.69 },
    { name: 'Yenice', lat: 39.93, lng: 27.26 },
  ],
  'Denizli': [
    { name: 'Acıpayam', lat: 37.41, lng: 29.39 }, { name: 'Babadağ', lat: 37.79, lng: 28.87 },
    { name: 'Baklan', lat: 37.93, lng: 29.6 }, { name: 'Bekilli', lat: 38.15, lng: 29.41 },
    { name: 'Beyağaç', lat: 37.36, lng: 28.86 }, { name: 'Bozkurt', lat: 37.66, lng: 29.13 },
    { name: 'Buldan', lat: 38.04, lng: 28.83 }, { name: 'Çal', lat: 37.98, lng: 29.4 },
    { name: 'Çameli', lat: 37.07, lng: 29.4 }, { name: 'Çardak', lat: 37.97, lng: 29.87 },
    { name: 'Çivril', lat: 38.31, lng: 29.73 }, { name: 'Güney', lat: 37.94, lng: 29.15 },
    { name: 'Honaz', lat: 37.79, lng: 29.52 }, { name: 'Kale', lat: 37.39, lng: 28.72 },
    { name: 'Merkezefendi', lat: 37.78, lng: 29.06 }, { name: 'Pamukkale', lat: 37.77, lng: 29.09 },
    { name: 'Sarayköy', lat: 37.93, lng: 28.87 }, { name: 'Serinhisar', lat: 37.57, lng: 29.27 },
    { name: 'Tavas', lat: 37.56, lng: 28.88 },
  ],
  'Gaziantep': [
    { name: 'Araban', lat: 37.43, lng: 37.93 }, { name: 'İslahiye', lat: 37.03, lng: 36.65 },
    { name: 'Karkamış', lat: 36.85, lng: 38.0 }, { name: 'Nizip', lat: 37.01, lng: 37.8 },
    { name: 'Nurdağı', lat: 37.19, lng: 36.76 }, { name: 'Oğuzeli', lat: 36.94, lng: 37.51 },
    { name: 'Şahinbey', lat: 37.04, lng: 37.33 }, { name: 'Şehitkamil', lat: 37.11, lng: 37.38 },
    { name: 'Yavuzeli', lat: 37.33, lng: 37.73 },
  ],
  'Hatay': [
    { name: 'Antakya', lat: 36.2, lng: 36.16 }, { name: 'Arsuz', lat: 36.41, lng: 35.88 },
    { name: 'Belen', lat: 36.49, lng: 36.2 }, { name: 'Defne', lat: 36.17, lng: 36.12 },
    { name: 'Dörtyol', lat: 36.83, lng: 36.23 }, { name: 'Erzin', lat: 36.96, lng: 36.19 },
    { name: 'Hassa', lat: 36.84, lng: 36.53 }, { name: 'İskenderun', lat: 36.59, lng: 36.17 },
    { name: 'Kırıkhan', lat: 37.2, lng: 36.34 }, { name: 'Reyhanlı', lat: 36.27, lng: 36.56 },
    { name: 'Samandağ', lat: 36.09, lng: 35.94 }, { name: 'Yayladağı', lat: 35.97, lng: 36.06 },
  ],
  'Mersin': [
    { name: 'Anamur', lat: 36.08, lng: 32.84 }, { name: 'Aydıncık', lat: 36.14, lng: 33.32 },
    { name: 'Bozyazı', lat: 36.1, lng: 33.0 }, { name: 'Çamlıyayla', lat: 37.0, lng: 34.4 },
    { name: 'Erdemli', lat: 36.61, lng: 34.31 }, { name: 'Gülnar', lat: 36.32, lng: 33.42 },
    { name: 'Mezitli', lat: 36.83, lng: 34.55 }, { name: 'Mut', lat: 36.63, lng: 33.42 },
    { name: 'Silifke', lat: 36.38, lng: 33.93 }, { name: 'Tarsus', lat: 36.92, lng: 34.89 },
    { name: 'Toroslar', lat: 36.83, lng: 34.65 }, { name: 'Yenişehir', lat: 36.77, lng: 34.58 },
    { name: 'Akdeniz', lat: 36.8, lng: 34.62 },
  ],
  'Muğla': [
    { name: 'Bodrum', lat: 37.03, lng: 27.43 }, { name: 'Dalaman', lat: 36.77, lng: 28.8 },
    { name: 'Datça', lat: 36.72, lng: 27.68 }, { name: 'Fethiye', lat: 36.62, lng: 29.12 },
    { name: 'Kavaklıdere', lat: 37.17, lng: 28.4 }, { name: 'Köyceğiz', lat: 36.97, lng: 28.68 },
    { name: 'Marmaris', lat: 36.85, lng: 28.27 }, { name: 'Menteşe', lat: 37.03, lng: 28.36 },
    { name: 'Milas', lat: 37.31, lng: 27.78 }, { name: 'Ortaca', lat: 36.84, lng: 28.72 },
    { name: 'Seydikemer', lat: 36.75, lng: 29.29 }, { name: 'Ula', lat: 37.11, lng: 28.4 },
    { name: 'Yatağan', lat: 37.19, lng: 28.14 },
  ],
  'Manisa': [
    { name: 'Ahmetli', lat: 38.5, lng: 27.85 }, { name: 'Akhisar', lat: 38.92, lng: 27.85 },
    { name: 'Alaşehir', lat: 38.35, lng: 28.52 }, { name: 'Demirci', lat: 38.85, lng: 28.68 },
    { name: 'Gölmarmara', lat: 38.72, lng: 27.99 }, { name: 'Gördes', lat: 38.74, lng: 28.32 },
    { name: 'Kırkağaç', lat: 39.0, lng: 27.67 }, { name: 'Köprübaşı', lat: 38.75, lng: 28.42 },
    { name: 'Kula', lat: 38.55, lng: 28.67 }, { name: 'Salihli', lat: 38.48, lng: 28.13 },
    { name: 'Sarıgöl', lat: 38.27, lng: 28.4 }, { name: 'Saruhanlı', lat: 38.73, lng: 27.58 },
    { name: 'Selendi', lat: 38.75, lng: 28.87 }, { name: 'Soma', lat: 39.19, lng: 27.61 },
    { name: 'Şehzadeler', lat: 38.62, lng: 27.43 }, { name: 'Turgutlu', lat: 38.5, lng: 27.71 },
    { name: 'Yunusemre', lat: 38.61, lng: 27.4 },
  ],
  'Şanlıurfa': [
    { name: 'Akçakale', lat: 36.72, lng: 38.96 }, { name: 'Birecik', lat: 37.03, lng: 38.02 },
    { name: 'Bozova', lat: 37.37, lng: 38.53 }, { name: 'Ceylanpınar', lat: 36.85, lng: 40.05 },
    { name: 'Halfeti', lat: 37.25, lng: 37.87 }, { name: 'Haliliye', lat: 37.16, lng: 38.79 },
    { name: 'Harran', lat: 36.87, lng: 38.98 }, { name: 'Hilvan', lat: 37.57, lng: 38.9 },
    { name: 'Eyyübiye', lat: 37.16, lng: 38.8 }, { name: 'Karaköprü', lat: 37.25, lng: 38.7 },
    { name: 'Siverek', lat: 37.75, lng: 39.34 }, { name: 'Suruç', lat: 37.03, lng: 38.43 },
    { name: 'Viranşehir', lat: 37.24, lng: 39.76 },
  ],
  'Kahramanmaraş': [
    { name: 'Afşin', lat: 38.36, lng: 36.9 }, { name: 'Andırın', lat: 37.57, lng: 36.78 },
    { name: 'Çağlayancerit', lat: 37.7, lng: 37.17 }, { name: 'Dulkadiroğlu', lat: 37.56, lng: 36.94 },
    { name: 'Ekinözü', lat: 37.94, lng: 36.83 }, { name: 'Elbistan', lat: 38.2, lng: 37.19 },
    { name: 'Göksun', lat: 38.02, lng: 36.49 }, { name: 'Nurhak', lat: 37.87, lng: 37.45 },
    { name: 'Onikişubat', lat: 37.6, lng: 36.87 }, { name: 'Pazarcık', lat: 37.39, lng: 37.18 },
    { name: 'Türkoğlu', lat: 37.39, lng: 36.87 },
  ],
  'Samsun': [
    { name: '19 Mayıs', lat: 41.48, lng: 36.15 }, { name: 'Alaçam', lat: 41.6, lng: 35.62 },
    { name: 'Asarcık', lat: 41.29, lng: 36.44 }, { name: 'Atakum', lat: 41.29, lng: 36.28 },
    { name: 'Ayvacık', lat: 41.05, lng: 36.63 }, { name: 'Bafra', lat: 41.56, lng: 35.91 },
    { name: 'Çarşamba', lat: 41.2, lng: 36.49 }, { name: 'Havza', lat: 41.16, lng: 35.67 },
    { name: 'İlkadım', lat: 41.29, lng: 36.33 }, { name: 'Kavak', lat: 41.22, lng: 36.06 },
    { name: 'Ladik', lat: 41.13, lng: 35.9 }, { name: 'Ondokuzmayıs', lat: 41.45, lng: 36.06 },
    { name: 'Salıpazarı', lat: 41.31, lng: 36.75 }, { name: 'Tekkeköy', lat: 41.24, lng: 36.44 },
    { name: 'Terme', lat: 41.22, lng: 36.98 }, { name: 'Vezirköprü', lat: 41.15, lng: 35.55 },
    { name: 'Yakakent', lat: 41.63, lng: 35.55 },
  ],
  'Kayseri': [
    { name: 'Akkışla', lat: 38.94, lng: 36.09 }, { name: 'Bünyan', lat: 38.66, lng: 35.86 },
    { name: 'Develi', lat: 38.38, lng: 35.49 }, { name: 'Felahiye', lat: 39.05, lng: 35.79 },
    { name: 'Hacılar', lat: 38.64, lng: 35.44 }, { name: 'İncesu', lat: 38.62, lng: 35.16 },
    { name: 'Kocasinan', lat: 38.75, lng: 35.49 }, { name: 'Melikgazi', lat: 38.73, lng: 35.47 },
    { name: 'Özvatan', lat: 39.13, lng: 35.71 }, { name: 'Pınarbaşı', lat: 38.71, lng: 36.39 },
    { name: 'Sarıoğlan', lat: 38.99, lng: 35.75 }, { name: 'Sarız', lat: 38.5, lng: 36.36 },
    { name: 'Talas', lat: 38.68, lng: 35.56 }, { name: 'Tomarza', lat: 38.45, lng: 35.79 },
    { name: 'Yahyalı', lat: 38.11, lng: 35.41 }, { name: 'Yeşilhisar', lat: 38.36, lng: 35.11 },
  ],
  'Tekirdağ': [
    { name: 'Çerkezköy', lat: 41.29, lng: 27.96 }, { name: 'Çorlu', lat: 41.16, lng: 27.8 },
    { name: 'Ergene', lat: 41.23, lng: 27.99 }, { name: 'Hayrabolu', lat: 41.22, lng: 26.94 },
    { name: 'Kapaklı', lat: 41.32, lng: 27.98 }, { name: 'Malkara', lat: 40.89, lng: 26.91 },
    { name: 'Marmaraereğlisi', lat: 40.96, lng: 27.51 }, { name: 'Muratlı', lat: 41.16, lng: 27.51 },
    { name: 'Saray', lat: 41.38, lng: 27.93 }, { name: 'Şarköy', lat: 40.61, lng: 27.11 },
    { name: 'Süleymanpaşa', lat: 40.98, lng: 27.51 },
  ],
  'Kocaeli': [
    { name: 'Başiskele', lat: 40.75, lng: 29.62 }, { name: 'Çayırova', lat: 40.84, lng: 29.38 },
    { name: 'Darıca', lat: 40.78, lng: 29.38 }, { name: 'Derince', lat: 40.76, lng: 29.83 },
    { name: 'Dilovası', lat: 40.78, lng: 29.54 }, { name: 'Gebze', lat: 40.8, lng: 29.44 },
    { name: 'Gölcük', lat: 40.72, lng: 29.13 }, { name: 'İzmit', lat: 40.77, lng: 29.92 },
    { name: 'Kandıra', lat: 41.07, lng: 30.16 }, { name: 'Karamürsel', lat: 40.69, lng: 29.24 },
    { name: 'Kartepe', lat: 40.75, lng: 30.03 }, { name: 'Körfez', lat: 40.81, lng: 29.69 },
  ],
  'Trabzon': [
    { name: 'Akçaabat', lat: 41.02, lng: 39.55 }, { name: 'Araklı', lat: 40.94, lng: 40.05 },
    { name: 'Arsin', lat: 40.96, lng: 39.93 }, { name: 'Beşikdüzü', lat: 41.09, lng: 39.42 },
    { name: 'Çarşıbaşı', lat: 41.04, lng: 39.45 }, { name: 'Çaykara', lat: 40.73, lng: 40.23 },
    { name: 'Dernekpazarı', lat: 40.78, lng: 40.25 }, { name: 'Düzköy', lat: 40.87, lng: 39.46 },
    { name: 'Hayrat', lat: 40.87, lng: 40.38 }, { name: 'Köprübaşı', lat: 40.86, lng: 40.17 },
    { name: 'Maçka', lat: 40.81, lng: 39.6 }, { name: 'Of', lat: 40.95, lng: 40.22 },
    { name: 'Ortahisar', lat: 41.0, lng: 39.72 }, { name: 'Sürmene', lat: 40.91, lng: 40.09 },
    { name: 'Şalpazarı', lat: 41.01, lng: 39.32 }, { name: 'Tonya', lat: 40.95, lng: 39.26 },
    { name: 'Vakfıkebir', lat: 41.08, lng: 39.29 }, { name: 'Yomra', lat: 40.96, lng: 39.84 },
  ],
  'Diyarbakır': [
    { name: 'Bağlar', lat: 37.9, lng: 40.22 }, { name: 'Bismil', lat: 37.85, lng: 40.66 },
    { name: 'Çermik', lat: 38.19, lng: 39.31 }, { name: 'Çınar', lat: 37.74, lng: 40.38 },
    { name: 'Çüngüş', lat: 38.28, lng: 39.57 }, { name: 'Dicle', lat: 38.36, lng: 40.17 },
    { name: 'Eğil', lat: 38.1, lng: 40.25 }, { name: 'Ergani', lat: 38.26, lng: 39.76 },
    { name: 'Hani', lat: 38.27, lng: 40.36 }, { name: 'Hazro', lat: 38.37, lng: 40.6 },
    { name: 'Kayapınar', lat: 37.96, lng: 40.21 }, { name: 'Kocaköy', lat: 38.22, lng: 40.09 },
    { name: 'Kulp', lat: 38.38, lng: 41.05 }, { name: 'Lice', lat: 38.46, lng: 40.65 },
    { name: 'Silvan', lat: 38.14, lng: 40.99 }, { name: 'Sur', lat: 37.91, lng: 40.24 },
    { name: 'Yenişehir', lat: 37.93, lng: 40.28 },
  ],
  'Eskişehir': [
    { name: 'Alpu', lat: 39.76, lng: 31.35 }, { name: 'Beylikova', lat: 39.65, lng: 31.63 },
    { name: 'Çifteler', lat: 39.4, lng: 31.41 }, { name: 'Günyüzü', lat: 39.4, lng: 31.79 },
    { name: 'Han', lat: 39.42, lng: 31.9 }, { name: 'İnönü', lat: 39.66, lng: 30.55 },
    { name: 'Mahmudiye', lat: 39.51, lng: 31.36 }, { name: 'Mihalgazi', lat: 39.72, lng: 30.77 },
    { name: 'Mihalıççık', lat: 39.85, lng: 31.48 }, { name: 'Odunpazarı', lat: 39.77, lng: 30.5 },
    { name: 'Sarıcakaya', lat: 40.0, lng: 30.7 }, { name: 'Seyitgazi', lat: 39.45, lng: 30.7 },
    { name: 'Sivrihisar', lat: 39.45, lng: 31.53 }, { name: 'Tepebaşı', lat: 39.78, lng: 30.47 },
  ],
  'Sakarya': [
    { name: 'Adapazarı', lat: 40.78, lng: 30.4 }, { name: 'Akyazı', lat: 40.68, lng: 30.63 },
    { name: 'Ferizli', lat: 40.78, lng: 30.52 }, { name: 'Geyve', lat: 40.5, lng: 30.35 },
    { name: 'Hendek', lat: 40.79, lng: 30.68 }, { name: 'Karapürçek', lat: 40.65, lng: 30.44 },
    { name: 'Karasu', lat: 41.1, lng: 30.68 }, { name: 'Kaynarca', lat: 41.0, lng: 30.58 },
    { name: 'Kocaali', lat: 41.08, lng: 30.83 }, { name: 'Pamukova', lat: 40.53, lng: 30.17 },
    { name: 'Sapanca', lat: 40.69, lng: 30.27 }, { name: 'Serdivan', lat: 40.76, lng: 30.36 },
    { name: 'Söğütlü', lat: 40.72, lng: 30.66 }, { name: 'Taraklı', lat: 40.39, lng: 30.51 },
    { name: 'Erenler', lat: 40.74, lng: 30.43 },
  ],
  'Van': [
    { name: 'Bahçesaray', lat: 38.12, lng: 42.73 }, { name: 'Başkale', lat: 37.85, lng: 44.02 },
    { name: 'Çaldıran', lat: 39.13, lng: 43.97 }, { name: 'Çatak', lat: 38.03, lng: 43.06 },
    { name: 'Edremit', lat: 38.4, lng: 43.33 }, { name: 'Erciş', lat: 39.03, lng: 43.36 },
    { name: 'Gevaş', lat: 38.29, lng: 43.11 }, { name: 'Gürpınar', lat: 38.36, lng: 43.87 },
    { name: 'İpekyolu', lat: 38.51, lng: 43.39 }, { name: 'Muradiye', lat: 39.06, lng: 43.75 },
    { name: 'Özalp', lat: 38.86, lng: 43.9 }, { name: 'Saray', lat: 38.49, lng: 44.11 },
    { name: 'Tuşba', lat: 38.54, lng: 43.3 },
  ],
  'Afyonkarahisar': [
    { name: 'Başmakçı', lat: 38.04, lng: 29.98 }, { name: 'Bayat', lat: 38.72, lng: 31.09 },
    { name: 'Bolvadin', lat: 38.72, lng: 30.96 }, { name: 'Çay', lat: 38.56, lng: 30.99 },
    { name: 'Çobanlar', lat: 38.71, lng: 30.72 }, { name: 'Dazkırı', lat: 38.02, lng: 29.87 },
    { name: 'Dinar', lat: 38.07, lng: 30.16 }, { name: 'Emirdağ', lat: 39.03, lng: 31.15 },
    { name: 'Evciler', lat: 38.04, lng: 29.98 }, { name: 'Hocalar', lat: 38.51, lng: 30.15 },
    { name: 'İhsaniye', lat: 38.75, lng: 30.52 }, { name: 'İscehisar', lat: 38.82, lng: 30.73 },
    { name: 'Kızılören', lat: 38.25, lng: 30.02 }, { name: 'Sandıklı', lat: 38.51, lng: 30.28 },
    { name: 'Sinanpaşa', lat: 38.7, lng: 30.42 }, { name: 'Suhut', lat: 38.53, lng: 30.55 },
    { name: 'Şuhut', lat: 38.53, lng: 30.55 },
  ],
  'Isparta': [
    { name: 'Aksu', lat: 37.85, lng: 30.86 }, { name: 'Atabey', lat: 38.05, lng: 30.64 },
    { name: 'Eğirdir', lat: 37.87, lng: 30.85 }, { name: 'Gelendost', lat: 38.1, lng: 31.01 },
    { name: 'Gönen', lat: 38.03, lng: 30.51 }, { name: 'Keçiborlu', lat: 37.95, lng: 30.3 },
    { name: 'Senirkent', lat: 38.11, lng: 30.54 }, { name: 'Sütçüler', lat: 37.52, lng: 30.85 },
    { name: 'Şarkikaraağaç', lat: 38.08, lng: 31.34 }, { name: 'Uluborlu', lat: 38.04, lng: 30.44 },
    { name: 'Yalvaç', lat: 38.28, lng: 31.17 }, { name: 'Yenişarbademli', lat: 37.77, lng: 31.32 },
  ],
  'Osmaniye': [
    { name: 'Bahçe', lat: 37.21, lng: 36.57 }, { name: 'Düziçi', lat: 37.25, lng: 36.46 },
    { name: 'Hasanbeyli', lat: 37.15, lng: 36.57 }, { name: 'Kadirli', lat: 37.37, lng: 36.1 },
    { name: 'Sumbas', lat: 37.31, lng: 36.26 }, { name: 'Toprakkale', lat: 37.06, lng: 36.15 },
  ],
  'Ordu': [
    { name: 'Akkuş', lat: 40.79, lng: 37.03 }, { name: 'Altınordu', lat: 40.98, lng: 37.88 },
    { name: 'Aybastı', lat: 40.68, lng: 37.39 }, { name: 'Çamaş', lat: 40.92, lng: 37.75 },
    { name: 'Çatalpınar', lat: 40.9, lng: 37.5 }, { name: 'Çaybaşı', lat: 41.02, lng: 37.46 },
    { name: 'Fatsa', lat: 40.97, lng: 37.51 }, { name: 'Gölköy', lat: 40.76, lng: 37.29 },
    { name: 'Gülyalı', lat: 41.04, lng: 38.02 }, { name: 'Gürgentepe', lat: 40.84, lng: 37.38 },
    { name: 'İkizce', lat: 41.06, lng: 37.44 }, { name: 'Kabadüz', lat: 40.85, lng: 37.74 },
    { name: 'Kabataş', lat: 40.71, lng: 37.32 }, { name: 'Korgan', lat: 40.87, lng: 37.28 },
    { name: 'Kumru', lat: 40.87, lng: 37.25 }, { name: 'Mesudiye', lat: 40.49, lng: 37.63 },
    { name: 'Perşembe', lat: 41.06, lng: 37.82 }, { name: 'Ulubey', lat: 40.81, lng: 37.68 },
    { name: 'Ünye', lat: 41.12, lng: 37.28 },
  ],
  'Malatya': [
    { name: 'Akçadağ', lat: 38.35, lng: 37.68 }, { name: 'Arguvan', lat: 38.74, lng: 38.24 },
    { name: 'Battalgazi', lat: 38.39, lng: 38.25 }, { name: 'Darende', lat: 38.56, lng: 37.5 },
    { name: 'Doğanşehir', lat: 38.08, lng: 37.87 }, { name: 'Doğanyol', lat: 38.5, lng: 38.71 },
    { name: 'Hekimhan', lat: 38.97, lng: 37.89 }, { name: 'Kuluncak', lat: 38.9, lng: 37.94 },
    { name: 'Pütürge', lat: 38.18, lng: 38.69 }, { name: 'Yazıhan', lat: 38.55, lng: 38.31 },
    { name: 'Yeşilyurt', lat: 38.44, lng: 38.3 }, { name: 'Arapgir', lat: 39.03, lng: 38.48 },
  ],
  'Erzurum': [
    { name: 'Aşkale', lat: 39.9, lng: 40.68 }, { name: 'Aziziye', lat: 39.98, lng: 41.04 },
    { name: 'Çat', lat: 39.68, lng: 40.6 }, { name: 'Hınıs', lat: 39.37, lng: 41.71 },
    { name: 'Horasan', lat: 40.03, lng: 42.17 }, { name: 'İspir', lat: 40.48, lng: 40.99 },
    { name: 'Karayazı', lat: 39.44, lng: 42.19 }, { name: 'Köprüköy', lat: 39.63, lng: 41.7 },
    { name: 'Narman', lat: 40.39, lng: 41.63 }, { name: 'Oltu', lat: 40.55, lng: 41.99 },
    { name: 'Olur', lat: 40.79, lng: 41.98 }, { name: 'Pasinler', lat: 40.02, lng: 41.68 },
    { name: 'Pazaryolu', lat: 40.66, lng: 40.86 }, { name: 'Şenkaya', lat: 40.52, lng: 42.31 },
    { name: 'Tekman', lat: 39.3, lng: 41.91 }, { name: 'Tortum', lat: 40.68, lng: 41.66 },
    { name: 'Uzundere', lat: 40.58, lng: 41.58 }, { name: 'Yakutiye', lat: 39.91, lng: 41.27 },
    { name: 'Karaçoban', lat: 39.34, lng: 42.1 },
  ],
  'Kastamonu': [
    { name: 'Abana', lat: 41.94, lng: 34.04 }, { name: 'Ağlı', lat: 41.66, lng: 33.71 },
    { name: 'Araç', lat: 41.53, lng: 33.41 }, { name: 'Azdavay', lat: 41.7, lng: 33.24 },
    { name: 'Bozkurt', lat: 41.97, lng: 33.88 }, { name: 'Cide', lat: 41.89, lng: 32.96 },
    { name: 'Çatalzeytin', lat: 41.91, lng: 34.28 }, { name: 'Daday', lat: 41.4, lng: 33.39 },
    { name: 'Devrekani', lat: 41.72, lng: 33.85 }, { name: 'Doğanyurt', lat: 41.87, lng: 33.42 },
    { name: 'Hanönü', lat: 41.62, lng: 33.72 }, { name: 'İhsangazi', lat: 41.42, lng: 33.5 },
    { name: 'İnebolu', lat: 41.98, lng: 33.76 }, { name: 'Küre', lat: 41.85, lng: 33.77 },
    { name: 'Pınarbaşı', lat: 41.67, lng: 33.36 }, { name: 'Şenpazar', lat: 41.8, lng: 33.23 },
    { name: 'Seydiler', lat: 41.72, lng: 33.89 }, { name: 'Taşköprü', lat: 41.53, lng: 34.17 },
    { name: 'Tosya', lat: 41.24, lng: 33.9 },
  ],
  'Uşak': [
    { name: 'Banaz', lat: 38.73, lng: 29.76 }, { name: 'Eşme', lat: 38.4, lng: 29.2 },
    { name: 'Karahallı', lat: 38.24, lng: 29.51 }, { name: 'Sivaslı', lat: 38.5, lng: 29.5 },
    { name: 'Ulubey', lat: 38.45, lng: 29.29 },
  ],
  'Zonguldak': [
    { name: 'Alaplı', lat: 41.18, lng: 31.39 }, { name: 'Çaycuma', lat: 41.42, lng: 32.08 },
    { name: 'Devrek', lat: 41.22, lng: 31.95 }, { name: 'Ereğli', lat: 41.28, lng: 31.42 },
    { name: 'Gökçebey', lat: 41.31, lng: 31.98 }, { name: 'Kilimli', lat: 41.51, lng: 31.5 },
    { name: 'Kozlu', lat: 41.45, lng: 31.72 },
  ],
  'Bolu': [
    { name: 'Dörtdivan', lat: 40.58, lng: 31.86 }, { name: 'Gerede', lat: 40.8, lng: 32.2 },
    { name: 'Göynük', lat: 40.4, lng: 31.11 }, { name: 'Kıbrıscık', lat: 40.44, lng: 31.57 },
    { name: 'Mengen', lat: 40.55, lng: 31.8 }, { name: 'Mudurnu', lat: 40.47, lng: 31.39 },
    { name: 'Seben', lat: 40.4, lng: 31.56 }, { name: 'Yeniçağa', lat: 40.56, lng: 32.02 },
  ],
  'Düzce': [
    { name: 'Akçakoca', lat: 41.09, lng: 31.12 }, { name: 'Cumayeri', lat: 40.88, lng: 30.95 },
    { name: 'Çilimli', lat: 40.89, lng: 31.04 }, { name: 'Gölyaka', lat: 40.78, lng: 31.0 },
    { name: 'Gümüşova', lat: 40.85, lng: 30.99 }, { name: 'Kaynaşlı', lat: 40.78, lng: 31.32 },
    { name: 'Yığılca', lat: 40.97, lng: 31.44 },
  ],
  'Sivas': [
    { name: 'Divriği', lat: 39.38, lng: 38.12 }, { name: 'Gemerek', lat: 39.18, lng: 36.18 },
    { name: 'Gürün', lat: 38.72, lng: 37.27 }, { name: 'Hafik', lat: 39.83, lng: 37.57 },
    { name: 'İmranlı', lat: 39.89, lng: 38.12 }, { name: 'Kangal', lat: 39.22, lng: 37.38 },
    { name: 'Koyulhisar', lat: 40.21, lng: 37.31 }, { name: 'Merkez', lat: 39.75, lng: 37.02 },
    { name: 'Suşehri', lat: 40.17, lng: 38.09 }, { name: 'Şarkışla', lat: 39.36, lng: 36.4 },
    { name: 'Ulaş', lat: 39.55, lng: 37.09 }, { name: 'Yıldızeli', lat: 39.87, lng: 36.78 },
    { name: 'Zara', lat: 39.9, lng: 37.75 }, { name: 'Doğanşar', lat: 40.16, lng: 37.53 },
    { name: 'Gölova', lat: 40.05, lng: 38.28 }, { name: 'Altınyayla', lat: 39.05, lng: 37.09 },
  ],
  'Tokat': [
    { name: 'Almus', lat: 40.36, lng: 36.91 }, { name: 'Artova', lat: 40.1, lng: 36.72 },
    { name: 'Başçiftlik', lat: 40.55, lng: 37.23 }, { name: 'Erbaa', lat: 40.68, lng: 36.57 },
    { name: 'Niksar', lat: 40.59, lng: 36.96 }, { name: 'Pazar', lat: 40.36, lng: 36.36 },
    { name: 'Reşadiye', lat: 40.39, lng: 37.41 }, { name: 'Sulusaray', lat: 40.1, lng: 36.46 },
    { name: 'Turhal', lat: 40.39, lng: 36.09 }, { name: 'Yeşilyurt', lat: 40.06, lng: 36.22 },
    { name: 'Zile', lat: 40.3, lng: 36.73 },
  ],
  'Amasya': [
    { name: 'Göynücek', lat: 40.18, lng: 35.51 }, { name: 'Gümüşhacıköy', lat: 40.87, lng: 35.23 },
    { name: 'Hamamözü', lat: 40.83, lng: 35.53 }, { name: 'Merzifon', lat: 40.87, lng: 35.46 },
    { name: 'Suluova', lat: 40.83, lng: 35.63 }, { name: 'Taşova', lat: 40.76, lng: 36.02 },
  ],
  'Çorum': [
    { name: 'Alaca', lat: 40.17, lng: 34.87 }, { name: 'Bayat', lat: 40.55, lng: 34.13 },
    { name: 'Boğazkale', lat: 40.02, lng: 34.61 }, { name: 'Dodurga', lat: 40.86, lng: 34.72 },
    { name: 'İskilip', lat: 40.83, lng: 34.45 }, { name: 'Kargı', lat: 40.99, lng: 34.56 },
    { name: 'Laçin', lat: 40.51, lng: 34.95 }, { name: 'Mecitözü', lat: 40.57, lng: 35.45 },
    { name: 'Oğuzlar', lat: 40.85, lng: 34.48 }, { name: 'Ortaköy', lat: 40.41, lng: 34.24 },
    { name: 'Osmancık', lat: 40.98, lng: 34.82 }, { name: 'Sungurlu', lat: 40.17, lng: 34.37 },
    { name: 'Uğurludağ', lat: 40.46, lng: 34.46 },
  ],
  'Yozgat': [
    { name: 'Akdağmadeni', lat: 39.66, lng: 35.94 }, { name: 'Aydıncık', lat: 39.81, lng: 35.19 },
    { name: 'Boğazlıyan', lat: 39.19, lng: 35.21 }, { name: 'Çandır', lat: 39.35, lng: 35.45 },
    { name: 'Çayıralan', lat: 39.24, lng: 35.7 }, { name: 'Çekerek', lat: 40.03, lng: 35.48 },
    { name: 'Kadışehri', lat: 39.96, lng: 35.68 }, { name: 'Sarıkaya', lat: 39.47, lng: 35.37 },
    { name: 'Sorgun', lat: 39.81, lng: 35.19 }, { name: 'Şefaatli', lat: 39.55, lng: 35.14 },
    { name: 'Yenifakılı', lat: 39.17, lng: 35.07 }, { name: 'Yerköy', lat: 39.64, lng: 34.48 },
    { name: 'Saraykent', lat: 39.9, lng: 35.55 },
  ],
  'Nevşehir': [
    { name: 'Acıgöl', lat: 38.55, lng: 34.53 }, { name: 'Avanos', lat: 38.71, lng: 34.84 },
    { name: 'Derinkuyu', lat: 38.37, lng: 34.73 }, { name: 'Gülşehir', lat: 38.74, lng: 34.63 },
    { name: 'Hacıbektaş', lat: 38.94, lng: 34.54 }, { name: 'Kozaklı', lat: 39.05, lng: 34.53 },
    { name: 'Ürgüp', lat: 38.63, lng: 34.91 },
  ],
  'Niğde': [
    { name: 'Altunhisar', lat: 38.11, lng: 34.36 }, { name: 'Bor', lat: 37.89, lng: 34.56 },
    { name: 'Çamardı', lat: 37.76, lng: 35.06 }, { name: 'Çiftlik', lat: 38.14, lng: 34.45 },
    { name: 'Ulukışla', lat: 37.53, lng: 34.48 },
  ],
  'Aksaray': [
    { name: 'Ağaçören', lat: 38.69, lng: 33.86 }, { name: 'Eskil', lat: 38.24, lng: 33.4 },
    { name: 'Gülağaç', lat: 38.32, lng: 34.24 }, { name: 'Güzelyurt', lat: 38.28, lng: 34.31 },
    { name: 'Ortaköy', lat: 38.74, lng: 34.04 }, { name: 'Sarıyahşi', lat: 38.74, lng: 33.83 },
    { name: 'Sultanhanı', lat: 38.26, lng: 33.51 },
  ],
  'Karaman': [
    { name: 'Ayrancı', lat: 37.38, lng: 33.06 }, { name: 'Başyayla', lat: 36.95, lng: 32.65 },
    { name: 'Ermenek', lat: 36.61, lng: 32.87 }, { name: 'Kazımkarabekir', lat: 37.26, lng: 32.85 },
    { name: 'Sarıveliler', lat: 36.83, lng: 32.71 },
  ],
  'Kütahya': [
    { name: 'Altıntaş', lat: 38.9, lng: 29.95 }, { name: 'Aslanapa', lat: 39.17, lng: 29.47 },
    { name: 'Çavdarhisar', lat: 39.19, lng: 29.63 }, { name: 'Domaniç', lat: 39.39, lng: 29.58 },
    { name: 'Dumlupınar', lat: 38.91, lng: 29.88 }, { name: 'Emet', lat: 39.33, lng: 29.25 },
    { name: 'Gediz', lat: 38.99, lng: 29.4 }, { name: 'Hisarcık', lat: 39.16, lng: 29.14 },
    { name: 'Pazarlar', lat: 38.94, lng: 29.3 }, { name: 'Simav', lat: 39.09, lng: 28.98 },
    { name: 'Şaphane', lat: 39.12, lng: 29.16 }, { name: 'Tavşanlı', lat: 39.29, lng: 29.49 },
  ],
  'Bilecik': [
    { name: 'Bozüyük', lat: 39.9, lng: 30.04 }, { name: 'Gölpazarı', lat: 40.18, lng: 30.47 },
    { name: 'İnhisar', lat: 40.21, lng: 30.55 }, { name: 'Osmaneli', lat: 40.36, lng: 30.51 },
    { name: 'Pazaryeri', lat: 40.05, lng: 30.29 }, { name: 'Söğüt', lat: 40.01, lng: 30.18 },
    { name: 'Yenipazar', lat: 40.25, lng: 30.35 },
  ],
  'Edirne': [
    { name: 'Enez', lat: 40.73, lng: 26.09 }, { name: 'Havsa', lat: 41.56, lng: 26.73 },
    { name: 'İpsala', lat: 40.92, lng: 26.35 }, { name: 'Keşan', lat: 40.86, lng: 26.64 },
    { name: 'Lalapaşa', lat: 41.63, lng: 26.7 }, { name: 'Meriç', lat: 41.19, lng: 26.42 },
    { name: 'Süloğlu', lat: 41.55, lng: 26.88 }, { name: 'Uzunköprü', lat: 41.27, lng: 26.7 },
  ],
  'Kırklareli': [
    { name: 'Babaeski', lat: 41.44, lng: 27.11 }, { name: 'Demirköy', lat: 41.81, lng: 27.92 },
    { name: 'Kofçaz', lat: 41.98, lng: 27.51 }, { name: 'Lüleburgaz', lat: 41.4, lng: 27.36 },
    { name: 'Pehlivanköy', lat: 41.24, lng: 26.99 }, { name: 'Pınarhisar', lat: 41.64, lng: 27.48 },
    { name: 'Vize', lat: 41.57, lng: 27.75 },
  ],
  'Yalova': [
    { name: 'Altınova', lat: 40.57, lng: 29.5 }, { name: 'Armutlu', lat: 40.53, lng: 28.86 },
    { name: 'Çınarcık', lat: 40.65, lng: 29.11 }, { name: 'Çiftlikköy', lat: 40.65, lng: 29.28 },
    { name: 'Termal', lat: 40.63, lng: 29.17 },
  ],
  'Kırıkkale': [
    { name: 'Bahşılı', lat: 39.75, lng: 33.63 }, { name: 'Balışeyh', lat: 39.8, lng: 33.84 },
    { name: 'Çelebi', lat: 39.46, lng: 33.51 }, { name: 'Delice', lat: 39.9, lng: 34.02 },
    { name: 'Karakeçili', lat: 39.63, lng: 33.44 }, { name: 'Keskin', lat: 39.68, lng: 33.62 },
    { name: 'Sulakyurt', lat: 40.09, lng: 33.68 }, { name: 'Yahşihan', lat: 39.86, lng: 33.71 },
  ],
  'Kırşehir': [
    { name: 'Akpınar', lat: 39.47, lng: 34.28 },
    { name: 'Boztepe', lat: 39.44, lng: 34.4 }, { name: 'Çiçekdağı', lat: 39.61, lng: 34.31 },
    { name: 'Kaman', lat: 39.35, lng: 33.74 }, { name: 'Mucur', lat: 39.06, lng: 34.39 },
  ],
  'Ağrı': [
    { name: 'Diyadin', lat: 39.54, lng: 43.68 }, { name: 'Doğubayazıt', lat: 39.55, lng: 44.06 },
    { name: 'Eleşkirt', lat: 39.68, lng: 42.81 }, { name: 'Hamur', lat: 39.5, lng: 43.05 },
    { name: 'Patnos', lat: 39.24, lng: 42.87 }, { name: 'Taşlıçay', lat: 39.45, lng: 43.51 },
    { name: 'Tutak', lat: 39.18, lng: 42.78 },
  ],
  'Iğdır': [
    { name: 'Aralık', lat: 39.9, lng: 44.5 }, { name: 'Karakoyunlu', lat: 40.03, lng: 43.98 },
    { name: 'Tuzluca', lat: 40.05, lng: 43.66 },
  ],
  'Kars': [
    { name: 'Akyaka', lat: 40.72, lng: 43.59 }, { name: 'Arpaçay', lat: 40.76, lng: 43.4 },
    { name: 'Digor', lat: 40.37, lng: 43.44 }, { name: 'Kağızman', lat: 40.17, lng: 43.16 },
    { name: 'Sarıkamış', lat: 40.33, lng: 42.56 }, { name: 'Selim', lat: 40.46, lng: 43.4 },
    { name: 'Susuz', lat: 40.76, lng: 43.08 },
  ],
  'Ardahan': [
    { name: 'Çıldır', lat: 41.15, lng: 43.29 }, { name: 'Damal', lat: 41.33, lng: 42.83 },
    { name: 'Göle', lat: 40.81, lng: 42.66 }, { name: 'Hanak', lat: 41.23, lng: 42.83 },
    { name: 'Posof', lat: 41.51, lng: 42.72 },
  ],
  'Artvin': [
    { name: 'Ardanuç', lat: 41.12, lng: 42.06 }, { name: 'Arhavi', lat: 41.31, lng: 41.68 },
    { name: 'Borçka', lat: 41.37, lng: 41.84 }, { name: 'Hopa', lat: 41.39, lng: 41.43 },
    { name: 'Kemalpaşa', lat: 41.37, lng: 41.44 }, { name: 'Murgul', lat: 41.24, lng: 41.81 },
    { name: 'Şavşat', lat: 41.25, lng: 42.35 }, { name: 'Yusufeli', lat: 40.82, lng: 41.79 },
  ],
  'Rize': [
    { name: 'Ardeşen', lat: 41.19, lng: 41.15 }, { name: 'Çamlıhemşin', lat: 41.04, lng: 41.06 },
    { name: 'Çayeli', lat: 41.09, lng: 40.9 }, { name: 'Derepazarı', lat: 41.06, lng: 40.79 },
    { name: 'Fındıklı', lat: 41.27, lng: 41.13 }, { name: 'Güneysu', lat: 40.96, lng: 40.81 },
    { name: 'Hemşin', lat: 41.06, lng: 41.0 }, { name: 'İkizdere', lat: 40.8, lng: 40.63 },
    { name: 'İyidere', lat: 41.06, lng: 40.79 }, { name: 'Kalkandere', lat: 41.04, lng: 40.68 },
    { name: 'Pazar', lat: 41.18, lng: 40.9 },
  ],
  'Giresun': [
    { name: 'Alucra', lat: 40.31, lng: 38.73 }, { name: 'Bulancak', lat: 40.93, lng: 38.24 },
    { name: 'Çamoluk', lat: 40.32, lng: 38.83 }, { name: 'Çanakçı', lat: 40.87, lng: 38.81 },
    { name: 'Dereli', lat: 40.63, lng: 38.45 }, { name: 'Doğankent', lat: 40.86, lng: 38.65 },
    { name: 'Espiye', lat: 40.96, lng: 38.71 }, { name: 'Eynesil', lat: 41.15, lng: 38.87 },
    { name: 'Görele', lat: 41.03, lng: 38.82 }, { name: 'Güce', lat: 40.8, lng: 38.6 },
    { name: 'Keşap', lat: 40.82, lng: 38.5 }, { name: 'Piraziz', lat: 40.87, lng: 38.4 },
    { name: 'Şebinkarahisar', lat: 40.29, lng: 38.42 }, { name: 'Tirebolu', lat: 41.0, lng: 38.79 },
  ],
  'Gümüşhane': [
    { name: 'Kelkit', lat: 40.14, lng: 39.34 }, { name: 'Köse', lat: 40.21, lng: 39.66 },
    { name: 'Kürtün', lat: 40.58, lng: 39.16 }, { name: 'Şiran', lat: 40.19, lng: 39.1 },
    { name: 'Torul', lat: 40.51, lng: 39.3 },
  ],
  'Bingöl': [
    { name: 'Adaklı', lat: 39.16, lng: 40.39 }, { name: 'Genç', lat: 38.75, lng: 40.51 },
    { name: 'Karlıova', lat: 39.28, lng: 41.03 }, { name: 'Kiğı', lat: 39.22, lng: 40.25 },
    { name: 'Solhan', lat: 38.96, lng: 41.05 }, { name: 'Yayladere', lat: 38.98, lng: 40.44 },
    { name: 'Yedisu', lat: 39.33, lng: 40.54 },
  ],
  'Muş': [
    { name: 'Bulanık', lat: 38.88, lng: 42.13 }, { name: 'Hasköy', lat: 38.67, lng: 41.72 },
    { name: 'Korkut', lat: 38.82, lng: 41.7 }, { name: 'Malazgirt', lat: 39.14, lng: 42.54 },
    { name: 'Varto', lat: 39.17, lng: 41.46 },
  ],
  'Bitlis': [
    { name: 'Adilcevaz', lat: 38.8, lng: 42.75 }, { name: 'Ahlat', lat: 38.75, lng: 42.48 },
    { name: 'Güroymak', lat: 38.58, lng: 42.18 }, { name: 'Hizan', lat: 38.24, lng: 42.43 },
    { name: 'Mutki', lat: 38.42, lng: 42.13 }, { name: 'Tatvan', lat: 38.5, lng: 42.28 },
  ],
  'Siirt': [
    { name: 'Baykan', lat: 38.08, lng: 41.83 }, { name: 'Eruh', lat: 37.75, lng: 42.0 },
    { name: 'Kurtalan', lat: 37.94, lng: 41.84 }, { name: 'Pervari', lat: 37.9, lng: 42.44 },
    { name: 'Şirvan', lat: 37.93, lng: 42.24 }, { name: 'Tillo', lat: 37.9, lng: 41.94 },
  ],
  'Batman': [
    { name: 'Beşiri', lat: 37.88, lng: 41.19 }, { name: 'Gercüş', lat: 37.57, lng: 41.37 },
    { name: 'Hasankeyf', lat: 37.71, lng: 41.42 }, { name: 'Kozluk', lat: 38.19, lng: 41.5 },
    { name: 'Sason', lat: 38.09, lng: 41.71 },
  ],
  'Şırnak': [
    { name: 'Beytüşşebap', lat: 37.53, lng: 43.24 }, { name: 'Cizre', lat: 37.33, lng: 42.19 },
    { name: 'Güçlükonak', lat: 37.43, lng: 42.1 }, { name: 'İdil', lat: 37.34, lng: 41.88 },
    { name: 'Silopi', lat: 37.27, lng: 42.47 }, { name: 'Uludere', lat: 37.38, lng: 42.84 },
  ],
  'Mardin': [
    { name: 'Artuklu', lat: 37.31, lng: 40.74 }, { name: 'Dargeçit', lat: 37.54, lng: 41.74 },
    { name: 'Derik', lat: 37.33, lng: 40.66 }, { name: 'Kızıltepe', lat: 37.19, lng: 40.58 },
    { name: 'Mazıdağı', lat: 37.45, lng: 40.47 }, { name: 'Midyat', lat: 37.42, lng: 41.35 },
    { name: 'Nusaybin', lat: 37.07, lng: 41.22 }, { name: 'Ömerli', lat: 37.4, lng: 40.97 },
    { name: 'Savur', lat: 37.54, lng: 40.85 }, { name: 'Yeşilli', lat: 37.37, lng: 40.8 },
  ],
  'Hakkâri': [
    { name: 'Çukurca', lat: 37.35, lng: 44.24 }, { name: 'Şemdinli', lat: 37.5, lng: 44.55 },
    { name: 'Yüksekova', lat: 37.54, lng: 44.28 },
  ],
  'Elazığ': [
    { name: 'Ağın', lat: 38.79, lng: 38.94 }, { name: 'Alacakaya', lat: 38.37, lng: 39.27 },
    { name: 'Arıcak', lat: 38.44, lng: 39.44 }, { name: 'Baskil', lat: 38.55, lng: 38.82 },
    { name: 'Karakoçan', lat: 39.0, lng: 39.55 }, { name: 'Keban', lat: 38.77, lng: 38.76 },
    { name: 'Kovancılar', lat: 38.73, lng: 39.65 }, { name: 'Maden', lat: 38.44, lng: 39.33 },
    { name: 'Palu', lat: 38.71, lng: 39.95 }, { name: 'Sivrice', lat: 38.47, lng: 38.96 },
  ],
  'Tunceli': [
    { name: 'Çemişgezek', lat: 39.06, lng: 39.05 }, { name: 'Hozat', lat: 39.24, lng: 39.33 },
    { name: 'Mazgirt', lat: 39.13, lng: 39.56 }, { name: 'Nazımiye', lat: 39.32, lng: 39.71 },
    { name: 'Ovacık', lat: 39.32, lng: 39.21 }, { name: 'Pertek', lat: 39.34, lng: 39.34 },
    { name: 'Pülümür', lat: 39.55, lng: 39.52 },
  ],
  'Erzincan': [
    { name: 'Çayırlı', lat: 39.54, lng: 39.72 }, { name: 'İliç', lat: 39.45, lng: 38.6 },
    { name: 'Kemah', lat: 39.62, lng: 39.04 }, { name: 'Kemaliye', lat: 39.25, lng: 38.5 },
    { name: 'Otlukbeli', lat: 39.67, lng: 39.93 }, { name: 'Refahiye', lat: 39.88, lng: 38.79 },
    { name: 'Tercan', lat: 39.77, lng: 40.38 }, { name: 'Üzümlü', lat: 39.57, lng: 39.52 },
  ],
  'Kilis': [
    { name: 'Elbeyli', lat: 36.69, lng: 37.35 }, { name: 'Musabeyli', lat: 36.88, lng: 37.05 },
    { name: 'Polateli', lat: 36.87, lng: 37.24 },
  ],
  'Burdur': [
    { name: 'Ağlasun', lat: 37.02, lng: 30.68 }, { name: 'Altınyayla', lat: 36.98, lng: 29.86 },
    { name: 'Bucak', lat: 37.46, lng: 30.59 }, { name: 'Çavdır', lat: 37.09, lng: 29.85 },
    { name: 'Çeltikçi', lat: 37.14, lng: 30.09 }, { name: 'Gölhisar', lat: 36.95, lng: 29.71 },
    { name: 'Karamanlı', lat: 37.33, lng: 29.8 }, { name: 'Kemer', lat: 37.23, lng: 30.27 },
    { name: 'Tefenni', lat: 37.31, lng: 29.76 }, { name: 'Yeşilova', lat: 37.49, lng: 29.64 },
  ],
  'Bayburt': [
    { name: 'Aydıntepe', lat: 40.36, lng: 40.09 }, { name: 'Demirözü', lat: 40.07, lng: 40.05 },
  ],
  'Karabük': [
    { name: 'Eflani', lat: 41.43, lng: 32.87 }, { name: 'Eskipazar', lat: 40.96, lng: 32.53 },
    { name: 'Ovacık', lat: 41.22, lng: 32.44 }, { name: 'Safranbolu', lat: 41.25, lng: 32.69 },
    { name: 'Yenice', lat: 41.2, lng: 32.35 },
  ],
  'Bartın': [
    { name: 'Amasra', lat: 41.75, lng: 32.39 }, { name: 'Kurucaşile', lat: 41.85, lng: 32.56 },
    { name: 'Ulus', lat: 41.59, lng: 32.72 },
  ],
  'Sinop': [
    { name: 'Ayancık', lat: 42.03, lng: 34.82 }, { name: 'Boyabat', lat: 41.47, lng: 34.77 },
    { name: 'Dikmen', lat: 41.69, lng: 35.04 }, { name: 'Durağan', lat: 41.37, lng: 34.86 },
    { name: 'Erfelek', lat: 41.68, lng: 34.94 }, { name: 'Gerze', lat: 41.8, lng: 35.25 },
    { name: 'Saraydüzü', lat: 41.43, lng: 34.99 }, { name: 'Türkeli', lat: 42.02, lng: 34.61 },
  ],
};

export function normalizeQuery(q: string): string {
  return q
    .trim()
    .toLowerCase()
    .replace(/i/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

// Kelime bazlı eşleştirme için normalleştirilmiş arama
function matches(haystack: string, needle: string): boolean {
  return normalizeQuery(haystack).includes(normalizeQuery(needle));
}

export function searchPlaces(
  query: string,
  cities: string[],
  cityCoords: Record<string, { lat: number; lng: number }>,
  limit = 7,
): PlaceMatch[] {
  const q = query.trim();
  if (!q) return [];
  const results: PlaceMatch[] = [];
  for (const city of cities) {
    if (matches(city, q) && cityCoords[city]) {
      results.push({
        label: city,
        province: city,
        lat: cityCoords[city].lat,
        lng: cityCoords[city].lng,
        kind: 'city',
      });
    }
  }
  for (const [province, districts] of Object.entries(DISTRICTS)) {
    for (const d of districts) {
      if (matches(d.name, q)) {
        results.push({ label: `${d.name}, ${province}`, province, lat: d.lat, lng: d.lng, kind: 'district' });
      }
      if (results.length >= limit * 3) break;
    }
  }
  // İlçeler önce, iler sonra; harf sırasına göre
  const districts = results.filter((r) => r.kind === 'district').sort((a, b) => a.label.localeCompare(b.label, 'tr'));
  const cityHits = results.filter((r) => r.kind === 'city').sort((a, b) => a.label.localeCompare(b.label, 'tr'));
  return [...cityHits, ...districts].slice(0, limit);
}

/** Serbest metin konumu ("Ceyhan", "Ceyhan Adana" vb.) koordinata çevirir. */
export function resolvePlaceCoords(
  text: string,
  cityCoords: Record<string, { lat: number; lng: number }>,
): { lat: number; lng: number } | null {
  const q = text.trim();
  if (!q) return null;
  for (const [city, coords] of Object.entries(cityCoords)) {
    if (matches(city, q)) return coords;
  }
  for (const districts of Object.values(DISTRICTS)) {
    for (const d of districts) {
      if (matches(d.name, q)) return { lat: d.lat, lng: d.lng };
    }
  }
  return null;
}
