import { now } from './util.js';

function fmt(n) { return Number(n || 0).toFixed(2); }
async function send(env, message) {
  if (!env.TG_TOKEN || !env.TG_OWNER_ID || !/^\\d{1,20}$/.test(String(env.TG_OWNER_ID))) return;
  const response = await fetch('https://api.telegram.org/bot' + env.TG_TOKEN + '/sendMessage', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TG_OWNER_ID, text: message, disable_web_page_preview: true }),
  });
  if (!response.ok) throw new Error('telegram_report_failed');
}
export async function notifyOwnerNewOrder(env, order) {
  if (!env.TG_TOKEN || !env.TG_OWNER_ID || !/^\\d{1,20}$/.test(String(env.TG_OWNER_ID))) return;
  const amount = order.total_usd == null ? 'غير مسجل' : '$' + fmt(order.total_usd);
  await send(env, '🛎️ طلب مدفوع جديد وصل إلى المكتبة\\nرقم الطلب: ' + String(order.code) + '\\nالمبلغ المسجل: ' + amount + '\\nعدد المنتجات: ' + Number(order.items || 0));
}
async function periodStats(env, start, end) {
  const [totals, missing, top] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) AS orders, COALESCE(SUM(total_usd),0) AS revenue FROM orders WHERE paid_at >= ? AND paid_at < ?').bind(start, end).first(),
    env.DB.prepare('SELECT COUNT(*) AS n FROM orders WHERE paid_at >= ? AND paid_at < ? AND total_usd IS NULL').bind(start, end).first(),
    env.DB.prepare('SELECT oi.product, COUNT(*) AS n FROM order_items oi JOIN orders o ON o.code = oi.code WHERE o.paid_at >= ? AND o.paid_at < ? GROUP BY oi.product ORDER BY n DESC LIMIT 3').bind(start, end).all(),
  ]);
  return { totals, missing, top };
}
function fmtPeriod(start, end) { return new Date(start).toISOString().slice(0,10) + ' → ' + new Date(end - 1).toISOString().slice(0,10); }
function messageFor(title, period, data) {
  const products = data.top.results.map(x => x.product + ' (' + x.n + ')').join('، ') || 'لا توجد طلبات';
  return [
    title, 'الفترة: ' + period, '',
    'الطلبات: ' + Number(data.totals.orders || 0),
    'الإيراد المسجل: $' + fmt(data.totals.revenue),
    'طلبات بلا مبلغ: ' + Number(data.missing.n || 0),
    'أكثر المنتجات طلباً: ' + products, '',
    'ملاحظة: الأرقام تعكس البيانات الواردة من بوت المتجر فقط.'
  ].join('\\n');
}
export async function sendScheduledReports(env, scheduledTime = now()) {
  const end = Number(scheduledTime) || now();
  const dayStart = end - 86400000;
  const daily = await periodStats(env, dayStart, end);
  await send(env, messageFor('📊 التقرير اليومي · مكتبة الحيالي الرقمية', fmtPeriod(dayStart, end), daily));
  const d = new Date(end);
  if (d.getUTCDay() === 1) {
    const daysSinceMonday = (d.getUTCDay() + 6) % 7;
    const weekStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - daysSinceMonday, 5);
    const weekly = await periodStats(env, weekStart, end);
    await send(env, messageFor('📅 التقرير الأسبوعي · مكتبة الحيالي الرقمية', fmtPeriod(weekStart, end), weekly));
  }
  if (d.getUTCDate() === 1) {
    const monthStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 5);
    const monthly = await periodStats(env, monthStart, end);
    await send(env, messageFor('🗓️ التقرير الشهري · مكتبة الحيالي الرقمية', fmtPeriod(monthStart, end), monthly));
  }
}
