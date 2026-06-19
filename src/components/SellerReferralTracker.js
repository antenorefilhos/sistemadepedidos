'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function TrackerContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');

  useEffect(() => {
    if (!ref) return;

    const validateAndSetSeller = async () => {
      try {
        const res = await fetch(`/api/sellers?slug=${encodeURIComponent(ref)}`);
        if (res.ok) {
          const seller = await res.json();
          // Save in localStorage
          localStorage.setItem('ref_seller', JSON.stringify({
            id: seller.id,
            name: seller.name,
            phone: seller.phone,
            slug: seller.slug
          }));
          
          // Dispatch a custom event to notify other components (e.g. Header or floating bar)
          window.dispatchEvent(new Event('seller_changed'));
          console.log(`Seller referral validated: ${seller.name}`);
        } else {
          console.warn('Invalid seller referral code in URL');
        }
      } catch (err) {
        console.error('Error validating seller referral:', err);
      }
    };

    validateAndSetSeller();
  }, [ref]);

  return null;
}

export default function SellerReferralTracker() {
  return (
    <Suspense fallback={null}>
      <TrackerContent />
    </Suspense>
  );
}
