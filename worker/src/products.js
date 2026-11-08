// Product keys used by the site (assets/app.js, object P) with short Arabic names for messages and emails.
export const PRODUCTS = {
  y: 'تعلّم بايثون', j: 'تعلّم Java', v: 'تعلّم JavaScript', x: 'تعلّم C++',
  r: 'المرايا الثلاث', n: 'مدينة الأصداء',
  i: 'الزخارف الإسلامية', k: 'ألوان الطبيعة للأطفال', m: 'مندالا هندسية', a: 'مساجد وعمارة إسلامية', f: 'زخارف نباتية', s: 'نجوم وبلاطات هندسية',
  p: 'مخطط الدراسة والامتحانات', c: 'قوالب السيرة الذاتية', e: 'كتاب التعلّم الممتع للأطفال', t: 'متتبع الصلوات والعادات',
};
export const productName = (k) => PRODUCTS[k] || k;
