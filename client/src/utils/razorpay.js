import api from '../services/api';

const loadScript = () => new Promise((resolve, reject) => {
  if (window.Razorpay) return resolve();
  const s = document.createElement('script');
  s.src = 'https://checkout.razorpay.com/v1/checkout.js';
  s.onload = resolve;
  s.onerror = () => reject(new Error('Could not load the payment window. Check your connection and try again.'));
  document.body.appendChild(s);
  return undefined;
});

// Opens Razorpay Checkout for an existing PENDING order. Card details never touch our servers.
export async function payOrder({ orderId, navigate, toast }) {
  try {
    await loadScript();
    const d = (await api.post('/payments/create-order', { orderId })).data.data;
    await new Promise((resolve) => {
      const rzp = new window.Razorpay({
        key: d.keyId, amount: d.amount, currency: d.currency, order_id: d.razorpayOrderId,
        name: 'Lumora Candles', description: `Order ${d.orderNumber}`, prefill: d.prefill, theme: { color: '#5B3A4A' },
        handler: async (resp) => {
          try { await api.post('/payments/verify', { orderId, ...resp }); navigate(`/order-success/${orderId}`); }
          catch (e) { toast(e.userMessage, 'error'); navigate(`/payment-failed?order=${orderId}`); }
          resolve();
        },
        modal: { ondismiss: () => { toast('Payment not completed. You can pay from your orders page.', 'error'); navigate(`/account/orders/${orderId}`); resolve(); } },
      });
      rzp.on('payment.failed', async (r) => {
        try { await api.post('/payments/failed', { orderId, reason: r.error?.description }); } catch (_) { /* ignore */ }
        navigate(`/payment-failed?order=${orderId}`); resolve();
      });
      rzp.open();
    });
  } catch (e) {
    toast(e.userMessage || e.message, 'error');
  }
}
