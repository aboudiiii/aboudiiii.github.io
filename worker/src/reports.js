import { now } from './util.js';

function fmt(n) { return Number(n || 0).toFixed(2); }
async function send(env, message) {
  if (!env.TG_TOKEN || !env.TG_OWNER_ID || !/^\d{1,20}$/.test(String(env.TG_OWNER_ID))) return;
  const response = await fetch('https://api.telegram.org/bot' + env.TG_TOKEN + '/sendMessage', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TG_OWNER_ID, text: message, disable_web_page_preview: true }),
  });
  if (!response.ok) throw new Error('telegram_report_failed');
}
export async function sendScheduledReports(env, scheduledTime = now()) {
  const end = Number(scheduledTime) || now(), start = end - 86400000;
  const [day, totals, missing, top] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) AS orders, COALESCE(SUM(total_usd),0) AS revenue FROM orders WHERE paid_at >= ? AND paid_at < ?').bind(start, end).first(),
    env.DB.prepare('SELECT COUNT(*) AS orders, COALESCE(SUM(total_usd),0) AS revenue FROM orders').first(),
    env.DB.prepare('SELECT COUNT(*) AS n FROM orders WHERE total_usd IS NULL').first(),
    env.DB.prepare('SELECT product, COUNT(*) AS n FROM order_items GROUP BY product ORDER BY n DESC LIMIT 3').all(),
  ]);
  const d = new Date(end), stamp = d.toISOString().slice(0, 10);
  const products = top.results.map(x => x.product + ' (' + x.n + ')').join('، ') || 'لا توجد طلبات';
  const lines = [
    '📊 تقرير مكتبة الحيالي الرقمية',
    'التاريخ: ' + stamp,
    '',
    'آخر 24 ساعة:',
    'الطلبات: ' + Number(day.orders || 0),
    'الإيراد المسجل: $' + fmt(day.revenue),
    '',
    'الإجمالي المسجل:',
    'الطلبات: ' + Number(totals.orders || 0),
    'الإيرادات: $' + fmt(totals.revenue),
    'طلبات بلا مبلغ: ' + Number(missing.n || 0),
    'أكثر المنتجات طلباً: ' + products,
    '',
    'ملاحظة: الأرقام تعكس البيانات الواردة من بوت المتجر فقط.'
  ];
  const message = lines.join('\n');
  await send(env, message);
  if (d.getUTCDay() === 1) await send(env, '📅 التقرير الأسبوعي للمكتبة\n' + message);
  if (d.getUTCDate() === 1) await send(env, '🗓️ التقرير الشهري للمكتبة\n' + message);
}
