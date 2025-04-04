import json
from algosdk.v2client import indexer
from retrying import retry
import concurrent.futures

client = indexer.IndexerClient(indexer_address="https://testnet-idx.algonode.cloud",indexer_token="")

def get_testnet_nfts(wallet_address):
    # Algonode TestNet Indexer configuration
    
    try:
        # Get account assets with pagination
        account_assets = client.lookup_account_assets(wallet_address, limit=1000)
        assets = account_assets.get('assets', [])
        
        nfts = []
        
        # Parallel processing with thread pool
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = []
            for asset in assets:
                futures.append(executor.submit(process_asset, client, asset))
            
            for i, future in enumerate(concurrent.futures.as_completed(futures), 1):
                try:
                    result = future.result()
                    if result:
                        nfts.append(result)
                        print(f"\rProcessed {i}/{len(assets)} assets", end="")
                except Exception as e:
                    continue
                    
        return nfts
    
    except Exception as main_error:
        print(f"\nMain Error: {str(main_error)}")
        return []

def process_asset(client, asset):
    asset_id = asset['asset-id']
    try:
        asset_info = get_asset_info_with_retry(client, asset_id)
        params = asset_info['asset']['params']
        
        # Early exit for non-NFTs
        if params.get('total', 0) != 1 or params.get('decimals', 0) != 0:
            return None
            
        return {
            'asset_id': asset_id,
            'name': params.get('name', 'Unnamed'),
            'unit_name': params.get('unit-name', ''),
            'url': params.get('url', ''),
            'creator': params.get('creator', ''),
            'arc_standard': detect_arc_standard(params),
            'metadata': fetch_metadata(params.get('url')) if params.get('url') else None
        }
        
    except Exception as e:
        return None

   
def fetch_metadata(url):
    """Fetch external metadata if needed (simplified example)"""
    if not url or not url.startswith(('http://', 'https://')):
        return None
        
    try:
        # In production, use proper async HTTP client
        return {"external_url": url}
    except:
        return None

def detect_arc_standard(params):
    """Detect ARC standard from asset parameters"""
    url = params.get('url', '')
    
    # Check for explicit standard in params
    if params.get('standard') in ('arc3', 'arc19', 'arc69'):
        return params['standard']
    
    # URL pattern detection
    if url:
        if url.startswith('ipfs://') or '#arc3' in url.lower():
            return 'arc3'
        if url.startswith('template-ipfs://'):
            return 'arc19'
        if '.json' in url or url.endswith('/metadata.json'):
            return 'arc69'
    
    return 'unknown'

def total_nft(wallet_address):
    nfts = get_testnet_nfts(wallet_address)
    return len(nfts)

def total_nft_transaction(wallet_address):
    nfts = get_nft_transaction_history(wallet_address,limit=1000)
    return len(nfts)

def get_nft_transaction_history(wallet_address, limit=100):
    """Fetch NFT-related transactions from the Algonode TestNet Indexer."""
    
    try:
        transactions = client.search_transactions_by_address(wallet_address, limit=limit, txn_type="axfer")
        txn_list = transactions.get('transactions', [])
       
        nft_txns = [txn.get('id') for txn in txn_list if txn.get('asset-transfer-transaction')]
        # nft_txns = []
        # for txn in txn_list:
        #     # Extract asset ID from transaction
        #     asset_transfer = txn.get('asset-transfer-transaction', {})
        #     asset_id = asset_transfer.get('asset-id')
            
        #     # Skip transactions without an asset ID
        #     if asset_id is None:
        #         continue
                
        #     amount = asset_transfer.get('amount', 0)
        #     sender = txn.get('sender', '')
        #     receiver = asset_transfer.get('receiver', '')
        #     timestamp = txn.get('round-time', 0)

        #     try:
        #         # Fetch asset details to confirm it's an NFT
        #         asset_info = get_asset_info_with_retry(client, asset_id)
        #         params = asset_info.get('asset', {}).get('params', {})
                
        #         if params.get('total', 0) == 1 and params.get('decimals', 0) == 0:
        #             nft_txns.append({
        #                 "asset_id": asset_id,
        #                 "name": params.get('name', 'Unnamed'),
        #                 "sender": sender,
        #                 "receiver": receiver,
        #                 "timestamp": timestamp,
        #                 "amount": amount
        #             })
        #     except Exception as e:
        #         # Handle errors fetching asset info
        #         print(f"Error processing asset {asset_id}: {str(e)}")
        #         continue
        
        return nft_txns
    
    except Exception as e:
        print(f"Error fetching transactions: {str(e)}")
        return []
    
@retry(stop_max_attempt_number=5, wait_exponential_multiplier=1000, wait_exponential_max=10000)
def get_asset_info_with_retry(client, asset_id):
    return client.asset_info(asset_id)

if __name__ == "__main__":
    wallet_address = "N3WGSFVJRZ6UNRPCXUZGRQOTVQOLRLPKZILVMNWO7OYBUQM2DZBVHZEAUY"
    nfts = get_testnet_nfts(wallet_address)
    total = total_nft(wallet_address)
    print(f"\nTotal NFTs: {total}")

    nft_txns = get_nft_transaction_history(wallet_address, limit=1000)
    print("Transaction IDs:",nft_txns)
    
    print("Total Transactions:",total_nft_transaction(wallet_address))
    print(f"Found {len(nfts)} NFTs in wallet {wallet_address}")
    print(json.dumps(nfts, indent=2))
