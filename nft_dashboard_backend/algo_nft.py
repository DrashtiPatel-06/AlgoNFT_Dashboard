import base64
from datetime import datetime, timezone
import json
from algosdk.v2client import indexer
import concurrent.futures
import sqlite3

client = indexer.IndexerClient(indexer_address="https://testnet-idx.algonode.cloud", indexer_token="")

# Fetch all the data through indexer API 
def fetch_all_data(wallet_address):
    try:
        account_info = client.account_info(wallet_address)
        assets = account_info.get("account", {}).get("assets", [])
        transactions = client.search_transactions_by_address(wallet_address)
        txn_list = transactions.get("transactions", [])

        return assets, txn_list
    
    except Exception as e:
        print(f"Error fetching data: {e}")
        return [], []

# Process assets fetch from the Indexer API
def process_assets(assets):
    nfts = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(get_asset_info, asset["asset-id"]): asset for asset in assets}
        
        for future in concurrent.futures.as_completed(futures):
            try:
                asset_data = future.result()
                if asset_data:
                    nfts.append(asset_data)
            except Exception as e:
                continue
    
    return nfts

# Onchain Metdata 
def get_onchain_metadata(asset_id):
    try:
        asset_info = client.asset_info(asset_id)
        params = asset_info.get("asset", {}).get("params", {})
        note_b64 = params.get("note")
        if note_b64:
            try:
                note_bytes = base64.b64decode(note_b64)
                metadata_str = note_bytes.decode('utf-8')
                metadata = json.loads(metadata_str)
                return metadata
            except Exception as e:
                print(f"Error decoding note from params for asset {asset_id}: {e}")
        
        txns = client.search_transactions(asset_id=asset_id, txn_type="acfg", limit=1)
        if "transactions" in txns and len(txns["transactions"]) > 0:
            txn = txns["transactions"][0]
            note = txn.get("note")
            if note:
                try:
                    note_bytes = base64.b64decode(note)
                    metadata_str = note_bytes.decode('utf-8')
                    metadata = json.loads(metadata_str)
                    return metadata
                except Exception as e:
                    print(f"Error decoding note from transaction for asset {asset_id}: {e}")
    except Exception as e:
        print(f"Error retrieving on-chain metadata for asset {asset_id}: {e}")
    return None

# Asset information for a specific assets
def get_asset_info(asset_id):
    try:
        asset_info = client.asset_info(asset_id)
        params = asset_info.get("asset", {}).get("params", {})

        if params.get("total", 0) == 1 and params.get("decimals", 0) == 0:
            arc_standard = detect_arc_standard(params)
            metadata = None

            if params.get("url"):
                metadata = fetch_metadata(params.get("url"))
            else:
                onchain_metadata = get_onchain_metadata(asset_id)
                if onchain_metadata:
                    metadata = onchain_metadata
                    if onchain_metadata.get("standard") == "arc69":
                        arc_standard = "arc69"
                    
            return {
                "asset_id": asset_id,
                "name": params.get("name", "Unnamed"),
                "unit_name": params.get("unit-name", ""),
                "url": params.get("url", ""),
                "creator": params.get("creator", ""),
                "arc_standard": arc_standard,
                "metadata": fetch_metadata(params.get("url")) if params.get("url") else None,
            }
    except Exception:
        return None
    return None

def process_transactions(txn_list):
    nft_txns = [txn for txn in txn_list if txn.get("asset-transfer-transaction")]
    return nft_txns

# Current month NFT Transaction
def get_current_month_transactions(txn_list):
    current_month = datetime.now(timezone.utc).month
    current_year = datetime.now(timezone.utc).year
    current_month_txns = [
        txn for txn in txn_list
        if "round-time" in txn and
        datetime.fromtimestamp(txn["round-time"], timezone.utc).month == current_month and
        datetime.fromtimestamp(txn["round-time"], timezone.utc).year == current_year
    ]

    return current_month_txns

# Total NFT Transaction Count
def get_total_nft_transaction_count_current_month(txn_list):
    return len(get_current_month_transactions(txn_list))

# Monthly NFT Transaction Count
def get_monthly_transaction_counts(txn_list):
    monthly_counts = {} 

    for txn in txn_list:
        if "round-time" in txn:
            txn_date = datetime.fromtimestamp(txn["round-time"], timezone.utc)
            month_year_key = f"{txn_date.year}-{txn_date.month:02d}"

            if month_year_key not in monthly_counts:
                monthly_counts[month_year_key] = 0

            monthly_counts[month_year_key] += 1  

    return monthly_counts 

def fetch_metadata(url):
    if url and url.startswith(("http://", "https://")):
        return {"external_url": url}
    return None

# ARC Standards
def detect_arc_standard(params):
    url = params.get("url", "")
    
    if params.get("standard") in ("arc3", "arc19", "arc69"):
        return params["standard"]
    
    if url:
        if url.startswith("ipfs://") or "#arc3" in url.lower():
            return "arc3"
        if url.startswith("template-ipfs://"):
            return "arc19"
        if ".json" in url or url.endswith("/metadata.json"):
            return "arc69"

    return "unknown"

# Database section

def get_db_connection():
    conn = sqlite3.connect("nft_marketplace.db")
    conn.row_factory = sqlite3.Row
    return conn

def update_user_profile(full_name, email, wallet_address, bio="", profile_image=""):
    if not full_name or not email or not wallet_address:
        return {"error": "Full name, email, and wallet address are required."}

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS nft_user (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                wallet_address TEXT UNIQUE NOT NULL,
                bio TEXT,
                profile_image TEXT
            )
        """)

        cursor.execute("SELECT * FROM nft_user WHERE wallet_address = ?", (wallet_address,))
        existing_user = cursor.fetchone()

        if existing_user:
            cursor.execute("""
                UPDATE nft_user 
                SET full_name = ?, email = ?, bio = ?, profile_image = ?
                WHERE wallet_address = ?
            """, (full_name, email, bio, profile_image, wallet_address))
        else:
            cursor.execute("""
                INSERT INTO nft_user (full_name, email, wallet_address, bio, profile_image)
                VALUES (?, ?, ?, ?, ?)
            """, (full_name, email, wallet_address, bio, profile_image))

        conn.commit()
        conn.close()
        return {"message": "Profile updated successfully!"}
    
    except Exception as e:
        return {"error": str(e)}

def fetch_user_profile(wallet_address):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT full_name, email, wallet_address, bio, profile_image 
            FROM nft_user 
            WHERE wallet_address = ?
        """, (wallet_address,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        else:
            return None
    except Exception as e:
        print(f"Error fetching user profile: {e}")
        return None



if __name__ == "__main__":
    wallet_address = "N3WGSFVJRZ6UNRPCXUZGRQOTVQOLRLPKZILVMNWO7OYBUQM2DZBVHZEAUY"

    assets, txn_list = fetch_all_data(wallet_address)
    
    nfts = process_assets(assets)
    total_nfts = len(nfts)
    
    nft_txns = process_transactions(txn_list)
    total_transactions = len(nft_txns)

    current_month_txns = get_current_month_transactions(txn_list)
    total_txn_count_current_month = get_total_nft_transaction_count_current_month(txn_list)

    monthly_transaction = get_monthly_transaction_counts(txn_list)
    print(monthly_transaction)

    # print(f"\nTotal NFTs: {total_nfts}")
    # print(f"Total NFT Transactions: {total_transactions}")
    # print(json.dumps(nfts, indent=2))
