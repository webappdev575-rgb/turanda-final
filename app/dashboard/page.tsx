'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Cloud, MapPin, TrendingUp, Newspaper, Loader2,
  LocateFixed, Save, User as UserIcon, Settings, CloudRain, Sun, CloudSun,
  GraduationCap, ArrowRight, MessageSquare,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/auth-provider';
import { useI18n } from '@/components/i18n-provider';
import { VerifiedBadge, VerificationPrompt } from '@/components/auth/verified-badge';
import { useWeather, getWeatherDescription } from '@/hooks/use-weather';
import { useCommodities } from '@/hooks/use-commodities';
import { useNews, localizedNewsTitle, localizedNewsSummary } from '@/hooks/use-news';
import { useMyEnrollments } from '@/hooks/use-academy';
import { TURKEY_CITIES, CITY_COORDS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { AdSpace } from '@/components/ads/ad-space';
import { DocumentManager } from '@/components/profile/document-manager';
import { MyAlerts } from '@/components/notifications/my-alerts';
import { FileText } from 'lucide-react';
import { useMessages } from '@/hooks/use-messages';
import { Switch } from '@/components/ui/switch';

const weatherIcons: Record<number, React.ComponentType<{ className?: string }>> = {
  0: Sun, 1: Sun, 2: CloudSun, 3: Cloud, 45: Cloud, 48: Cloud,
  51: CloudRain, 53: CloudRain, 55: CloudRain, 61: CloudRain, 63: CloudRain,
  65: CloudRain, 71: CloudRain, 73: CloudRain, 75: CloudRain,
  80: CloudRain, 81: CloudRain, 95: CloudRain, 96: CloudRain,
};

export default function DashboardPage() {
  const { user, profile, loading: authLoading, updateProfile } = useAuth();
  const { t, locale } = useI18n();
  const router = useRouter();

  const [showProfile, setShowProfile] = useState(false);
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState<'worker' | 'farmer' | 'business'>('worker');
  const [city, setCity] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [preferredLang, setPreferredLang] = useState<'tr' | 'en' | 'ar'>('tr');
  const [notifEmail, setNotifEmail] = useState('');
  const [weatherLocation, setWeatherLocation] = useState('');
  const [emailMsgNotifs, setEmailMsgNotifs] = useState(true);
  const [msgNotifEmail, setMsgNotifEmail] = useState('');
  const [employerMessage, setEmployerMessage] = useState('');

  const { conversations, unreadCount } = useMessages(user?.id || null);

  const { enrollments, loading: enrollLoading } = useMyEnrollments();

  const lat = profile?.latitude;
  const lng = profile?.longitude;
  const { weather, loading: weatherLoading } = useWeather(lat ?? undefined, lng ?? undefined);
  const { exchanges, prices } = useCommodities();
  const { articles, loading: newsLoading } = useNews(profile?.region || undefined);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setUserType(profile.user_type);
      setCity(profile.city || '');
      setPreferredLang(profile.preferred_language || 'tr');
      setNotifEmail(profile.notification_email || '');
      setWeatherLocation(profile.weather_location || '');
      setEmailMsgNotifs(profile.email_message_notifications !== false);
      setMsgNotifEmail(profile.message_notification_email || '');
      setEmployerMessage(profile.employer_message || '');
    }
  }, [profile]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  // Find local prices for user's region
  const localExchanges = profile?.region
    ? exchanges.filter((ex) => ex.region === profile.region)
    : exchanges;

  const localPrices = prices.filter((p) => {
    if (!localExchanges.some((ex) => ex.id === p.exchange_id)) return false;
    // Only latest price per commodity
    return true;
  }).sort((a, b) => new Date(b.recorded_date).getTime() - new Date(a.recorded_date).getTime());

  // Deduplicate by commodity name, keep latest
  const seenCommodities = new Set<string>();
  const uniqueLocalPrices = localPrices.filter((p) => {
    if (seenCommodities.has(p.commodity_name)) return false;
    seenCommodities.add(p.commodity_name);
    return true;
  }).slice(0, 6);

  const handleAutoDetect = () => {
    setDetecting(true);
    if (!navigator.geolocation) {
      setDetecting(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      // Find nearest city
      let nearestCity = '';
      let minDist = Infinity;
      for (const [cityName, coords] of Object.entries(CITY_COORDS)) {
        const dist = Math.sqrt(
          (coords.lat - latitude) ** 2 + (coords.lng - longitude) ** 2
        );
        if (dist < minDist) {
          minDist = dist;
          nearestCity = cityName;
        }
      }
      if (nearestCity) setCity(nearestCity);
      setDetecting(false);
    },
    () => setDetecting(false),
    { timeout: 10000 }
    );
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const coords = city ? CITY_COORDS[city] : null;
    const region = localExchanges.length > 0 && profile?.region
      ? profile.region
      : coords ? (exchanges.find((ex) => ex.city === city)?.region || '') : '';

    await updateProfile({
      full_name: fullName,
      user_type: userType,
      city,
      region,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      preferred_language: preferredLang,
      notification_email: notifEmail || null,
      weather_location: weatherLocation || null,
      email_message_notifications: emailMsgNotifs,
      message_notification_email: msgNotifEmail || null,
      employer_message: employerMessage || null,
    });
    setSaving(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const hasLocation = lat && lng;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2 flex-wrap">
            {t('dash.welcome', { name: profile?.full_name || user.email?.split('@')[0] || '' })}
            {profile?.is_verified && <VerifiedBadge />}
          </h1>
          <p className="mt-1 text-muted-foreground">{t('dash.subtitle')}</p>
          {!profile?.is_verified && (
            <div className="mt-2">
              <VerificationPrompt />
            </div>
          )}
        </div>
        <Button variant="outline" onClick={() => setShowProfile(!showProfile)}>
          <Settings className="mr-2 h-4 w-4" />
          {t('dash.profile')}
        </Button>
      </div>

      {!profile?.onboarded && !showProfile && (
        <Card className="mb-6 border-accent/40 bg-accent/10 p-5 animate-fade-in">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">{t('dash.completeProfileTitle')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('dash.completeProfileDesc')}</p>
            </div>
            <Button type="button" variant="outline" onClick={() => setShowProfile(true)} className="shrink-0 border-accent/50 bg-background hover:border-accent">
              {t('dash.completeProfile')} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Profile Settings Panel */}
      {showProfile && (
        <Card id="profile" className="mb-6 p-6 animate-fade-in">
          <h2 className="mb-1 text-lg font-semibold text-foreground">{t('dash.profile')}</h2>
          <p className="mb-5 text-sm text-muted-foreground">{t('dash.profileDesc')}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t('auth.fullName')}</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('dash.accountType')}</Label>
              <Select value={userType} onValueChange={(v: string) => setUserType(v as 'worker' | 'farmer' | 'business')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="worker">{t('dash.accountTypeWorker')}</SelectItem>
                  <SelectItem value="farmer">{t('dash.accountTypeFarmer')}</SelectItem>
                  <SelectItem value="business">{t('dash.accountTypeBusiness')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{t('dash.location')}</Label>
              <div className="flex gap-2">
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder={t('form.selectCity')} /></SelectTrigger>
                  <SelectContent>
                    {TURKEY_CITIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" onClick={handleAutoDetect} disabled={detecting}>
                  {detecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                  <span className="ml-1.5 hidden sm:inline">{detecting ? t('dash.detecting') : t('dash.autoDetect')}</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-border pt-5">
            <h3 className="mb-1 text-sm font-semibold text-foreground">{t('dash.notificationSettings')}</h3>
            <p className="mb-4 text-xs text-muted-foreground">{t('dash.notificationsDesc')}</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('dash.preferredLanguage')}</Label>
                <Select value={preferredLang} onValueChange={(v: string) => setPreferredLang(v as 'tr' | 'en' | 'ar')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tr">{t('joblang.tr')}</SelectItem>
                    <SelectItem value="en">{t('joblang.en')}</SelectItem>
                    <SelectItem value="ar">{t('joblang.ar')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('dash.notificationEmail')}</Label>
                <Input value={notifEmail} onChange={(e) => setNotifEmail(e.target.value)} placeholder={t('dash.notificationEmailPlaceholder')} />
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-border pt-5">
            <h3 className="mb-1 text-sm font-semibold text-foreground">{t('messages.emailNotifications')}</h3>
            <p className="mb-4 text-xs text-muted-foreground">{t('messages.emailNotificationsDesc')}</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="emailMsgNotifs">{t('messages.emailNotifications')}</Label>
                <Switch id="emailMsgNotifs" checked={emailMsgNotifs} onCheckedChange={setEmailMsgNotifs} />
              </div>
              {emailMsgNotifs && (
                <div className="space-y-2">
                  <Label>{t('messages.notificationEmail')}</Label>
                  <Input value={msgNotifEmail} onChange={(e) => setMsgNotifEmail(e.target.value)} placeholder={t('messages.notificationEmailPlaceholder')} />
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 border-t border-border pt-5">
            <h3 className="mb-1 text-sm font-semibold text-foreground">{t('dash.weatherSettings')}</h3>
            <p className="mb-4 text-xs text-muted-foreground">{t('dash.weatherSettingsDesc')}</p>
            <div className="space-y-2">
              <Label>{t('dash.weatherWidgetLocation')}</Label>
              <Input value={weatherLocation} onChange={(e) => setWeatherLocation(e.target.value)} placeholder={t('dash.weatherLocationPlaceholder')} />
              <p className="text-[10px] text-muted-foreground">{t('dash.weatherLocationHint')}</p>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {t('dash.saveProfile')}
            </Button>
            {savedMsg && <span className="text-sm text-success">{t('dash.profileSaved')}</span>}
          </div>

          {/* Documents Section */}
          <div className="mt-6 border-t border-border pt-5">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-secondary" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">{t('dash.employerMessageTitle')}</h3>
                <p className="text-[10px] text-muted-foreground">{t('dash.employerMessageDesc')}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Textarea
                value={employerMessage}
                onChange={(e) => setEmployerMessage(e.target.value)}
                placeholder={t('dash.employerMessagePlaceholder')}
                rows={5}
                className="text-sm"
              />
              <p className="text-[10px] text-muted-foreground">{t('dash.employerMessageHint')}</p>
            </div>
          </div>

          {/* Documents Section */}
          <div className="mt-6 border-t border-border pt-5">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-secondary" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">{t('docs.myDocuments')}</h3>
                <p className="text-[10px] text-muted-foreground">{t('docs.myDocumentsDesc')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <DocumentManager documentType="cv" />
              <DocumentManager documentType="cover_letter" />
            </div>
          </div>
        </Card>
      )}

      {/* No location prompt */}
      {!hasLocation && !showProfile && (
        <Card className="mb-6 flex flex-col items-center gap-3 p-8 text-center animate-fade-in">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15">
            <MapPin className="h-7 w-7 text-accent-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">{t('dash.noLocation')}</h3>
          <p className="text-sm text-muted-foreground max-w-md">{t('dash.noLocationDesc')}</p>
          <Button onClick={() => setShowProfile(true)} className="mt-2 bg-primary hover:bg-primary-light">
            <MapPin className="mr-2 h-4 w-4" />{t('dash.setLocationNow')}
          </Button>
        </Card>
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Messages Summary */}
        <Card className="p-5 lg:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-secondary" />
              <h3 className="text-lg font-semibold text-foreground">{t('messages.recentConversations')}</h3>
            </div>
            {unreadCount > 0 && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">{unreadCount}</span>
            )}
          </div>
          {conversations.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">{t('messages.noConversationsShort')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.slice(0, 4).map((conv) => (
                <a key={conv.id} href={`/messages?c=${conv.id}`} className="block rounded-lg border border-border p-3 transition-all hover:border-primary/30 hover:shadow-sm">
                  <p className="text-sm font-medium text-foreground line-clamp-1">
                    {conv.employer_id === user.id ? conv.applicant_name : conv.job?.farm_name || t('messages.employer')}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{conv.job?.title || t('messages.jobDeleted')}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(conv.last_message_at).toLocaleDateString(locale === 'ar' ? 'ar' : 'tr-TR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </a>
              ))}
              <a href="/messages" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all">
                {t('messages.viewAll')}<ArrowRight className="h-4 w-4" />
              </a>
            </div>
          )}
        </Card>

        {/* My Alerts */}
        <MyAlerts />

        {/* Weather Widget */}
        <Card className="p-5 lg:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <Cloud className="h-5 w-5 text-secondary" />
            <h3 className="text-lg font-semibold text-foreground">{t('dash.weather')}</h3>
          </div>
          {hasLocation ? (
            weatherLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : weather ? (
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{weather.location.name}</p>
                    <p className="text-4xl font-bold text-primary">{Math.round(weather.current.temperature)}°C</p>
                    <p className="text-sm text-muted-foreground">
                      {getWeatherDescription(weather.current.weathercode, locale)}
                    </p>
                  </div>
                  {(() => {
                    const Icon = weatherIcons[weather.current.weathercode] || CloudSun;
                    return <Icon className="h-16 w-16 text-secondary" />;
                  })()}
                </div>
                <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                  <span>{t('dash.weatherWind')}: {Math.round(weather.current.windspeed)} km/h</span>
                </div>
                {/* 5-day forecast */}
                <div className="mt-4 grid grid-cols-5 gap-1">
                  {weather.daily.time.slice(0, 5).map((date, i) => {
                    const FIcon = weatherIcons[weather.daily.weathercode[i]] || CloudSun;
                    return (
                      <div key={i} className="flex flex-col items-center gap-1 rounded-lg bg-muted/40 p-2 text-center">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(date).toLocaleDateString(locale === 'ar' ? 'ar' : 'tr-TR', { weekday: 'short' })}
                        </span>
                        <FIcon className="h-4 w-4 text-secondary" />
                        <span className="text-[10px] font-semibold text-foreground">{Math.round(weather.daily.temperature_2m_max[i])}°</span>
                        <span className="text-[10px] text-muted-foreground">{Math.round(weather.daily.temperature_2m_min[i])}°</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('dash.noWeather')}</p>
            )
          ) : (
            <p className="text-sm text-muted-foreground">{t('dash.noLocation')}</p>
          )}
        </Card>

        {/* Local Prices */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-secondary" />
            <h3 className="text-lg font-semibold text-foreground">{t('dash.localPrices')}</h3>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">{t('dash.localPricesDesc')}</p>
          {hasLocation && uniqueLocalPrices.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {uniqueLocalPrices.map((price) => {
                const exchange = exchanges.find((ex) => ex.id === price.exchange_id);
                return (
                  <div key={price.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{price.commodity_name}</p>
                      <p className="text-[10px] text-muted-foreground">{exchange?.short_name} · {price.commodity_category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">₺{price.price.toLocaleString('tr-TR')}</p>
                      <p className={cn('text-[10px]', price.change_pct > 0 ? 'text-success' : price.change_pct < 0 ? 'text-destructive' : 'text-muted-foreground')}>
                        {price.change_pct > 0 ? '+' : ''}{price.change_pct}% /{price.unit}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{hasLocation ? t('dash.noPrices') : t('dash.noLocation')}</p>
          )}
        </Card>

        {/* Local News */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-secondary" />
            <h3 className="text-lg font-semibold text-foreground">{t('dash.localNews')}</h3>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">{t('dash.localNewsDesc')}</p>
          {newsLoading ? (
            <div className="flex items-center justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : articles.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {articles.slice(0, 4).map((article) => (
                <div key={article.id} className="rounded-lg border border-border p-3 transition-all hover:border-primary/20 hover:shadow-sm">
                  <div className="mb-1.5 flex items-center gap-2">
                    <Badge variant="outline" className={cn(
                      'text-[10px]',
                      article.category === 'market' ? 'border-accent/30 bg-accent/10 text-accent-foreground' :
                      article.category === 'policy' ? 'border-primary/30 bg-primary/10 text-primary' :
                      'border-secondary/30 bg-secondary/10 text-secondary'
                    )}>
                      {article.category}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{article.region}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-foreground leading-tight">{localizedNewsTitle(article, locale)}</h4>
                  {localizedNewsSummary(article, locale) && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{localizedNewsSummary(article, locale)}</p>}
                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    {article.source} · {new Date(article.published_at).toLocaleDateString(locale === 'ar' ? 'ar' : 'tr-TR')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('dash.noNews')}</p>
          )}
        </Card>

        {/* My Courses */}
        <Card className="p-5 lg:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-secondary" />
            <h3 className="text-lg font-semibold text-foreground">{t('akademi.myCourses')}</h3>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">{t('akademi.myCoursesDesc')}</p>
          {enrollLoading ? (
            <div className="flex items-center justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : enrollments.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">{t('akademi.noEnrollments')}</p>
              <Link href="/akademi" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all">
                {t('akademi.allCourses')}<ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {enrollments.slice(0, 4).map((enr) => (
                <Link key={enr.id} href={`/akademi/${enr.course_id}`} className="block rounded-lg border border-border p-3 transition-all hover:border-primary/30 hover:shadow-sm">
                  <p className="text-sm font-medium text-foreground line-clamp-1">{enr.course?.title}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${enr.progress}%` }} />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">{enr.progress}%</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>


        {/* Dashboard Sidebar Ad */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <AdSpace slot="dashboard-sidebar" page="dashboard" variant="sidebar" className="h-[250px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
