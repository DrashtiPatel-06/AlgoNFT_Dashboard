from flask import Flask, jsonify, request
import algo_nft  
from flask_cors import CORS
from flask_caching import Cache

app = Flask(__name__)
CORS(app)

# Configure cache (caches API responses for 30 seconds)
app.config['CACHE_TYPE'] = 'simple'
app.config['CACHE_DEFAULT_TIMEOUT'] = 30  
cache = Cache(app)

@cache.memoize(timeout=30)
def fetch_all_nft_data(wallet_address):
    assets, txn_list = algo_nft.fetch_all_data(wallet_address)
    return {
        "nfts": algo_nft.process_assets(assets),
        "transactions": algo_nft.process_transactions(txn_list),
    }

@app.route('/nfts', methods=['GET'])
def get_nfts():
    wallet_address = request.args.get('wallet')
    if not wallet_address:
        return jsonify({"error": "Wallet address is required"}), 400

    data = fetch_all_nft_data(wallet_address)
    return jsonify(data["nfts"])

@app.route('/nfts/total', methods=['GET'])
def get_total_nfts():
    wallet_address = request.args.get('wallet')
    if not wallet_address:
        return jsonify({"error": "Wallet address is required"}), 400

    data = fetch_all_nft_data(wallet_address)
    return jsonify({"total_nfts": len(data["nfts"])})

@app.route('/nfts/transactions', methods=['GET'])
def get_nft_transactions():
    wallet_address = request.args.get('wallet')
    if not wallet_address:
        return jsonify({"error": "Wallet address is required"}), 400

    data = fetch_all_nft_data(wallet_address)
    transaction_ids = [txn["id"] for txn in data["transactions"]]
    return jsonify({"transactions": transaction_ids})

@app.route('/nfts/transactions/total', methods=['GET'])
def get_total_nft_transactions():
    wallet_address = request.args.get('wallet')
    if not wallet_address:
        return jsonify({"error": "Wallet address is required"}), 400

    data = fetch_all_nft_data(wallet_address)
    return jsonify({"total_transactions": len(data["transactions"])})

@app.route('/nfts/transactions/current-month', methods=['GET'])
def get_current_month_nft_transactions():
    wallet_address = request.args.get('wallet')
    if not wallet_address:
        return jsonify({"error": "Wallet address is required"}), 400
    
    assets, txn_list = algo_nft.fetch_all_data(wallet_address)
    current_month_txns = algo_nft.get_current_month_transactions(txn_list)
    
    return jsonify({"current_month_transactions": current_month_txns})

@app.route('/nfts/transactions/current-month/total', methods=['GET'])
def get_total_nft_transactions_current_month():
    wallet_address = request.args.get('wallet')
    if not wallet_address:
        return jsonify({"error": "Wallet address is required"}), 400

    assets, txn_list = algo_nft.fetch_all_data(wallet_address)
    total_txn_count = algo_nft.get_total_nft_transaction_count_current_month(txn_list)
    
    return jsonify({"total_transactions_current_month": total_txn_count})

@app.route('/nfts/transactions/monthly', methods=['GET'])
def get_monthly_nft_transactions():
    wallet_address = request.args.get('wallet')
    if not wallet_address:
        return jsonify({"error": "Wallet address is required"}), 400

    data = fetch_all_nft_data(wallet_address)
    monthly_counts = algo_nft.get_monthly_transaction_counts(data["transactions"])
    
    return jsonify({"monthly_transactions":monthly_counts})

@app.route('/nfts/update_profile', methods=['POST'])
def update_profile():
    data = request.json
    full_name = data.get("full_name")
    email = data.get("email")
    wallet_address = data.get("wallet_address")
    bio = data.get("bio", "")
    profile_image = data.get("profile_image", "")

    updated_data = algo_nft.update_user_profile(full_name, email, wallet_address, bio, profile_image)

    if "error" in updated_data:
        return jsonify(updated_data), 400  

    return jsonify({
        "message": "Profile updated successfully!",
        "profile": {
            "full_name": full_name,
            "email": email,
            "wallet_address": wallet_address,
            "bio": bio,
            "profile_image": profile_image
        }
    }), 200

@app.route('/nfts/profile', methods=['GET'])
def get_profile():
    wallet_address = request.args.get('wallet')
    if not wallet_address:
        return jsonify({"error": "Wallet address is required"}), 400

    profile = algo_nft.fetch_user_profile(wallet_address)
    if profile is None:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"profile": profile}), 200
    
if __name__ == '__main__':
    app.run(debug=True, port=5000)
