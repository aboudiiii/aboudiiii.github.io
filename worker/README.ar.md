# تشغيل التقييمات والتعليقات المباشرة

الفكرة: الزائر يقيّم أو يعلّق **داخل الموقع** (كل واحد في نموذج منفصل). يصلك إشعار على تيليجرام مع زرّين **✅ نشر / ❌ حذف**. ما توافق عليه فقط يظهر في الموقع، ويمكنك لاحقًا الضغط على **↩️ إلغاء النشر**.

التشغيل مجاني (Cloudflare Workers + KV). لا يتأثر بوت المتجر `SmartZaki_Bot` لأننا نستخدم **بوت جديدًا** للموافقات فقط.

> إلى أن تضع عنوان الـ Worker في `assets/config.js` يبقى الموقع كما هو (رابط التقييم عبر تيليجرام). لذلك الدمج آمن قبل التشغيل.

## الخطوات (مرة واحدة، حوالي 10 دقائق، على الكمبيوتر)

1. **بوت الموافقات:** في تيليجرام افتح `@BotFather` ← `/newbot` ← اختر اسمًا ← انسخ **التوكن**.
2. **حساب Cloudflare:** سجّل مجانًا على cloudflare.com.
3. افتح PowerShell داخل مجلد `worker` من المستودع ونفّذ:

```powershell
npx wrangler login
npx wrangler kv namespace create REVIEWS
```
انسخ الـ `id` الذي يظهر وضعه في `wrangler.toml` مكان `PUT_KV_ID_HERE`. ثم:

```powershell
npx wrangler secret put TG_TOKEN            # الصق توكن البوت
npx wrangler secret put TG_WEBHOOK_SECRET   # أي كلمة سرية طويلة (حروف وأرقام فقط)
npx wrangler secret put RATE_SALT           # أي نص عشوائي
npx wrangler secret put TG_OWNER_ID         # اكتب 0 مؤقتًا
npx wrangler deploy
```
سيطبع عنوانًا مثل `https://hayali-reviews.XXXX.workers.dev`.

4. **ربط تيليجرام بالـ Worker:** افتح في المتصفح مرة واحدة:
   `https://hayali-reviews.XXXX.workers.dev/setup/<TG_WEBHOOK_SECRET>`
   ويجب أن تظهر «Webhook registered».
5. **رقم حسابك:** أرسل `/start` لبوتك الجديد، فيرد بـ `Chat ID: 123456789`. ثم:
```powershell
npx wrangler secret put TG_OWNER_ID         # الصق الرقم الحقيقي
```
6. **ربط الموقع:** افتح `assets/config.js` وضع العنوان:
   `window.HAYALI_API = "https://hayali-reviews.XXXX.workers.dev";`
   وارفع التعديل (أو أرسل لي العنوان وأنا أرفعه).

## الاختبار
افتح الموقع ← قسم «آراء الزبائن» ← أرسل تقييمًا. يصلك إشعار فيه أزرار. اضغط **نشر** وحدّث الموقع بعد دقيقة.

## حماية من السبام (مفعّلة)
- لا روابط في الاسم أو التعليق، وحقل مخفي للروبوتات، وحد أدنى للزمن قبل الإرسال.
- حد لكل زائر: 4 في الساعة و12 في اليوم، وتقييم واحد لكل منتج يوميًا (يُخزَّن الـ IP مشفّرًا فقط).
- كل شيء يمرّ عبر موافقتك قبل أن يظهر.

## ملاحظات
- الخطة المجانية لـ KV تسمح بنحو 1000 عملية كتابة يوميًا (تقريبًا 250 تقييمًا أو تعليقًا في اليوم)، وهذا أكثر من كافٍ.
- لاستخدام دومين خاص لاحقًا عدّل `connect-src` في وسم CSP في `index.html`.
- الاختبارات: `cd worker && npm test`.
