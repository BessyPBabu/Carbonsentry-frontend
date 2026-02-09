import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../services/api";

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); 
  const [message, setMessage] = useState("");
  const [organizationName, setOrganizationName] = useState("");

  useEffect(() => {
  let cancelled = false; 
  
  const verifyEmail = async () => {
    try {
      const response = await api.get(`/accounts/organizations/verify-email/${token}/`);
      
      if (cancelled) return; 
      
      setStatus("success");

      if (response.data.already_verified) {
        setMessage("Your organization email was already verified. You can log in now!");
      } else {
        setMessage(response.data.message || "Email verified successfully!");
      }

      setOrganizationName(response.data.organization_name || "");
      
      setTimeout(() => {
        if (!cancelled) { 
          navigate("/login", { replace: true });
        }
      }, 3000);
      
    } catch (error) {
      if (cancelled) return;
      
      setStatus("error");
      setMessage(
        error.response?.data?.message || 
        error.response?.data?.error ||
        "Verification failed. The link may be invalid or expired."
      );
    }
  };

  if (token && !cancelled) { 
    verifyEmail();
  }
  
  return () => {
    cancelled = true;
  };
}, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        
        {/* Verifying State */}
        {status === "verifying" && (
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#1a8f70] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying Email...
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your email address.
            </p>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg 
                className="w-8 h-8 text-green-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Email Verified!
            </h2>
            
            {organizationName && (
              <p className="text-lg text-gray-700 mb-2">
                Welcome to <span className="font-semibold">{organizationName}</span>!
              </p>
            )}
            
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                Your organization has been verified. You can now log in with your credentials.
              </p>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">
              Redirecting to login in 3 seconds...
            </p>
            
            <Link
              to="/login"
              className="inline-block bg-[#1a8f70] text-white px-6 py-3 rounded-lg hover:bg-[#12654e] transition-colors font-medium"
            >
              Go to Login Now
            </Link>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg 
                className="w-8 h-8 text-red-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verification Failed
            </h2>
            
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 mb-2 font-medium">
                Common reasons for verification failure:
              </p>
              <ul className="text-xs text-red-700 text-left space-y-1">
                <li>• The verification link has expired (24 hours)</li>
                <li>• The link has already been used</li>
                <li>• The link is invalid or corrupted</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <Link
                to="/register"
                className="block w-full bg-[#1a8f70] text-white py-3 rounded-lg hover:bg-[#12654e] transition-colors font-medium"
              >
                Register Again
              </Link>
              <Link
                to="/login"
                className="block w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Back to Login
              </Link>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}