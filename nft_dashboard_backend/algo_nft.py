import base64
from datetime import datetime, timezone
import json
from algosdk.v2client import indexer
import concurrent.futures
from collections import defaultdict

# Initialize Algorand TestNet Indexer
client = indexer.IndexerClient(indexer_address="https://testnet-idx.algonode.cloud", indexer_token="")

def fetch_all_data(wallet_address):
    """ Fetches all assets and transactions in a single indexer call """
    try:
        # Fetch account assets
        account_info = client.account_info(wallet_address)
        assets = account_info.get("account", {}).get("assets", [])
        
        # Fetch transactions related to asset transfers (NFTs)
        transactions = client.search_transactions_by_address(wallet_address, limit=1000, txn_type="axfer")
        txn_list = transactions.get("transactions", [])

        return assets, txn_list
    
    except Exception as e:
        print(f"Error fetching data: {e}")
        return [], []

def process_assets(assets):
    """ Process assets and filter NFTs """
    nfts = []
    
    # Parallel processing for asset details
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

def get_onchain_metadata(asset_id):
    """
    Fetch the on-chain metadata stored as the note field from the asset
    creation transaction, decode it, and return the JSON as a dict.
    """
    try:
        # Try to get the asset info first; sometimes the note is embedded in params
        asset_info = client.asset_info(asset_id)
        params = asset_info.get("asset", {}).get("params", {})
        note_b64 = params.get("note")
        if note_b64:
            try:
                # Assume note_b64 is a base64-encoded string; decode it.
                note_bytes = base64.b64decode(note_b64)
                metadata_str = note_bytes.decode('utf-8')
                metadata = json.loads(metadata_str)
                return metadata
            except Exception as e:
                print(f"Error decoding note from params for asset {asset_id}: {e}")
        
        # If not in params, try to fetch the asset creation transaction.
        txns = client.search_transactions(asset_id=asset_id, txn_type="acfg", limit=1)
        if "transactions" in txns and len(txns["transactions"]) > 0:
            txn = txns["transactions"][0]
            note = txn.get("note")
            if note:
                try:
                    # The note field from the transaction is base64-encoded.
                    note_bytes = base64.b64decode(note)
                    metadata_str = note_bytes.decode('utf-8')
                    metadata = json.loads(metadata_str)
                    return metadata
                except Exception as e:
                    print(f"Error decoding note from transaction for asset {asset_id}: {e}")
    except Exception as e:
        print(f"Error retrieving on-chain metadata for asset {asset_id}: {e}")
    return None

def get_asset_info(asset_id):
    """ Fetch asset details and check if it's an NFT """
    try:
        asset_info = client.asset_info(asset_id)
        params = asset_info.get("asset", {}).get("params", {})

        # Validate NFT criteria (Only 1 unit exists and no decimals)
        if params.get("total", 0) == 1 and params.get("decimals", 0) == 0:
            arc_standard = detect_arc_standard(params)
            metadata = None

            if params.get("url"):
                # Use URL-based metadata detection
                metadata = fetch_metadata(params.get("url"))
            else:
                # Attempt to retrieve on-chain metadata from the transaction note
                onchain_metadata = get_onchain_metadata(asset_id)
                if onchain_metadata:
                    metadata = onchain_metadata
                    # If the on-chain metadata explicitly declares ARC69, update the standard
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
    """ Filter NFT-related transactions """
    nft_txns = [txn for txn in txn_list if txn.get("asset-transfer-transaction")]
    return nft_txns

def get_current_month_transactions(txn_list):
    """ Filters NFT transactions for the current month """
    current_month = datetime.now(timezone.utc).month
    current_year = datetime.now(timezone.utc).year
    current_month_txns = [
        txn for txn in txn_list
        if "round-time" in txn and
        datetime.fromtimestamp(txn["round-time"], timezone.utc).month == current_month and
        datetime.fromtimestamp(txn["round-time"], timezone.utc).year == current_year
    ]

    return current_month_txns

def get_total_nft_transaction_count_current_month(txn_list):
    """ Returns the total count of NFT transactions for the current month """
    return len(get_current_month_transactions(txn_list))

def get_monthly_transaction_counts(txn_list):
    """ Returns a dictionary with the total count of NFT transactions per month """
    monthly_counts = {}  # Store counts for all years

    for txn in txn_list:
        if "round-time" in txn:
            txn_date = datetime.fromtimestamp(txn["round-time"], timezone.utc)
            month_year_key = f"{txn_date.year}-{txn_date.month:02d}"

            # Ensure the key exists
            if month_year_key not in monthly_counts:
                monthly_counts[month_year_key] = 0

            monthly_counts[month_year_key] += 1  

    return monthly_counts 

def fetch_metadata(url):
    """ Fetch external metadata (simplified) """
    if url and url.startswith(("http://", "https://")):
        return {"external_url": url}
    return None

def detect_arc_standard(params):
    """ Detect ARC standard """
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

if __name__ == "__main__":
    wallet_address = "N3WGSFVJRZ6UNRPCXUZGRQOTVQOLRLPKZILVMNWO7OYBUQM2DZBVHZEAUY"
    
    # Fetch all data in one call
    assets, txn_list = fetch_all_data(wallet_address)
    
    # Process assets (NFTs)
    nfts = process_assets(assets)
    total_nfts = len(nfts)
    
    # Process transactions (NFT transfers)
    nft_txns = process_transactions(txn_list)
    total_transactions = len(nft_txns)

    current_month_txns = get_current_month_transactions(txn_list)
    total_txn_count_current_month = get_total_nft_transaction_count_current_month(txn_list)

    monthly_transaction = get_monthly_transaction_counts(txn_list)
    print(monthly_transaction)

    # Print results
    # print(f"\nTotal NFTs: {total_nfts}")
    # print(f"Total NFT Transactions: {total_transactions}")
    # print(json.dumps(nfts, indent=2))
