import Navbar from "./Navbar.jsx";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Footer from "./Footer";

const CartonVerifier = () => {
  const [searchParams] = useSearchParams();
  const [uuid, setUuid] = useState("");
  const [result, setResult] = useState("");

  useEffect(() => {
    const initialUuid = searchParams.get("uuid");
    if (initialUuid) {
      setUuid(initialUuid);
      verifyCarton(initialUuid);
    }
  }, [searchParams]);

  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function fromB64(b64Str) {
    try {
      return decodeURIComponent(escape(window.atob(b64Str)));
    } catch (e) {
      return "⚠️ Invalid Base64";
    }
  }

  const verifyCarton = async (inputUuid = uuid) => {
    const hash = await sha256(inputUuid.trim());
    try {
      const response = await fetch("/sha_lookup.json");
      const data = await response.json();

      if (data[hash]) {
        setResult(
          `✅ Dispatched to ${fromB64(data[hash].recipient)} on ${data[hash].date}. The contents described as ${data[hash].contents}.`
        );
      } else {
        setResult("❌ Carton not found or invalid.");
      }
    } catch (err) {
      setResult("⚠️ Error loading data."+String(err));
    }
  };

  return (
    
    <div classname="text-gray-800">
      <script>
        window.location.href = window.location.href + '?t=' + new Date().getTime();

      </script>

      <Navbar/>
      <div className="p-4 max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-2">Verify Carton</h2>
        <input
          type="text"
          className="border border-gray-300 px-3 py-2 w-full mb-2"
          placeholder="Enter Carton UUID"
          value={uuid}
          onChange={(e) => setUuid(e.target.value)}
          onKeyDown={(e) => {if (e.key === 'Enter') {
                  verifyCarton();
                }
            }
          }
        />
        <button
          onClick={() => verifyCarton()}
          className="bg-black text-white px-4 py-2 w-full"
        >
          Verify
        </button>
        {result && <p className="mt-3">{result}</p>}
      </div>
      <Footer/>
    </div>
  );
};

export default CartonVerifier;
