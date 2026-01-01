// Stripe Webhook handler (Vercel Serverless Function)
// - Verifies Stripe signature with STRIPE_WEBHOOK_SECRET
// - Idempotent via public.stripe_webhook_events (event_id)
// - Marks orders paid/failed and decrements stock atomically via RPC

import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req: any): Promise<Buffer> {
  // Vercel may provide rawBody/body already
  if (req?.rawBody && Buffer.isBuffer(req.rawBody)) return req.rawBody;
  if (Buffer.isBuffer(req?.body)) return req.body;
  if (typeof req?.body === 'string') return Buffer.from(req.body, 'utf8');

  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function getEnv(name: string): string | undefined {
  return process.env[name];
}

function getSupabaseAdmin() {
  const url = getEnv('SUPABASE_URL') || getEnv('VITE_SUPABASE_URL');
  const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const stripeSecretKey = getEnv('STRIPE_SECRET_KEY');
  const webhookSecret = getEnv('STRIPE_WEBHOOK_SECRET');
  if (!stripeSecretKey || !webhookSecret) {
    return res.status(500).json({ error: 'Stripe webhook env is missing' });
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY is missing' });
  }

  const signature = req.headers['stripe-signature'];
  if (!signature) return res.status(400).send('Missing stripe-signature');

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey);

    const rawBody = await readRawBody(req);
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    // Idempotency: record Stripe event id
    const { error: idemErr } = await supabaseAdmin
      .from('stripe_webhook_events')
      .insert([{ event_id: event.id }]);
    if (idemErr) {
      // unique violation => already processed
      if (String(idemErr.code) === '23505') {
        return res.status(200).json({ received: true, duplicate: true });
      }
      // other error: still continue (service role should usually bypass RLS)
      console.warn('stripe_webhook_events insert error:', idemErr);
    }

    if (event.type === 'payment_intent.succeeded') {
      const pi: any = event.data.object;
      const paymentIntentId = pi.id as string;
      const amountReceived = Number(pi.amount_received ?? pi.amount ?? 0);

      const { data: order, error: orderErr } = await supabaseAdmin
        .from('orders')
        .select('id, total, payment_status, coupon_id')
        .eq('payment_intent_id', paymentIntentId)
        .maybeSingle();

      if (orderErr) throw orderErr;
      if (!order) {
        // Order draft not found (race). Acknowledge to Stripe; operator can investigate.
        return res.status(200).json({ received: true, warning: 'order_not_found' });
      }

      // Amount check (JPY assumed)
      if (Number(order.total) !== amountReceived) {
        console.error('Amount mismatch', { orderTotal: order.total, amountReceived, paymentIntentId });
        // Still acknowledge to avoid retries storm; keep order pending for manual handling
        return res.status(200).json({ received: true, warning: 'amount_mismatch' });
      }

      if (order.payment_status !== 'paid') {
        const { error: updErr } = await supabaseAdmin
          .from('orders')
          .update({
            payment_status: 'paid',
            paid_at: new Date().toISOString(),
            payment_method: (pi.payment_method_types && pi.payment_method_types[0]) || 'card',
          })
          .eq('id', order.id);
        if (updErr) throw updErr;

        // Decrement stock for each order item (atomic inside RPC)
        const { data: items, error: itemsErr } = await supabaseAdmin
          .from('order_items')
          .select('product_id, quantity, selected_options')
          .eq('order_id', order.id);
        if (itemsErr) throw itemsErr;

        for (const it of items || []) {
          const pid = it.product_id;
          const qty = Number(it.quantity || 0);
          const selected = it.selected_options ?? null;
          if (!pid || !qty) continue;
          const { error: rpcErr } = await supabaseAdmin.rpc('decrement_product_stock', {
            p_product_id: pid,
            p_selected_options: selected,
            p_qty: qty,
          });
          if (rpcErr) {
            console.error('decrement_product_stock failed', { pid, qty, rpcErr });
            // keep going; manual handling may be required
          }
        }

        // クーポンの使用回数を増やす
        if (order.coupon_id) {
          const { error: couponErr } = await supabaseAdmin.rpc('increment_coupon_usage', {
            p_coupon_id: order.coupon_id,
          });
          if (couponErr) {
            console.error('increment_coupon_usage failed', { couponId: order.coupon_id, couponErr });
            // keep going; manual handling may be required
          }
        }
      }

      return res.status(200).json({ received: true });
    }

    if (event.type === 'payment_intent.payment_failed') {
      const pi: any = event.data.object;
      const paymentIntentId = pi.id as string;
      await supabaseAdmin
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('payment_intent_id', paymentIntentId);
      return res.status(200).json({ received: true });
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('stripe webhook error', err);
    return res.status(400).send(`Webhook Error: ${err.message || 'unknown'}`);
  }
}


