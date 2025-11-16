"use client";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider } from "@coral-xyz/anchor";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { getProgram, PROGRAM_ID } from "./utils/program";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";

type Profile = {
  authority: PublicKey;
  displayName: string;
  links: Link[];
};
type Link = {
  label: string;
  url: string;
};

const accountsAny = (o: Record<string, any>) => o as unknown as any;

export default function Home() {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [provider, setProvider] = useState<AnchorProvider | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profilePda, setProfilePda] = useState<PublicKey | null>(null);
  const [loading, setLoading] = useState(true);

  const [displayName, setDisplayName] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (wallet) {
      const provider = new AnchorProvider(connection, wallet, {});
      setProvider(provider);

      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("profile"), wallet.publicKey.toBuffer()],
        PROGRAM_ID
      );
      setProfilePda(pda);
    } else {
      setProvider(null);
      setProfile(null);
      setProfilePda(null);
    }
  }, [wallet, connection]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!provider || !profilePda) return;
      setLoading(true);
      setError("");
      try {
        const program = getProgram(provider);
        const profileAccount = await program.account.userProfile.fetch(
          profilePda
        );
        setProfile(profileAccount as Profile);
      } catch (error) {
        console.log("No profile found.");
        setProfile(null);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [provider, profilePda]);

  const fetchUpdatedProfile = async () => {
    if (!provider || !profilePda) return;
    try {
      const program = getProgram(provider);
      const profileAccount = await program.account.userProfile.fetch(profilePda);
      setProfile(profileAccount as Profile);
    } catch (e) { console.error("Failed to refetch profile", e)}
  }

  const handleCreateProfile = async () => {
    if (!provider || !profilePda || !displayName) return;
    setError("");
    try {
      const program = getProgram(provider);
      await program.methods
        .createProfile(displayName)
        .accounts(accountsAny({
          userProfile: profilePda,
          authority: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        }))
        .rpc();
      
      await fetchUpdatedProfile();
    } catch (error) {
      console.error("Error creating profile:", error);
      setError("Failed to create profile. Make sure you have Devnet SOL.");
    }
  };

  const handleAddLink = async () => {
    if (!provider || !profilePda || !linkLabel || !linkUrl) return;
    if (profile && profile.links.length >= 10) {
      setError("Link limit (10) reached.");
      return;
    }
    setError("");
    
    try {
      const program = getProgram(provider);
      await program.methods
        .addLink(linkLabel, linkUrl)
        .accounts(accountsAny({
          userProfile: profilePda,
          authority: provider.wallet.publicKey,
        }))
        .rpc();

      await fetchUpdatedProfile();
      setLinkLabel("");
      setLinkUrl("");
    } catch (error) {
      console.error("Error adding link:", error);
      setError("Failed to add link. Check console for details.");
    }
  };

  const handleRemoveLink = async (index: number) => {
    if (!provider || !profilePda) return;
    setError("");
    try {
      const program = getProgram(provider);
      await program.methods
        .removeLink(index)
        .accounts(accountsAny({
          userProfile: profilePda,
          authority: provider.wallet.publicKey,
        }))
        .rpc();
      
      await fetchUpdatedProfile();
    } catch (error) {
      console.error("Error removing link:", error);
      setError("Failed to remove link.");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24 bg-gray-900 text-gray-100">
      <div className="w-full max-w-4xl">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold text-emerald-400">
            Solana Profile Links
          </h1>
          <WalletMultiButton
            style={{ backgroundColor: "#059669", color: "white" }}
          />
        </header>

        {error && (
          <div className="bg-red-800 border border-red-600 text-white px-4 py-3 rounded-md mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {!wallet ? (
          <p className="text-center text-lg">
            Please connect your wallet to continue.
          </p>
        ) : loading ? (
          <p className="text-center text-lg">Loading profile...</p>
        ) : profile ? (
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-center">
              @{profile.displayName}
            </h2>

            {/* Display Links */}
            <div className="space-y-4">
              {profile.links.map((link, index) => (
                <div
                  key={index}
                  className="bg-gray-800 p-4 rounded-lg flex justify-between items-center shadow-md"
                >
                  <div>
                    <div className="text-xl font-semibold text-gray-100">{link.label}</div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 break-all"
                    >
                      {link.url}
                    </a>
                  </div>
                  <button
                    onClick={() => handleRemoveLink(index)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md ml-4"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {profile.links.length === 0 && (
                <p className="text-center text-gray-400">No links added yet.</p>
              )}
            </div>

            {/* Add Link Form */}
            {profile.links.length < 10 && (
              <div className="bg-gray-800 p-6 rounded-lg space-y-4 shadow-lg">
                <h3 className="text-2xl font-semibold">Add New Link</h3>
                <input
                  type="text"
                  placeholder="Label (e.g., 'Twitter')"
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  placeholder="URL (e.g., 'https://twitter.com/user')"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleAddLink}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded transition-colors"
                >
                  Add Link
                </button>
              </div>
            )}
          </div>
        ) : (
          // No profile, show creation UI
          <div className="bg-gray-800 p-6 rounded-lg space-y-4 max-w-md mx-auto shadow-lg">
            <h2 className="text-2xl font-semibold text-center">
              Create Your Profile
            </h2>
            <p className="text-center text-gray-300">
              You don&apos;t have a profile yet. Choose a display name to create
              one.
            </p>
            <input
              type="text"
              placeholder="Your Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={handleCreateProfile}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded transition-colors"
            >
              Create Profile
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
