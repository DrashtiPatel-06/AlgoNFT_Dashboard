"use client";
import { Card } from "@/components/ui/card";
import React, { useEffect, useState } from "react";
import { NFTs } from "../AppUrl/page";
import Navbar from "../Navbar/page";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

interface NFTData {
  arc_standard: string;
  asset_id: number;
  creator: string;
  metadata: any;
  name: string;
  unit_name: string;
  url: string;
}

interface NFTMetadata {
  [key: number]: {
    image: string;
    description: string;
  };
}

export default function NFTList() {
  const [nftList, setNftList] = useState<NFTData[]>([]);
  const [metadata, setMetadata] = useState<NFTMetadata>({});
  const [walletAddress] = useState(localStorage.getItem("walletAddress"));
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState<string>("All");

  const itemsPerPage = 9;

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!walletAddress) return;
      
      setLoading(true);
      try {
        const response = await fetch(`${NFTs}=${walletAddress}`);
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setNftList(data);
          data.forEach(async (nft: NFTData) => {
            try {
              let imageUrl = '/default-nft.gif';
              let description = 'No description available';
              
              if (nft.url?.startsWith("ipfs://")) {
                const ipfsHash = nft.url.replace("ipfs://", "").split("#")[0];
                const ipfsUrl = `https://ipfs.io/ipfs/${ipfsHash}`;

                const metadataResponse = await fetch(ipfsUrl);
                const contentType = metadataResponse.headers.get("content-type");
                
                if (contentType?.includes("application/json")) {
                  const metadataJson = await metadataResponse.json();
                  imageUrl = metadataJson.image?.replace("ipfs://", "https://ipfs.io/ipfs/") || imageUrl;
                  description = metadataJson.description || description;
                } else if (contentType?.includes("image")) {
                  imageUrl = ipfsUrl;
                }
              }

              setMetadata(prev => ({
                ...prev,
                [nft.asset_id]: { image: imageUrl, description }
              }));
            } catch (error) {
              setMetadata(prev => ({
                ...prev,
                [nft.asset_id]: {
                  image: '/default-nft.gif',
                  description: 'Metadata unavailable'
                }
              }));
            }
          });
        }
      } catch (error) {
        console.error("Error fetching NFT data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, [walletAddress]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/Background/Default.jpg';
  };

  // Filter NFTs based on selected ARC standard
  const filteredNFTs = selectedStandard === "All" 
    ? nftList 
    : nftList.filter(nft => nft.arc_standard === selectedStandard);

  // Pagination logic
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredNFTs.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredNFTs.length / itemsPerPage);

  // Get unique ARC standards for dropdown
  const arcStandards = Array.from(new Set(nftList.map(nft => nft.arc_standard)));

  return (
    <Navbar message="NFT Collections">
      {/* Filter Section */}
      <div className="flex justify-between items-center p-4">
        <Select onValueChange={setSelectedStandard} value={selectedStandard}>
          <SelectTrigger className="w-48 bg-white border border-gray-300">
            <SelectValue placeholder="Filter by ARC Standard" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            {arcStandards.map((standard) => (
              <SelectItem key={standard} value={standard}>
                {standard}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading Indicator */}
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Spinner className="w-10 h-10 text-[#473957]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
          {currentItems.length === 0 ? (
            <div className="col-span-3 flex flex-col items-center">
              <img src="/default-nft.gif" alt="No NFTs Found" className="w-64" />
              <p className="text-lg font-semibold text-purple-900 mt-4">No NFTs Available</p>
            </div>
          ) : (
            currentItems.map((nft) => (
              <Card
                key={nft.asset_id}
                className="relative overflow-hidden bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="absolute top-2 right-2 z-10">
                  <Badge className="bg-[#473957] hover:bg-[#5c4a6d] text-white">
                    {nft.arc_standard}
                  </Badge>
                </div>

                <div className="h-48 bg-gray-100 overflow-hidden">
                  <img
                    src={metadata[nft.asset_id]?.image}
                    alt={nft.name}
                    className="w-full h-full object-fill"
                    onError={handleImageError}
                  />
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-purple-950 truncate">{nft.name}</h3>
                    <span className="text-sm text-purple-900">#{nft.asset_id}</span>
                  </div>
                  
                  <p className="text-sm text-purple-900 min-h-[40px]">
                    {metadata[nft.asset_id]?.description}
                  </p>

                  <button className="w-full mt-4 bg-[#473957] hover:bg-[#5c4a6d] text-white py-2 rounded-lg transition-colors">
                    View Details
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex justify-center items-center gap-4 pb-6">
        <button
          className={`px-4 py-2 rounded-lg ${currentPage === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#473957] hover:bg-[#5c4a6d] text-white'}`}
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        
        <span className="text-purple-950 font-medium">
          Page {currentPage} of {totalPages || 1}
        </span>

        <button
          className={`px-4 py-2 rounded-lg ${currentPage === totalPages || totalPages === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#473957] hover:bg-[#5c4a6d] text-white'}`}
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          Next
        </button>
      </div>
    </Navbar>
  );
}
