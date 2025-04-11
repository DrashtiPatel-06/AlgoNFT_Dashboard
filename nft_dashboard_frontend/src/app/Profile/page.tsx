"use client";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Navbar from "../Navbar/page";
import { userProfile, updateuserProfile } from "../AppUrl/page";
import { PeraWalletConnect } from "@perawallet/connect";

interface UserInterface {
  full_name: string;
  email: string;
  wallet_address: string;
  bio: string;
  profile_image: string;
}

export default function ProfileSettings() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
    profileImage: "https://github.com/shadcn.png",
  });
  const [walletAddress] = useState(localStorage.getItem("walletAddress") || "");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    userData();
  }, []);

  const userData = async () => {
    try {
      const response = await fetch(`${userProfile}=${walletAddress}`);
      if (!response.ok) throw new Error("Failed to fetch user data");
      
    const responseData = await response.json();
    const userProfileData = responseData.profile;
      if (userProfileData) {
        setFormData({
          name: userProfileData.full_name || "",
          email: userProfileData.email || "",
          bio: userProfileData.bio || "",
          profileImage: userProfileData.profile_image || "https://github.com/shadcn.png",
        });
      } else {
        throw new Error("Profile not found in response");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateuserData = async () => {
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const response = await fetch(updateuserProfile, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: formData.name,
          email: formData.email,
          bio: formData.bio,
          profile_image: formData.profileImage,
          wallet_address: walletAddress,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Update failed");
      }

      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      userData();
    } catch (error: any) {
      setErrors(prev => ({ ...prev, form: error.message }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setFormData(prev => ({
            ...prev,
            profileImage: reader.result as string
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email format";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateuserData();
  };

  return (
    <Navbar message="Profile Settings">
      <Card className="p-8 max-w-3xl mx-auto">
        {isLoading ? (
          <div className="text-center py-8">Loading profile data...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Feedback Messages */}
            {successMessage && (
              <div className="p-4 bg-green-100 text-green-700 rounded-lg">
                {successMessage}
              </div>
            )}
            {errors.form && (
              <div className="p-4 bg-red-100 text-red-700 rounded-lg">
                {errors.form}
              </div>
            )}

            <div className="flex flex-col items-center gap-4 mb-8">
              <label htmlFor="profile-upload" className="cursor-pointer relative">
                <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                  <AvatarImage 
                    src={formData.profileImage} 
                    alt="Profile"
                    onError={(e) => {
                      e.currentTarget.src = "https://github.com/shadcn.png";
                    }}
                  />
                  <AvatarFallback>
                    {formData.name ? formData.name[0] : "U"}
                  </AvatarFallback>
                </Avatar>
                <input
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-gray-500">Click avatar to upload new photo</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      name: e.target.value
                    }))}
                    className="mt-1" 
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      email: e.target.value
                    }))}
                    className="mt-1" 
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <Label htmlFor="wallet">Wallet Address</Label>
                  <Input 
                    id="wallet" 
                    value={walletAddress} 
                    disabled 
                    className="mt-1 bg-gray-100" 
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <textarea 
                    id="bio" 
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      bio: e.target.value
                    }))}
                    className="mt-1 w-full p-2 border rounded-md h-32 resize-none" 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-8">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </form>
        )}

        <div className="mt-12 pt-8 border-t border-red-100">
          <h3 className="text-lg font-semibold text-red-600">Wallet Connection</h3>
          <div className="mt-4 flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium">Disconnect Pera Wallet</p>
              <p className="text-sm text-red-600">This will remove your current wallet connection</p>
            </div>
            <Button
              variant="destructive"
              className="cursor-pointer"
              onClick={() => {
                new PeraWalletConnect().disconnect();
                localStorage.removeItem("walletAddress");
                window.location.href = "/";
              }}
            >
              Disconnect Wallet
            </Button>
          </div>
        </div>
      </Card>
    </Navbar>
  );
}