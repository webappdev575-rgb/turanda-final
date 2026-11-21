export type AcademyLocale = 'tr' | 'en' | 'ar';
export type LocalizedText = { tr: string; en: string; ar: string };

export type AcademyProgramme = {
  slug: string;
  title: LocalizedText;
  duration: LocalizedText;
  description: LocalizedText;
  time?: string;
  participants: LocalizedText;
  prerequisites: LocalizedText[];
  instructors: { name: string; role: LocalizedText; bio: LocalizedText }[];
  image: string;
  schedule?: { time: string; activity: LocalizedText }[];
  months?: { month: string; subject: LocalizedText; activities: LocalizedText }[];
  note?: LocalizedText;
  outcomes?: LocalizedText[];
};

export const ACADEMY_PROGRAMMES: AcademyProgramme[] = [
  {
    slug: 'farmer-for-a-day',
    title: { tr: 'Bir Günlük Çiftçi', en: 'Farmer for a Day', ar: 'يوم كمزارع' },
    duration: { tr: 'Bir gün', en: 'One-day experience', ar: 'تجربة لمدة يوم واحد' },
    description: {
      tr: 'Bir gün boyunca köy kahvaltısı, tarım güvenliği, makineler ve mevsimlik tarla çalışmalarına katılan pratik bir tarım deneyimi.',
      en: 'A practical one-day farming experience covering a village breakfast, farm safety, machinery and seasonal hands-on fieldwork.',
      ar: 'تجربة زراعية عملية لمدة يوم تشمل إفطاراً قروياً والسلامة الزراعية والآلات والعمل الموسمي العملي في الحقل.',
    },
    time: '08:00–17:00',
    participants: {
      tr: 'Şehir sakinleri, aileler, ziyaretçiler, öğrenciler ve tarımla ilgilenen kişiler.',
      en: 'Urban residents, families, visitors, students and people interested in agriculture.',
      ar: 'سكان المدن والعائلات والزوار والطلاب والأشخاص المهتمون بالزراعة.',
    },
    prerequisites: [
      { tr: 'Önceden tarım deneyimi gerekli değildir.', en: 'No previous farming experience is required.', ar: 'لا يشترط خبرة سابقة في الزراعة.' },
      { tr: 'Rahat kıyafetler ve kapalı ayakkabılar kullanın.', en: 'Wear comfortable clothing and closed shoes.', ar: 'ارتدِ ملابس مريحة وأحذية مغلقة.' },
    ],
    instructors: [
      { name: 'Turanda Field Team', role: { tr: 'Tarım Eğitmenleri', en: 'Agricultural Trainers', ar: 'مدربون زراعيون' }, bio: { tr: 'Makine kullanımı, tarla işleri ve güvenlik uygulamalarını yöneten deneyimli saha ekibi.', en: 'Experienced field team leading machinery, fieldwork and safety activities.', ar: 'فريق ميداني ذو خبرة يقود أنشطة الآلات والعمل الميداني والسلامة.' } },
    ],
    image: '/images/academy/farmer-for-a-day.png',
    schedule: [
      { time: '08:00–09:00', activity: { tr: 'Karşılama, köy kahvaltısı ve hoş geldiniz', en: 'Arrival, village breakfast and welcome', ar: 'الوصول وإفطار القرويين والاستقبال' } },
      { time: '09:00–09:30', activity: { tr: 'Çiftçiliğe giriş ve güvenlik bilgilendirmesi', en: 'Introduction to farming and safety briefing', ar: 'مقدمة في الزراعة وإرشادات السلامة' } },
      { time: '09:30–10:30', activity: { tr: 'Tarım makinelerine giriş', en: 'Introduction to agricultural machinery', ar: 'مقدمة في الآلات الزراعية' } },
      { time: '10:30–12:00', activity: { tr: 'Uygulamalı tarla faaliyetleri', en: 'Hands-on field activities', ar: 'أنشطة ميدانية عملية' } },
      { time: '12:00–13:00', activity: { tr: 'Geleneksel köy öğle yemeği', en: 'Traditional village lunch', ar: 'غداء ريفي تقليدي' } },
      { time: '13:00–14:30', activity: { tr: 'Ekim, sulama ve mevsimlik tarla işleri', en: 'Planting, irrigation and seasonal fieldwork', ar: 'الزراعة والري والعمل الموسمي في الحقل' } },
      { time: '14:30–15:30', activity: { tr: 'Çiftliği keşfetme ve mahsul gözlemi', en: 'Farm exploration and crop observation', ar: 'استكشاف المزرعة ومراقبة المحاصيل' } },
      { time: '15:30–16:30', activity: { tr: 'Pratik tarım meydan okuması', en: 'Practical farming challenge', ar: 'تحدٍ عملي في الزراعة' } },
      { time: '16:30–17:00', activity: { tr: 'Sertifika takdimi ve ayrılış', en: 'Certificate presentation and departure', ar: 'تقديم الشهادات والانصراف' } },
    ],
    outcomes: [
      { tr: 'Tarım makineleri ve temel saha güvenliği hakkında bilgi', en: 'Knowledge of agricultural machinery and essential field safety', ar: 'معرفة بالآلات الزراعية وأساسيات السلامة الميدانية' },
      { tr: 'Ekim, sulama ve mevsimlik tarla işlerinde uygulamalı deneyim', en: 'Hands-on experience with planting, irrigation and seasonal fieldwork', ar: 'خبرة عملية في الزراعة والري والعمل الحقلي الموسمي' },
      { tr: 'Katılım sertifikası', en: 'Certificate of participation', ar: 'شهادة مشاركة' },
    ],
    note: { tr: 'Faaliyetler tarımsal mevsime göre değişir.', en: 'Activities change according to the agricultural season.', ar: 'تتغير الأنشطة حسب الموسم الزراعي.' },
  },
  {
    slug: 'weekend-farming',
    title: { tr: 'Hafta Sonu Tarım Programı', en: 'Weekend Farming Programme', ar: 'برنامج الزراعة لوقت نهاية الأسبوع' },
    duration: { tr: 'İki gün', en: 'Two-day practical course', ar: 'دورة عملية لمدة يومين' },
    description: {
      tr: 'Cumartesi ve Pazar günleri toprak hazırlama, ekim, sulama, mahsul yönetimi ve tarım makineleri üzerine uygulamalı eğitim.',
      en: 'A two-day course with practical training in soil preparation, planting, irrigation, crop management and agricultural machinery.',
      ar: 'دورة لمدة يومين تغطي عملياً تحضير التربة والزراعة والري وإدارة المحاصيل والآلات الزراعية.',
    },
    participants: {
      tr: 'Başlangıç seviyesindeki kişiler, çiftçilik yapmak isteyenler, tarım meraklıları ve pratik tarım becerilerini geliştirmek isteyenler.',
      en: 'Beginners, aspiring farmers, agricultural enthusiasts and people wishing to develop practical farming skills.',
      ar: 'المبتدئون والمهتمون بالزراعة والطامحون لأن يصبحوا مزارعين والأشخاص الراغبون في تطوير مهاراتهم الزراعية العملية.',
    },
    prerequisites: [
      { tr: 'Tarım deneyimi gerekli değildir.', en: 'No prior farming experience is required.', ar: 'لا يشترط خبرة زراعية مسبقة.' },
      { tr: 'İki günün tamamına katılım gerekir.', en: 'Participation in both days is required.', ar: 'يلزم الحضور في اليومين كاملين.' },
    ],
    instructors: [
      { name: 'Turanda Technical Team', role: { tr: 'Tarım Teknolojisi Eğitmenleri', en: 'Agricultural Technical Trainers', ar: 'مدربون تقنيون زراعيون' }, bio: { tr: 'Toprak, sulama, mahsul yönetimi ve makineler alanında uygulamalı eğitim verir.', en: 'Provides hands-on instruction across soils, irrigation, crop management and machinery.', ar: 'يقدم تدريساً عملياً في التربة والري وإدارة المحاصيل والآلات.' } },
    ],
    image: '/images/academy/recreational-program.png',
    schedule: [
      { time: 'Saturday 09:00–10:00', activity: { tr: 'Modern tarıma giriş', en: 'Introduction to modern agriculture', ar: 'مقدمة في الزراعة الحديثة' } },
      { time: 'Saturday 10:00–11:00', activity: { tr: 'Toprak hazırlama ve toprak analizi', en: 'Soil preparation and soil analysis', ar: 'تحضير التربة وتحليلها' } },
      { time: 'Saturday 11:00–12:30', activity: { tr: 'Mahsul seçimi, ekim ve tohumlama', en: 'Crop selection, planting and seeding', ar: 'اختيار المحاصيل والزراعة والبذر' } },
      { time: 'Saturday 13:30–15:00', activity: { tr: 'Traktör ve tarım makinesi gösterimleri', en: 'Tractor and agricultural machinery demonstrations', ar: 'عروض الجرارات والآلات الزراعية' } },
      { time: 'Saturday 15:00–16:30', activity: { tr: 'Uygulamalı tarla hazırlama', en: 'Practical field preparation', ar: 'التحضير العملي للحقل' } },
      { time: 'Sunday 09:00–10:00', activity: { tr: 'Sulama sistemleri ve su yönetimi', en: 'Irrigation systems and water management', ar: 'أنظمة الري وإدارة المياه' } },
      { time: 'Sunday 10:00–11:30', activity: { tr: 'Sulama ekipmanının kurulumu ve kullanımı', en: 'Installation and operation of irrigation equipment', ar: 'تركيب وتشغيل معدات الري' } },
      { time: 'Sunday 11:30–12:30', activity: { tr: 'Gübreleme ve bitki besleme', en: 'Fertilisation and crop nutrition', ar: 'التسميد وتغذية المحاصيل' } },
      { time: 'Sunday 13:30–15:00', activity: { tr: 'Mahsul izleme ve tarla yönetimi', en: 'Crop monitoring and field management', ar: 'مراقبة المحاصيل وإدارة الحقل' } },
      { time: 'Sunday 15:00–16:30', activity: { tr: 'Makine kullanımı, bakım ve değerlendirme', en: 'Machinery operation, maintenance and assessment', ar: 'تشغيل الآلات وصيانتها والتقييم' } },
    ],
    outcomes: [
      { tr: 'Toprak hazırlama, ekim ve mahsul yönetimi becerileri', en: 'Skills in soil preparation, planting and crop management', ar: 'مهارات في تحضير التربة والزراعة وإدارة المحاصيل' },
      { tr: 'Sulama sistemleri ve su yönetimi konusunda uygulamalı deneyim', en: 'Hands-on experience with irrigation systems and water management', ar: 'خبرة عملية في أنظمة الري وإدارة المياه' },
      { tr: 'Tarım makinelerinin güvenli kullanımı ve temel bakımı', en: 'Safe operation and basic maintenance of agricultural machinery', ar: 'التشغيل الآمن والصيانة الأساسية للآلات الزراعية' },
      { tr: 'Programı tamamlama sertifikası', en: 'Certificate of programme completion', ar: 'شهادة إتمام البرنامج' },
    ],
  },
  {
    slug: 'professional-farming',
    title: { tr: 'Altı Aylık Profesyonel Çiftçilik Programı', en: 'Six-Month Professional Farming Programme', ar: 'برنامج الزراعة المهنية لمدة ستة أشهر' },
    duration: { tr: 'Altı aylık eğitim', en: 'Six-month paid training', ar: 'تدريب مدفوع لمدة ستة أشهر' },
    description: {
      tr: 'Sınıf eğitimi, uygulamalı tarla çalışmaları ve makine eğitimini birleştiren kapsamlı profesyonel tarım programı.',
      en: 'A comprehensive professional farming programme combining classroom instruction, practical fieldwork and machinery training.',
      ar: 'برنامج زراعي مهني شامل يجمع بين التعليم النظري والعمل العملي في الحقل وتدريب الآلات.',
    },
    participants: {
      tr: 'Profesyonel çiftçi olmak isteyenler, tarıma başlayan gençler ve tarım işletmesi kurmak veya yönetmek isteyen kişiler.',
      en: 'Aspiring professional farmers, young people entering agriculture and individuals wishing to establish or manage agricultural operations.',
      ar: 'المزارعون الطموحون والشباب المقبلون على الزراعة والأفراد الراغبون في إنشاء أو إدارة عمليات زراعية.',
    },
    prerequisites: [
      { tr: 'Temel okuma-yazma ve güvenli saha çalışmasına istek gerekir.', en: 'Basic literacy and a willingness to undertake safe fieldwork are required.', ar: 'يلزم الحد الأدنى من القراءة والكتابة والرغبة في العمل الميداني الآمن.' },
      { tr: 'Altı aylık programa düzenli katılım gerekir.', en: 'Regular attendance throughout the six-month programme is required.', ar: 'يلزم الحضور المنتظم طوال البرنامج الذي يستمر ستة أشهر.' },
    ],
    instructors: [
      { name: 'Turanda Academy Faculty', role: { tr: 'Profesyonel Tarım Eğitmenleri', en: 'Professional Farming Faculty', ar: 'هيئة تدريس الزراعة المهنية' }, bio: { tr: 'Toprak, bitki üretimi, sulama, makine, mahsul koruma ve işletme yönetimi alanlarında uzmanlaşmış eğitmenler.', en: 'Faculty specialising in soils, crop production, irrigation, machinery, crop protection and farm management.', ar: 'مدرسون متخصصون في التربة وإنتاج المحاصيل والري والآلات وحماية المحاصيل وإدارة المزارع.' } },
    ],
    image: '/images/academy/seasonal-program.png',
    months: [
      { month: '1', subject: { tr: 'Toprak Bilimi ve Arazi Hazırlama', en: 'Soil Science & Land Preparation', ar: 'علم التربة وتجهيز الأرض' }, activities: { tr: 'Toprak testi, toprak yapısı, sürüm, işleme ve tarla hazırlama', en: 'Soil testing, soil structure, ploughing, cultivation and field preparation', ar: 'اختبار التربة وبنية التربة والحرث والتهيئة وتجهيز الحقل' } },
      { month: '2', subject: { tr: 'Mahsul Üretimi ve Ekim', en: 'Crop Production & Planting', ar: 'إنتاج المحاصيل والزراعة' }, activities: { tr: 'Tohum seçimi, ekim teknikleri, münavebe ve gübreleme', en: 'Seed selection, planting techniques, crop rotation and fertilisation', ar: 'اختيار البذور وتقنيات الزراعة ودوران المحاصيل والتسميد' } },
      { month: '3', subject: { tr: 'Sulama ve Su Yönetimi', en: 'Irrigation & Water Management', ar: 'الري وإدارة المياه' }, activities: { tr: 'Damla sulama, yağmurlama, su basıncı, otomasyon ve su tasarrufu', en: 'Drip irrigation, sprinklers, water pressure, automation and water conservation', ar: 'الري بالتنقيط والرش وضغط المياه والأتمتة والحفاظ على المياه' } },
      { month: '4', subject: { tr: 'Tarım Makineleri ve Teknolojisi', en: 'Agricultural Machinery & Technology', ar: 'الآلات والتكنولوجيا الزراعية' }, activities: { tr: 'Traktör kullanımı, makine kalibrasyonu, bakım ve modern ekipman', en: 'Tractor operation, machinery calibration, maintenance and modern equipment', ar: 'تشغيل الجرار ومعايرة الآلات والصيانة والمعدات الحديثة' } },
      { month: '5', subject: { tr: 'Mahsul Koruma ve Çiftlik Yönetimi', en: 'Crop Protection & Farm Management', ar: 'حماية المحاصيل وإدارة المزارع' }, activities: { tr: 'Zararlı ve hastalık tespiti, yabancı ot kontrolü, izleme ve çiftlik planlama', en: 'Pest and disease identification, weed control, crop monitoring and farm planning', ar: 'تحديد الآفات والأمراض ومكافحة الأعشاب ومراقبة المحاصيل وتخطيط المزرعة' } },
      { month: '6', subject: { tr: 'Hasat, Ekonomi ve Profesyonel Çiftlik Yönetimi', en: 'Harvesting, Economics & Professional Farm Management', ar: 'الحصاد والاقتصاد والإدارة الزراعية المهنية' }, activities: { tr: 'Hasat, depolama, pazarlama, maliyet hesapları ve iş planı hazırlama', en: 'Harvesting, storage, marketing, cost calculations and a farm business plan', ar: 'الحصاد والتخزين والتسويق وحساب التكاليف وإعداد خطة عمل للمزرعة' } },
    ],
    outcomes: [
      { tr: 'Pratik yeterlilik değerlendirmesi', en: 'Practical competency assessment', ar: 'تقييم الكفاءة العملية' },
      { tr: 'Bireysel çiftlik yönetimi projesi', en: 'Individual farm-management project', ar: 'مشروع فردي لإدارة المزرعة' },
      { tr: 'Tarım bilgisi değerlendirmesi', en: 'Evaluation of agricultural knowledge', ar: 'تقييم المعرفة الزراعية' },
      { tr: 'Tamamlama sertifikası', en: 'Certificate of completion', ar: 'شهادة إكمال البرنامج' },
    ],
  },
];
