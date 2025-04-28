"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { API_URLS } from '@/constants/apiUrls';
import { useEffect, useState,useCallback } from "react";

// interface UserInterface {
//   profile_image: string;
// }

interface NavbarProps {
 message: string;
     children?: React.ReactNode;
  }

export default function Navbar(props: NavbarProps) {
  const [pictureData, setPictureData] = useState({
    profileImage: "https://github.com/shadcn.png",
  });
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
   useEffect(() => {
      const storedWallet = localStorage.getItem("walletAddress");
      setWalletAddress(storedWallet);
    }, []);
    const userData = useCallback(async () => {
    try {
      if (!walletAddress) return;
      const response = await fetch(`${API_URLS.userProfile}=${walletAddress}`);
      if (!response.ok) throw new Error("Failed to fetch user data");

      const responseData = await response.json();
      const userProfileData = responseData.profile;
      if (userProfileData) {
        setPictureData({
          profileImage:
            userProfileData.profile_image || "https://github.com/shadcn.png",
        });
      } else {
        throw new Error("Profile not found in response");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }, [walletAddress]);

  useEffect(() => {
    userData();
  }, [userData]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex flex-row p-4 gap-4">
        {/* Sidebar */}
        <div className="w-64 bg-white rounded-xl p-4 shadow-sm h-[calc(100vh-2rem)] sticky top-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            NFT Marketplace
          </h2>
          <nav className="space-y-2">
            {[
              { name: "Dashboard", path: "/Dashboard" },
              { name: "NFT Collection", path: "/NFTList" },
              { name: "Profile Setting", path: "/Profile" },
            ].map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className="flex items-center p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              {props.message}
            </h1>
            <Link href="/Profile">
              <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                <AvatarImage
                  src={pictureData.profileImage}
                  alt="Profile"
                  onError={(e) => {
                    e.currentTarget.src = "https://github.com/shadcn.png";
                  }}
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </Link>
          </div>
          <div className="space-y-6">{props.children}</div>
        </div>
      </div>
    </div>
  );
}
