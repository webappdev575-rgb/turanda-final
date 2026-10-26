ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS is_breaking boolean NOT NULL DEFAULT false;

UPDATE news_articles SET is_breaking = true
WHERE title IN (
  'Buğday fiyatları bu yıl %15 artış gösterdi',
  'Tarım Bakanlığı''ndan yeni destek açıklaması'
);

INSERT INTO news_articles (title, summary, category, region, published_at, source_type, is_breaking) VALUES
('Kuru fasulye ve nohutta arz açığı kapanıyor', 'Ticaret borsası verilerine göre kuru baklagil stokları geçen aya göre %18 arttı. Fiyatlar normalleşme sinyali veriyor.', 'market', 'İç Anadolu', now() - interval '5 hours', 'rss', true),
('İnek sütü fiyatına zambak ayarı geldi', 'Ulusal Süt Konseyi, çiftçi kapısında ham süt fiyatını litre başına 19,75 ₺ olarak açıkladı. Tüketici fiyatlarına yansıması yavaş bekleniyor.', 'market', 'all', now() - interval '1 day', 'rss', false),
('Domates üretiminde sera dönemi başladı', 'Antalya ve Mersin''de kışlık domates üretimi seralarda başladı. Erken hasatta kalite yüksek, fiyatlar dengeli seyrediyor.', 'general', 'Akdeniz', now() - interval '1 day 3 hours', 'rss', false),
('Şeker pancarında hasat rekoru bekleniyor', 'Konya, Eskişehir ve Erzurum''da pancar hasadı hız kazandı. Türkiye Şeker Fabrikaları verimin geçen yılı geride bırakacağını açıkladı.', 'market', 'İç Anadolu', now() - interval '2 days', 'rss', false),
('Rize''de çay sezonu erken açıldı', 'Sıcak hava dalgası nedeniyle çay toplama sezonu bir hafta erken başladı. Yaş çay alım fiyatı üreticileri memnun etti.', 'general', 'Karadeniz', now() - interval '2 days 5 hours', 'rss', false),
('İnek sütü üretiminde bölgesel destek genişletiliyor', 'Tarım Bakanlığı, süt hayvancılığı yapılan 12 ile yeni yatırım desteği açtı. Modern ahır ve soğutma tankı hibeleri kapsam dahilinde.', 'policy', 'all', now() - interval '3 days', 'rss', false),
('Domates fiyatları yaz ortasında istikrar kazandı', 'Yurt genelinde domates kile fiyatı mevsimsel ortalamasında seyrediyor. Sera ve açık tarım arzı dengede.', 'market', 'Akdeniz', now() - interval '3 days 2 hours', 'rss', false);
