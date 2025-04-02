from flask import Flask, jsonify, request
import algo_nft  

app = Flask(__name__)

@app.route('/nfts', methods=['GET'])
def get_nfts():
    wallet_address = request.args.get('wallet')
    if not wallet_address:
        return jsonify({"error": "Wallet address is required"}), 400
    nfts = algo_nft.get_testnet_nfts(wallet_address)
    return jsonify(nfts)

@app.route('/nfts/total', methods=['GET'])
def get_total_nfts():
    wallet_address = request.args.get('wallet')
    if not wallet_address:
        return jsonify({"error": "Wallet address is required"}), 400
    total = algo_nft.total_nft(wallet_address)
    return jsonify({"total_nfts": total})

@app.route('/nfts/transactions', methods=['GET'])
def get_nft_transactions():
    wallet_address = request.args.get('wallet')
    if not wallet_address:
        return jsonify({"error": "Wallet address is required"}), 400
    transactions = algo_nft.get_nft_transaction_history(wallet_address, limit=1000)
    return jsonify({"transactions": transactions})

@app.route('/nfts/transactions/total', methods=['GET'])
def get_total_nft_transactions():
    wallet_address = request.args.get('wallet')
    if not wallet_address:
        return jsonify({"error": "Wallet address is required"}), 400
    total = algo_nft.total_nft_transaction(wallet_address)
    return jsonify({"total_transactions": total})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
