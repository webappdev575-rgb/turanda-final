'use client';

import Link from 'next/link';
import { useI18n } from '@/components/i18n-provider';

export default function PrivacyPage() {
  const { t, locale } = useI18n();

  const content = {
    tr: {
      title: 'Gizlilik Politikası',
      updated: 'Son güncelleme: 2025',
      intro:
        'Turanda Tarım olarak kişisel verilerinizi korumak en öncelikli görevimizdir. Bu politika, platformu kullanırken topladığımız verileri, bunları nasıl kullandığımızı ve haklarınızı açıklar.',
      sections: [
        {
          heading: 'Topladığımız Veriler',
          body: 'Hesap oluştururken ad, e-posta ve telefon bilgisi; iş başvurularında özgeçmiş ve iletişim bilgileri; platform kullanımına dair teknik veriler (tarayıcı, cihaz, IP) toplanır.',
        },
        {
          heading: 'Verilerin Kullanımı',
          body: 'Verileriniz iş ilanı eşleştirmesi, işverenlerle iletişim, platform güvenliği ve hizmet kalitesinin iyileştirilmesi için kullanılır. Verileriniz üçüncü taraflara izniniz olmadan satılmaz.',
        },
        {
          heading: 'Çerezler',
          body: 'Oturumunuzu korumak ve site deneyiminizi geliştirmek için zorunlu ve tercihsal çerezler kullanılır. Çerez tercihlerinizi tarayıcı ayarlarınızdan yönetebilirsiniz.',
        },
        {
          heading: 'Haklarınız',
          body: 'KVKK kapsamında verilerinize erişme, düzeltme ve silme talebinde bulunabilirsiniz. Talepleriniz için info@turanda.com adresine yazabilirsiniz.',
        },
      ],
    },
    en: {
      title: 'Privacy Policy',
      updated: 'Last updated: 2025',
      intro:
        'At Turanda Tarım, protecting your personal data is our top priority. This policy explains what data we collect when you use the platform, how we use it, and your rights.',
      sections: [
        {
          heading: 'Data We Collect',
          body: 'When you create an account we collect your name, email, and phone; with job applications we collect your CV and contact details; and we collect technical usage data (browser, device, IP).',
        },
        {
          heading: 'How We Use Data',
          body: 'Your data is used for job matching, communication with employers, platform security, and improving service quality. Your data is never sold to third parties without your consent.',
        },
        {
          heading: 'Cookies',
          body: 'We use essential and preference cookies to keep your session secure and improve the site experience. You can manage cookie preferences in your browser settings.',
        },
        {
          heading: 'Your Rights',
          body: 'Under KVKK (Turkish data protection law) you may request access to, correction of, or deletion of your data. Contact us at info@turanda.com for any request.',
        },
      ],
    },
    ar: {
      title: 'سياسة الخصوصية',
      updated: 'آخر تحديث: 2025',
      intro:
        'في توراندا، حماية بياناتك الشخصية هي أولوياتنا. توضح هذه السياسة البيانات التي نجمعها عند استخدام المنصة وكيفية استخدامها وحقوقك.',
      sections: [
        {
          heading: 'البيانات التي نجمعها',
          body: 'عند إنشاء الحساب نجمع الاسم والبريد الإلكتروني والهاتف؛ ومع طلبات الوظائف نجمع السيرة الذاتية وبيانات الاتصال؛ كما نجمع بيانات الاستخدام التقنية (المتصفح، الجهاز، عنوان IP).',
        },
        {
          heading: 'كيفية استخدام البيانات',
          body: 'تُستخدم بياناتك لمطابقة الوظائف والتواصل مع أصحاب العمل وأمان المنصة وتحسين جودة الخدمة. لا تُباع بياناتك لأي طرف ثالث دون موافقتك.',
        },
        {
          heading: 'ملفات تعريف الارتباط',
          body: 'نستخدم ملفات تعريف الارتباط الأساسية والتفضيلية لتأمين جلستك وتحسين تجربة الموقع. يمكنك إدارة التفضيلات من إعدادات المتصفح.',
        },
        {
          heading: 'حقوقك',
          body: 'بموجب قانون حماية البيانات التركي (KVKK) يمكنك طلب الوصول إلى بياناتك أو تصحيحها أو حذفها. راسلنا على info@turanda.com لأي طلب.',
        },
      ],
    },
  } as const;

  const c = content[locale] ?? content.tr;

  return (
    <div className="min-h-screen bg-[#fffdf6] py-10 dark:bg-[#0b1611]">
      <article className="mx-auto w-full max-w-3xl px-5 sm:px-8">
        <Link href="/" className="text-sm font-semibold text-field hover:underline dark:text-[#c9e7b8]">
          ← Turanda
        </Link>
        <h1 className="pt-6 text-3xl font-semibold leading-[1.2] tracking-[-0.9px] text-[#15231d] dark:text-[#f5f3eb] sm:text-4xl">
          {c.title}
        </h1>
        <p className="pt-2 text-xs text-[#96a09a]">{c.updated}</p>
        <p className="pt-6 text-sm leading-7 text-[#3f5148] dark:text-[#c9d4cd]">{c.intro}</p>
        {c.sections.map((s) => (
          <section key={s.heading} className="pt-8">
            <h2 className="text-lg font-semibold leading-6 text-[#15231d] dark:text-[#f5f3eb]">{s.heading}</h2>
            <p className="pt-2 text-sm leading-7 text-[#3f5148] dark:text-[#c9d4cd]">{s.body}</p>
          </section>
        ))}
      </article>
    </div>
  );
}
