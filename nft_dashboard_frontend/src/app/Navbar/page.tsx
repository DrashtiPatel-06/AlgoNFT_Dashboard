"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

export default function Navbar(props: any) {
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
            <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </div>
          <div className="space-y-6">{props.children}</div>
        </div>
      </div>
    </div>
  );
}
