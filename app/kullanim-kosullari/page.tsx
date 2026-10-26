'use client';

import Link from 'next/link';
import { useI18n } from '@/components/i18n-provider';

export default function TermsPage() {
  const { locale } = useI18n();

  const content = {
    tr: {
      title: 'Kullanım Koşulları',
      updated: 'Son güncelleme: 2025',
      intro:
        'Turanda Tarım platformunu kullanarak aşağıdaki koşulları kabul etmiş olursunuz. Platform; iş arayanlar, çiftlikler ve tarım işverenlerini buluşturan bir aracı hizmettir.',
      sections: [
        {
          heading: 'Hizmetin Kapsamı',
          body: 'Turanda; iş ilanı yayınlama, başvuru alma ve tarım sektöründe iş eşleştirmesi sağlar. Turanda, işçi ile işveren arasındaki sözleşmenin tarafı değildir.',
        },
        {
          heading: 'Hesap Sorumluluğu',
          body: 'Hesap bilgilerinizin gizliliğinden siz sorumlusunuz. Verdiğiniz bilgilerin doğru ve güncel olması zorunludur. Yanıltıcı ilanlar veya sahte profiller askıya alma ile sonuçlanır.',
        },
        {
          heading: 'Ödemeler',
          body: 'Öne çıkan ilan gibi ücretli hizmetler, sayfada belirtilen bedel karşılığında sunulur. Sandbox/test ortamındaki işlemler tahsilat oluşturmaz.',
        },
        {
          heading: 'İçerik Kuralları',
          body: 'Yasadışı, ayrımcı veya yanıltıcı içerik yayınlamak yasaktır. Topluluk kurallarına uymayan içerik önceden bildirilmeksizin kaldırılabilir.',
        },
      ],
    },
    en: {
      title: 'Terms of Service',
      updated: 'Last updated: 2025',
      intro:
        'By using the Turanda Tarım platform you agree to the terms below. Turanda is a marketplace service connecting job seekers with farms and agricultural employers.',
      sections: [
        {
          heading: 'Scope of Service',
          body: 'Turanda provides job posting, applications, and matching in the agricultural sector. Turanda is not a party to any agreement between a worker and an employer.',
        },
        {
          heading: 'Account Responsibility',
          body: 'You are responsible for keeping your account credentials secure. Information you provide must be accurate and current. Misleading listings or fake profiles result in suspension.',
        },
        {
          heading: 'Payments',
          body: 'Paid services such as featured listings are provided at the price shown on the page. Transactions in the sandbox/test environment do not create a charge.',
        },
        {
          heading: 'Content Rules',
          body: 'Posting illegal, discriminatory, or misleading content is prohibited. Content that violates community rules may be removed without prior notice.',
        },
      ],
    },
    ar: {
      title: 'شروط الاستخدام',
      updated: 'آخر تحديث: 2025',
      intro:
        'باستخدامك منصة توراندا فإنك توافق على الشروط التالية. توراندا خدمة وسيطة تربط الباحثين عن عمل بالمزارع وأصحاب العمل في القطاع الزراعي.',
      sections: [
        {
          heading: 'نطاق الخدمة',
          body: 'توفر توراندا نشر إعلانات الوظائف واستقبال الطلبات والمطابقة في القطاع الزراعي. توراندا ليست طرفاً في أي اتفاق بين العامل وصاحب العمل.',
        },
        {
          heading: 'مسؤولية الحساب',
          body: 'أنت مسؤول عن سرية بيانات حسابك. يجب أن تكون المعلومات المقدمة صحيحة ومحدثة. الإعلانات المضللة أو الملفات المزيفة تؤدي إلى تعليق الحساب.',
        },
        {
          heading: 'المدفوعات',
          body: 'تُقدم الخدمات المدفوعة مثل الإعلانات المميزة بالسعر المعروض على الصفحة. المعاملات في بيئة الاختبار لا تنشئ أي خصم.',
        },
        {
          heading: 'قواعد المحتوى',
          body: 'يحظر نشر محتوى غير قانوني أو تمييزي أو مضلل. قد يُزال المحتوى المخالف لقواعد المجتمع دون إشعار مسبق.',
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
