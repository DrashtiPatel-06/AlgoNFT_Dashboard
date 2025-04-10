"use client";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Navbar from "../Navbar/page";

export default function ProfileSettings() {
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john@example.com");
  const [bio, setBio] = useState("NFT enthusiast and digital collector");
  const [walletAddress] = useState(localStorage.getItem("walletAddress") || "");
  const [profileImage, setProfileImage] = useState(
    "https://github.com/shadcn.png"
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfileImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = "Invalid email format";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Handle form submission
      console.log({ name, email, bio });
      // Add your API call here
    }
  };

  return (
    <Navbar message="Profile Settings">
      <Card className="p-8 max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <label htmlFor="profile-upload" className="cursor-pointer relative">
              <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                <AvatarImage src={profileImage} alt="Profile" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 bg-gray-800 p-2 rounded-full">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
            </label>
            <input
              id="profile-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <p className="text-sm text-gray-500">
              Click avatar to upload new photo
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Name Field */}
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* Wallet Address (Disabled) */}
              <div>
                <Label htmlFor="wallet">Wallet Address</Label>
                <Input
                  id="wallet"
                  value={walletAddress}
                  disabled
                  className="mt-1 bg-gray-100"
                />
              </div>

              {/* Bio Field */}
              <div>
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-1 w-full p-2 border rounded-md h-32 resize-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-8">
              <Button variant="outline">Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </div>
        </form>

        {/* Dangerous Zone */}
        <div className="mt-12 pt-8 border-t border-red-100">
          <h3 className="text-lg font-semibold text-red-600">
            Wallet Connection
          </h3>
          <div className="mt-4 flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium">Disconnect Pera Wallet</p>
              <p className="text-sm text-red-600">
                This will remove your current wallet connection
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => {
                // Remove wallet address from localStorage
                localStorage.removeItem("walletAddress");
                // Redirect to homepage or connection page
                window.location.href = "/"; // Update with your actual login/connect route
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
