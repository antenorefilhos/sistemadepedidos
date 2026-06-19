#!/usr/bin/env python3
"""
Antenor e Filhos - Solidcon ERP Synchronization Agent
This script should run on a local machine/server inside the store network.
It fetches product prices and stock from the local Solidcon ERP API (10.13.0.2:5000)
and pushes updates to the public e-commerce website.
"""

import urllib.request
import json
import time

# --- CONFIGURATION ---
LOCAL_ERP_URL = "http://10.13.0.2:5000/api/produtos" # Adjust to match exact Solidcon Swagger endpoint
WEBSITE_SYNC_URL = "https://antenorefilhos.com.br/api/sync"
SYNC_TOKEN = "antenor_sync_secret_token_123" # Replace with value from website .env.local

def fetch_local_erp():
    print(f"Fetching products from local Solidcon ERP API: {LOCAL_ERP_URL}...")
    req = urllib.request.Request(
        LOCAL_ERP_URL,
        headers={'User-Agent': 'SolidconSyncAgent/1.0'}
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            data = json.loads(response.read().decode('utf-8'))
            print(f"Successfully retrieved {len(data)} items from Solidcon.")
            return data
    except Exception as e:
        print(f"Error connecting to local Solidcon ERP: {e}")
        return None

def format_payload_for_website(erp_products):
    """
    Map Solidcon products schema to the website sync schema:
    Expected website item schema:
    {
      "sku": "string (EAN/Barcode)",
      "preco": float or null,
      "status": "on" or "off",
      "title": "string (optional)",
      "peso": "string (optional)",
      "unidade_peso": "string (optional)"
    }
    """
    payload = []
    for item in erp_products:
        # NOTE: Adjust keys below to match your actual Solidcon Swagger response!
        sku = item.get("codigoBarras") or item.get("ean") or item.get("id")
        price = item.get("precoVenda") or item.get("preco")
        stock = item.get("estoqueAtual") or item.get("saldo")
        title = item.get("descricao") or item.get("nome")
        
        # Determine status based on stock/availability
        status = "on"
        if stock is not None and stock <= 0:
            status = "off"
            
        if sku:
            payload.append({
                "sku": str(sku),
                "preco": float(price) if price is not None else None,
                "status": status,
                "title": title
            })
            
    return payload

def push_to_website(payload):
    print(f"Pushing {len(payload)} products to website: {WEBSITE_SYNC_URL}...")
    req_body = json.dumps(payload).encode('utf-8')
    
    req = urllib.request.Request(
        WEBSITE_SYNC_URL,
        data=req_body,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {SYNC_TOKEN}',
            'User-Agent': 'SolidconSyncAgent/1.0'
        },
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            print("Sync complete. Server response:")
            print(json.dumps(res_data, indent=2))
            return True
    except Exception as e:
        print(f"Error pushing data to website: {e}")
        return False

def main():
    print(f"--- SOLIDCON SYNC RUN - {time.strftime('%Y-%m-%d %H:%M:%S')} ---")
    erp_data = fetch_local_erp()
    if not erp_data:
        print("Failed to fetch local ERP data. Aborting sync.")
        return
        
    payload = format_payload_for_website(erp_data)
    if not payload:
        print("No items to sync or parsing failed. Aborting.")
        return
        
    success = push_to_website(payload)
    if success:
        print("Sync run succeeded.")
    else:
        print("Sync run failed.")

if __name__ == '__main__':
    main()
