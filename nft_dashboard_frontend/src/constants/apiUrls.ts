
const url = "http://127.0.0.1:5000";

export const API_URLS = {
  NFTCount: `${url}/nfts/total?wallet`,
  TransactionCount: `${url}/nfts/transactions/total?wallet`,
  CurrentMonthTransactionCount: `${url}/nfts/transactions/current-month/total?wallet`,
  NFTs: `${url}/nfts?wallet`,
  MonthlyTransactions: `${url}/nfts/transactions/monthly?wallet`,
  userProfile: `${url}/nfts/profile?wallet`,
  updateuserProfile: `${url}/nfts/update_profile`
};