'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'jet_engine_store_carrinho';

export function parseCartItems(cartStr) {
  if (!cartStr) return [];
  const ids = cartStr.split(',').map(s => s.trim()).filter(Boolean);
  const countMap = {};
  ids.forEach(id => {
    countMap[id] = (countMap[id] || 0) + 1;
  });
  return Object.keys(countMap).map(id => ({
    id: isNaN(id) ? id : Number(id),
    quantity: countMap[id]
  }));
}

export function serializeCartItems(cartItems) {
  const ids = [];
  cartItems.forEach(item => {
    for (let i = 0; i < item.quantity; i++) {
      ids.push(item.id);
    }
  });
  return ids.join(',');
}

export function useCart() {
  const [cartItems, setCartItems] = useState([]);

  const reloadCart = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const cartStr = localStorage.getItem(STORAGE_KEY) || '';
      setCartItems(parseCartItems(cartStr));
    } catch (e) {
      console.error('Error reading cart from localStorage:', e);
    }
  }, []);

  useEffect(() => {
    reloadCart();

    const handleCartChanged = () => reloadCart();
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY) reloadCart();
    };

    window.addEventListener('cart_changed', handleCartChanged);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('cart_changed', handleCartChanged);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [reloadCart]);

  const updateCart = useCallback((newCartItems) => {
    setCartItems(newCartItems);
    if (typeof window !== 'undefined') {
      try {
        const cartStr = serializeCartItems(newCartItems);
        localStorage.setItem(STORAGE_KEY, cartStr);
        window.dispatchEvent(new Event('cart_changed'));
      } catch (e) {
        console.error('Error saving cart to localStorage:', e);
      }
    }
  }, []);

  const addToCart = useCallback((productId, quantity = 1) => {
    if (!productId) return;
    const targetId = isNaN(productId) ? productId : Number(productId);
    
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.id === targetId);
      let updated;
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity
        };
      } else {
        updated = [...prev, { id: targetId, quantity }];
      }

      if (typeof window !== 'undefined') {
        const cartStr = serializeCartItems(updated);
        localStorage.setItem(STORAGE_KEY, cartStr);
        window.dispatchEvent(new Event('cart_changed'));
      }

      return updated;
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    if (!productId) return;
    const targetId = isNaN(productId) ? productId : Number(productId);
    
    setCartItems(prev => {
      const updated = prev.filter(item => item.id !== targetId);
      if (typeof window !== 'undefined') {
        const cartStr = serializeCartItems(updated);
        localStorage.setItem(STORAGE_KEY, cartStr);
        window.dispatchEvent(new Event('cart_changed'));
      }
      return updated;
    });
  }, []);

  const isInCart = useCallback((productId) => {
    const targetId = isNaN(productId) ? productId : Number(productId);
    return cartItems.some(item => item.id === targetId);
  }, [cartItems]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event('cart_changed'));
    }
  }, []);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return {
    cartItems,
    cartCount,
    addToCart,
    removeFromCart,
    isInCart,
    clearCart
  };
}
