"use client";
import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import Navbar from "../../components/navbar";
import { API_URLS } from "@/constants/apiUrls";
import { Toaster, toast } from "sonner";

interface NFTTransfer {
  "asset-id": number;
  name: string;
  "unit-name": string;
  arc_standard: string;
  transfers: {
    sender: string;
    receiver: string;
    tx_id: string;
  }[];
}

export default function NFTTransfers() {
  const [nftData, setNftData] = useState<NFTTransfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStandard, setSelectedStandard] = useState("All");
  const [expandedAsset, setExpandedAsset] = useState<number | null>(null);
  const [walletAddress, setWalletAddress] = useState("");
  const itemsPerPage = 10;

  const fetchNFTTransfers = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_URLS.AssetTransfer}=${walletAddress}`
      );
      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();
      setNftData(data.assets || []);
    } catch (err) {
      setError("Failed to load NFT transfer data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedWallet = localStorage.getItem("walletAddress");
    if (storedWallet) setWalletAddress(storedWallet);
  }, []);

  useEffect(() => {
    if (walletAddress) {
      fetchNFTTransfers();
      localStorage.setItem("walletAddress", walletAddress);
    }
  }, [walletAddress]);

  const filteredData = selectedStandard === "All"
    ? nftData
    : nftData.filter(nft => nft.arc_standard === selectedStandard);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const truncateAddress = (address: string | null) => {
    if (!address) return "N/A";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success("Copied to clipboard!"))
      .catch(() => toast.error("Failed to copy"));
  };


  const handleRowExpand = (assetId: number) => {
    setExpandedAsset(prev => prev === assetId ? null : assetId);
  };

  return (
    <Navbar message="NFT Transfer History">
      <div className="p-6 max-w-7xl mx-auto">
        <Toaster position="bottom-right" expand={false} richColors />
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input
            placeholder="Enter Algorand wallet address"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="flex-1"
            disabled
          />
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner className="w-8 h-8 text-gray-700" />
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Unit Name</TableHead>
                    <TableHead>Transfers</TableHead>
                    <TableHead className="text-center">Details</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((nft) => (
                    <React.Fragment key={nft["asset-id"]}>
                      <TableRow>
                        <TableCell className="font-mono">
                          #{nft["asset-id"]}
                        </TableCell>
                        <TableCell>{nft.name}</TableCell>
                        <TableCell>
                          <Badge>{nft["unit-name"]}</Badge>
                        </TableCell>
                        <TableCell>{nft.transfers.length}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRowExpand(nft["asset-id"])}
                          >
                            {expandedAsset === nft["asset-id"] ? "▲ Hide" : "▼ Show"}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedAsset === nft["asset-id"] && (
                        <TableRow className="bg-gray-50">
                          <TableCell colSpan={6} className="p-4">
                            <div className="border rounded-lg overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Transaction ID</TableHead>
                                    <TableHead>From</TableHead>
                                    <TableHead>To</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {nft.transfers.map((transfer) => (
                                    <TableRow key={transfer.tx_id}>
                                      <TableCell className="font-mono text-sm">
                                        {truncateAddress(transfer.tx_id)}
                                        <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-1 cursor-pointer"
                                  onClick={() => copyToClipboard(transfer.tx_id)}
                                >
                                  📋
                                </Button>
                                      </TableCell>
                                      <TableCell className="font-mono">
                                        {truncateAddress(transfer.sender)}
                                      </TableCell>
                                      <TableCell className="font-mono">
                                        {truncateAddress(transfer.receiver)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>

            {currentItems.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-500">
                No NFT transfer history found for this wallet
              </div>
            )}

            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, filteredData.length)} of{" "}
                {filteredData.length} results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Navbar>
  );
}