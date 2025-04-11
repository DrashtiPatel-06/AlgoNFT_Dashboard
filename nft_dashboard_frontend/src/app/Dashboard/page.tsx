"use client";
import { Card } from "@/components/ui/card";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import React, { useEffect, useState } from "react";
import {
  NFTCount,
  TransactionCount,
  CurrentMonthTransactionCount,
  NFTs,
  MonthlyTransactions,
} from "../AppUrl/page";
import Navbar from "../Navbar/page";
import { Spinner } from "@/components/ui/spinner";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface NFTCountResponse {
  total_nfts: number;
  total_transactions: number;
  total_transactions_current_month: number;
  arc_standard: any;
  monthly_transactions: any;
}

export default function Dashboard() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [nftCount, setNftCount] = useState<number | null>(null); 
  const [transactionCount, setTransactionCount] = useState<number | null>(null); 
  const [monthTransactionCount, setMonthTransactionCount] = useState<number | null>(null); 
  const [arcCounts, setArcCounts] = useState<{ [key: string]: number }>({});
  const [arcLabels, setArcLabels] = useState<string[]>([]);
  const [monthlyTransactions, setMonthlyTransactions] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const storedWallet = localStorage.getItem("walletAddress");
    console.log(storedWallet);
    setWalletAddress(storedWallet);
  }, []);

  useEffect(() => {
    if (!walletAddress) return;

    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchNFTCount(),
          fetchTransactionCount(),
          fetchCurrentMonthTransactionCount(),
          fetchARCs(),
          fetchMonthlyTransactions(),
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false); 
      }
    };

    fetchAllData();
  }, [walletAddress]);

  const fetchNFTCount = async () => {
    try {
      const response = await fetch(`${NFTCount}=${walletAddress}`);
      const data = await response.json();
      setNftCount(data.total_nfts);
    } catch (error) {
      console.error("Error fetching NFT count:", error);
    }
  };

  const fetchTransactionCount = async () => {
    try {
      const response = await fetch(`${TransactionCount}=${walletAddress}`);
      const data = await response.json();
      setTransactionCount(data.total_transactions);
    } catch (error) {
      console.error("Error fetching Transaction count:", error);
    }
  };

  const fetchCurrentMonthTransactionCount = async () => {
    try {
      const response = await fetch(`${CurrentMonthTransactionCount}=${walletAddress}`);
      const data = await response.json();
      setMonthTransactionCount(data.total_transactions_current_month);
    } catch (error) {
      console.error("Error fetching Current Month Transaction count:", error);
    }
  };

  const fetchARCs = async () => {
    try {
      const response = await fetch(`${NFTs}=${walletAddress}`);
      const data = await response.json();
      const counts: { [key: string]: number } = {};
      data.forEach((nft: any) => {
        const arcType = nft.arc_standard ? nft.arc_standard.toUpperCase() : "UNKNOWN";
        counts[arcType] = (counts[arcType] || 0) + 1;
      });
      setArcCounts(counts);
      setArcLabels(Object.keys(counts));
    } catch (error) {
      console.error("Error fetching NFT data:", error);
    }
  };

  const fetchMonthlyTransactions = async () => {
    try {
      const response = await fetch(`${MonthlyTransactions}=${walletAddress}`);
      const data = await response.json();
      setMonthlyTransactions(data.monthly_transactions || {});
    } catch (error) {
      console.error("Error fetching monthly transactions:", error);
    }
  };

  const sortedMonths = Object.keys(monthlyTransactions).sort();
  const transactionCounts = sortedMonths.map((month) => monthlyTransactions[month]);

  const stats = [
    { title: "Total NFTs", value: `${nftCount ?? 0} NFTs` },
    { title: "Total Transactions", value: `${transactionCount ?? 0} TXNs` },
    { title: "Total Current Month Transactions", value: `${monthTransactionCount ?? 0} TXNs` },
  ];

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Monthly Transactions" },
    },
  };

  const barData = {
    labels: sortedMonths,
    datasets: [
      {
        label: "Monthly Transactions",
        data: transactionCounts,
        backgroundColor: "#6366f1",
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: "right" as const },
      title: { display: true, text: "NFT Types" },
    },
  };

  const pieData = {
    labels: arcLabels,
    datasets: [
      {
        label: "NFT Types",
        data: arcLabels.map((label) => arcCounts[label] || 0),
        backgroundColor: arcLabels.map(() => `#${Math.floor(Math.random() * 16777215).toString(16)}`),
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  return (
    <Navbar message="Dashboard Overview">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6 bg-white rounded-xl shadow-sm">
            <h3 className="text-gray-500 text-sm font-medium">{stat.title}</h3>
            {loading ? (
              <div className="mt-2">
                <Spinner />
              </div>
            ) : (
              <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
            )}
          </Card>
        ))}
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Charts and Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 bg-white rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Monthly Transactions</h2>
          <div className="h-64">
            <Bar options={barOptions} data={barData} />
          </div>
        </Card>
        <Card className="p-6 bg-white rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-4">NFT Standards</h2>
          <div className="h-70 self-center">
            <Pie options={pieOptions} data={pieData} />
          </div>
        </Card>
      </div>
    </Navbar>
  );
}