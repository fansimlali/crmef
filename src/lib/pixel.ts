declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

export const PIXEL_ID = '1174663541558187'; // CRMEF Prep Pixel

export const trackCompleteRegistration = (method = 'email') => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'CompleteRegistration', {
      content_name: 'CRMEF Free Trial Signup',
      status: 'trial',
      registration_method: method
    });
  }
};

export const trackInitiateCheckout = () => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      content_name: 'CRMEF Premium Full Bank',
      value: 50.00,
      currency: 'MAD'
    });
  }
};

export const trackPurchase = (paymentMethod: string) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Purchase', {
      content_name: 'CRMEF Full License',
      value: 50.00,
      currency: 'MAD',
      payment_method: paymentMethod
    });
  }
};

