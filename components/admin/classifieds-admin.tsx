'use client';

import { useState } from 'react';
import { Tractor, ShoppingCart, Wrench, Calendar, MapPin, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Listing {
  id: string;
  title: string;
  price: string;
  location: string;
  date: string;
  image: string;
  category: string;
}

const EQUIPMENT_LISTINGS: Listing[] = [
  { id: '1', title: 'John Deere 5075E Traktör (2021)', price: '₺1,850,000', location: 'Konya', date: '2026-10-22', image: 'https://images.pexels.com/photos/159306/agriculture-machine-grain-harvest-159306.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'Traktör' },
  { id: '2', title: 'New Holland BB9050 Balya Makinesi', price: '₺320,000', location: 'Tekirdağ', date: '2026-10-20', image: 'https://images.pexels.com/photos/159306/agriculture-machine-grain-harvest-159306.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'Balya Makinesi' },
  { id: '3', title: 'Case IH Puma 240 CVX (2020)', price: '₺2,100,000', location: 'Adana', date: '2026-10-19', image: 'https://images.pexels.com/photos/159306/agriculture-machine-grain-harvest-159306.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'Traktör' },
  { id: '4', title: 'Kuhn HR 4004 Diskli Tırmık', price: '₺145,000', location: 'Bursa', date: '2026-10-18', image: 'https://images.pexels.com/photos/159306/agriculture-machine-grain-harvest-159306.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'Toprak İşleme' },
  { id: '5', title: 'Lemken Rubin 12 Kültekit', price: '₺89,000', location: 'İzmir', date: '2026-10-17', image: 'https://images.pexels.com/photos/159306/agriculture-machine-grain-harvest-159306.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'Toprak İşleme' },
  { id: '6', title: 'Massey Ferguson 8S.265 (2022)', price: '₺2,450,000', location: 'Şanlıurfa', date: '2026-10-15', image: 'https://images.pexels.com/photos/159306/agriculture-machine-grain-harvest-159306.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'Traktör' },
];

const MARKET_LISTINGS: Listing[] = [
  { id: '1', title: '40 Dönüm Buğday Ekili Tarla Satılık', price: '₺1,200,000', location: 'Konya', date: '2026-10-22', image: 'https://images.pexels.com/photos/4407315/pexels-photo-4407315.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'Tarla Satılık' },
  { id: '2', title: 'Süt İnekliği Çiftliği (50 Baş)', price: '₺3,500,000', location: 'Bursa', date: '2026-10-21', image: 'https://images.pexels.com/photos/162805/cows-pasture-organic-nature-162805.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'Çiftlik Satılık' },
  { id: '3', title: '120 Dönüm Sulanabilir Arazi', price: '₺2,800,000', location: 'Adana', date: '2026-10-20', image: 'https://images.pexels.com/photos/4407315/pexels-photo-4407315.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'Tarla Satılık' },
  { id: '4', title: 'Seracılık Tesisi (2 Dönüm)', price: '₺650,000', location: 'Antalya', date: '2026-10-19', image: 'https://images.pexels.com/photos/4503276/pexels-photo-4503276.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'Sera Satılık' },
  { id: '5', title: '50 Ton Buğday Toptan Satılık', price: '₺6,500/ton', location: 'Tekirdağ', date: '2026-10-18', image: 'https://images.pexels.com/photos/2355545/pexels-photo-2355545.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'Ürün Satılık' },
  { id: '6', title: 'Zeytinyağı 5 Ton Stok', price: '₺185/litre', location: 'İzmir', date: '2026-10-17', image: 'https://images.pexels.com/photos/4407315/pexels-photo-4407315.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'Ürün Satılık' },
];

function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Card className="group overflow-hidden rounded-xl border border-border/60 transition-all hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={listing.image}
          alt={listing.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <Badge className="absolute left-2 top-2 bg-white/90 text-xs text-foreground shadow-sm">
          {listing.category}
        </Badge>
      </div>
      <div className="space-y-2 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">{listing.title}</h3>
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-primary">{listing.price}</p>
          <span className="text-xs text-muted-foreground">{listing.date}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {listing.location}
        </div>
      </div>
    </Card>
  );
}

function ListingGrid({ listings }: { listings: Listing[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}

function ComingSoonBanner({ icon: Icon, title, subtitle }: { icon: typeof Tractor; title: string; subtitle: string }) {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
      <Icon className="h-5 w-5 shrink-0 text-primary" />
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

export function ClassifiedsAdmin() {
  const [search, setSearch] = useState('');

  const filteredEquipment = EQUIPMENT_LISTINGS.filter((l) =>
    l.title.toLowerCase().includes(search.toLowerCase()) || l.location.toLowerCase().includes(search.toLowerCase())
  );
  const filteredMarket = MARKET_LISTINGS.filter((l) =>
    l.title.toLowerCase().includes(search.toLowerCase()) || l.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Wrench className="h-5 w-5 text-primary" />
            İlanlar (Coming Soon)
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ekipman kiralama ve pazar ilanları — admin önizleme modunda
          </p>
        </div>
        <Input
          placeholder="İlan ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <Tabs defaultValue="equipment" className="w-full">
        <TabsList className="mb-6 flex h-auto flex-wrap gap-1">
          <TabsTrigger value="equipment" className="gap-1.5">
            <Tractor className="h-4 w-4" />
            Ekipman Kiralama
          </TabsTrigger>
          <TabsTrigger value="market" className="gap-1.5">
            <ShoppingCart className="h-4 w-4" />
            Pazar İlanları
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="space-y-4">
          <ComingSoonBanner
            icon={Tractor}
            title="Ekipman Kiralama — Yakında"
            subtitle="Çiftçiler traktör, hasat makinesi ve tarım ekipmanlarını kiralayabilecek veya kiralık verebilecek. Bu sayfa admin önizleme modundadır ve yayınlanmamıştır."
          />
          <ListingGrid listings={filteredEquipment} />
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          <ComingSoonBanner
            icon={ShoppingCart}
            title="Pazar İlanları — Yakında"
            subtitle="Tarım arazileri, çiftlikler, ürünler ve sera ilanları. Bu sayfa admin önizleme modundadır ve yayınlanmamıştır."
          />
          <ListingGrid listings={filteredMarket} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
