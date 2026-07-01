export function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export async function openRazorpayCheckout({ orderId, amount, currency, patientName, email, phone, onSuccess, onFailure }) {
  const loaded = await loadRazorpay()
  if (!loaded) {
    onFailure?.('Razorpay failed to load. Check your connection.')
    return
  }

  const rzp = new window.Razorpay({
    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
    amount,
    currency,
    order_id: orderId,
    name: 'DrOne Hospital',
    description: 'Consultation Fee',
    handler: (response) => onSuccess?.(response),
    prefill: {
      name: patientName || '',
      email: email || '',
      contact: /^[6-9]\d{9}$/.test(phone) ? phone : '9999999999',
    },
    theme: { color: '#2563eb' },
    modal: {
      ondismiss: () => onFailure?.('Payment cancelled'),
    },
  })
  rzp.open()
}
