"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PeraWalletConnect } from "@perawallet/connect";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function WalletConnect() {
  const [account, setAccount] = useState<string | null>(null);
  const peraWallet = new PeraWalletConnect();
  const router = useRouter();

  useEffect(() => {

    const checkConnection = async () => {
      const storedAddress = localStorage.getItem("walletAddress");
      if (!storedAddress) {
        await peraWallet.disconnect();
        return;
      }
      
      try {
        const accounts = await peraWallet.reconnectSession();
        if (accounts.length) {
          setAccount(accounts[0]);
          router.push("/Dashboard");
        }
      } catch (error) {
        console.log("No existing session");
      }
    };
    
    checkConnection();
  }, []);

  const connectWallet = async () => {
    try {
      await peraWallet.disconnect();
      
      const accounts = await peraWallet.connect();
      localStorage.setItem("walletAddress", accounts[0]);
      router.push("/Dashboard");
    } catch (error) {
      console.error("Connection failed:", error);
      localStorage.removeItem("walletAddress");
      await peraWallet.disconnect();
    }
  };

  // const disconnectWallet = () => {
  //   peraWallet.disconnect();
  //   setAccount(null);
  //   setIsConnected(false);
  // };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-6">
      <div className="flex flex-col lg:flex-row shadow-xl w-full max-w-5xl bg-white rounded-xl overflow-hidden">
        
        <div className="hidden lg:block lg:w-1/2">
          <img
            src="/Background/NFT-bg2.png"
            alt="NFT Background"
            className="w-110 h-110 object-fill"
          />
        </div>

        <div className="w-full lg:w-2/3 p-8 flex flex-col">
          <h2 className="text-3xl font-bold text-gray-800">
            Step into the Ultimate NFT Marketplace ✦
          </h2>
          <p className="text-gray-600 mt-2 mb-4">
            Monitor your assets, explore opportunities, and trade directly from your personalized dashboard.
          </p>
          <div className="self-center">
          <img
            src="/GIF/NFT.gif"
            alt="NFT Background"
            className="w-35 h-30"
          />
          </div>
          
          <div className="mt-4">
            {/* {isConnected ? (
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-gray-700">Connected Account:</p>
                <p className="text-lg font-medium text-[#473957] truncate">{account}</p>
                <Button
                  variant="destructive"
                  onClick={disconnectWallet}
                  className="mt-4 w-full"
                >
                  Disconnect Wallet
                </Button>
              </div>
            ) : ( */}
              <Button
                variant="default"
                className="w-full bg-[#473957] hover:bg-[#8a77bd] text-white py-3 cursor-pointer"
                onClick={connectWallet}
              >
                Connect Pera Wallet
              </Button>
            {/* )} */}
             <p className="text-sm text-gray-600 mt-2">
            Don't have a wallet?{" "}
            <a
              href="https://perawallet.app/"
              className="text-[#3b2e49] hover:text-[#8674be] underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get Pera Wallet
            </a>
          </p>
          </div>
        </div>
      </div>
    </div>
  );
}
