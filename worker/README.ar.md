# الـ Worker: تقييمات وتعليقات وطلبات واشتراكات وحسابات

يعمل على Cloudflare Workers (مجاني) مع قاعدة D1. بدون أي مكتبات.

| المسار | الوظيفة |
|---|---|
| `POST /api/rating`, `/api/comment` | تقييم/تعليق من الموقع، يصلك على تيليجرام للموافقة |
| `GET /api/feed` | المقبول فقط |
| `POST /api/orders` | البوت يبلّغ عن طلب مدفوع (مفتاح `X-Bot-Key`) |
| `GET /api/stats` | عدد الطلبات لكل كتاب («الأكثر طلبًا») |
| `GET /api/admin/summary` | لوحة المالك: الإيرادات المسجلة والطلبات والمنتجات والأيام الأخيرة (Telegram owner only) |
| `GET/POST /api/admin/coupons` | إدارة الكوبونات والعروض وسجل تدقيق المالك (Telegram owner only) |
| `POST /api/auth/request` ثم `/verify` | دخول الزبون برمز يصل بالبريد |
| `GET /api/me` | مشتريات الزبون (يحتاج Bearer token) |
| `POST /api/subscribe` + `/api/confirm` + `/api/unsubscribe` | الاشتراك بالبريد (تأكيد مزدوج) |
| `/tg/<secret>` | webhook بوت الإعلانات (`/start` و`/stop` و`/announce` للمالك) |

## الإعداد من الموبايل بدون تيرمكس (الأسهل)
Wrangler ما يشتغل على تيرمكس، فننشر عن طريق GitHub Actions:
1. بالريبو: Settings ← Secrets and variables ← Actions ← New repository secret، وأضف:
   `CLOUDFLARE_API_TOKEN`، `CLOUDFLARE_ACCOUNT_ID`، `TG_TOKEN`، `TG_OWNER_ID` (اكتب `0` أول مرة)، `TG_WEBHOOK_SECRET`، `RATE_SALT`، `BOT_API_KEY`، `BREVO_API_KEY` (الأخير بعد ما تجهز Brevo، ويمكن تأخيره).
2. Actions ← **Deploy worker** ← Run workflow. يسوي القاعدة والجداول وينشر ويضع الأسرار.
3. من سجل الـ run انسخ عنوان الـ Worker (workers.dev)، وافتح `https://<العنوان>/setup/<TG_WEBHOOK_SECRET>`.
4. أرسل `/start` لبوت الإعلانات، خذ Chat ID، حدّث السر `TG_OWNER_ID` وأعد تشغيل الـ workflow.
5. ضع العنوان في `assets/config.js`.

## الإعداد اليدوي (حاسبة عادية، من جهازك)
1. `cd worker && npx wrangler login`
2. `npx wrangler d1 create hayali` ثم ضع `database_id` في `wrangler.toml`.
3. `npx wrangler d1 migrations apply hayali --remote`
4. **بوت الإعلانات:** من @BotFather أنشئ بوتًا جديدًا (غير بوت المتجر) وخذ التوكن.
5. **البريد (Brevo، مجاني):** أنشئ حسابًا، فعّل مرسلًا (Sender) وخذ مفتاح API. ضع بريد المرسل في `MAIL_FROM` داخل `wrangler.toml`. بدون نطاق خاص قد تصل الرسائل إلى «Spam».
6. الأسرار، كل واحد بأمر `npx wrangler secret put NAME`:
   `TG_TOKEN` (توكن بوت الإعلانات)، `TG_OWNER_ID` (اكتب `0` أولًا)، `TG_WEBHOOK_SECRET` (أي نص عشوائي طويل)، `RATE_SALT` (نص عشوائي)، `BOT_API_KEY` (نص عشوائي طويل، تعطيه للبوت)، `BREVO_API_KEY`.
7. `npx wrangler deploy` وانسخ العنوان `https://hayali-reviews.xxx.workers.dev` وضعه في `WORKER_URL`:
   `npx wrangler secret put WORKER_URL` (أو `[vars]` في `wrangler.toml`) ثم انشر مرة ثانية.
8. افتح `https://<عنوان-الworker>/setup/<TG_WEBHOOK_SECRET>` لتسجيل الـ webhook.
9. أرسل `/start` لبوت الإعلانات؛ سيرد بـ Chat ID. ضعه في `TG_OWNER_ID` وانشر مرة ثانية.
10. في الموقع: `assets/config.js` ضع عنوان الـ Worker في `HAYALI_API` واسم بوت الإعلانات في `HAYALI_TG_BOT`.

## لوحة الإدارة والكوبونات

- افتح `https://aboudiiii.github.io/admin.html` بعد نشر ملفات الموقع.
- الدخول حصراً عبر بوت تيليجرام، ويجب أن يطابق حساب تيليجرام قيمة السر `TG_OWNER_ID`. لا تتركها `0`؛ استخدم معرّف المالك الحقيقي.
- لوحة الإدارة تعرض الطلبات والإيرادات التي سجّلها بوت المتجر فقط، وتفصل الطلبات التي لا تحتوي مبلغاً مسجلاً.
- يمكن إنشاء كوبونات نسبة مئوية أو مبلغ ثابت، مع حد أدنى للسلة وفترة صلاحية وحد استخدام أقصى، وتفعيلها أو إيقافها وحذفها.
- **تنبيه:** الكوبونات محفوظة ومدارة في لوحة الإدارة، لكنها لا تخصم من مبلغ الدفع بعد. يجب تحديث بوت المتجر ليتحقق من الرمز والخصم والمبلغ النهائي على الخادم قبل تفعيل الخصم للزبائن. لا تعتمد على قيمة يرسلها المتصفح.
- تطبق قاعدة البيانات الترحيل `0002_admin_coupons.sql` عبر سير عمل نشر Worker بعد النسخ الاحتياطي ومراجعة بيئة الإنتاج.

## الإعلان عن كتاب جديد
أرسل للبوت: `/announce نص الإعلان`. يعرض لك معاينة وعدد المشتركين، اضغط «إرسال». الإرسال على دفعات (حد Cloudflare المجاني)؛ إن بقي أحد اضغط الزر مرة ثانية للمتابعة.

## ربط بوت المتجر (الجزء الذي عليك إضافته)
أضف هذه الدالة في بوت المتجر واستدعِها عند تأكيد الدفع. المفاتيح: y,j,v,x,r,n,i,k,m,a,f,s,p,c,e,t. وضع `email` إن كان عندك.

```python
import httpx

async def report_paid_order(code, items, total_usd, email=None, telegram_id=None):
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            await c.post(
                "https://<عنوان-الworker>/api/orders",
                headers={"X-Bot-Key": BOT_API_KEY},
                json={"code": code, "items": items, "total_usd": total_usd,
                      "email": email, "telegram_id": telegram_id},
            )
    except Exception:
        pass  # لا توقف التسليم بسبب الإحصائيات
```
الطلب متكرر الأمان (نفس `code` مرتين لا يُحسب مرتين). الزبون يرى مشترياته فقط إذا طابق بريده بريد الطلب.

## الاختبار
`cd worker && npm test` (يستخدم SQLite محلية بدل D1 وبريد/تيليجرام وهميين).
