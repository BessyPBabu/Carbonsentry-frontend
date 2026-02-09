import React from "react";
import { useLocation, Link } from "react-router-dom";

export default function VerifyEmailSent() {
  const location = useLocation();
  const email = location.state?.email || "your email";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          {/* Email Icon */}
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg 
              className="w-8 h-8 text-blue-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
              />
            </svg>
          </div>
          
          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Check Your Email
          </h2>
          
          {/* Email Address */}
          <p className="text-gray-600 mb-6">
            We've sent a verification link to{" "}
            <span className="font-semibold text-gray-900 break-all">{email}</span>
          </p>
          
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-blue-900 font-medium mb-3">
              Next Steps:
            </p>
            <ol className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[20px]">1.</span>
                <span>Open your email inbox and find the message from CarbonSentry</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[20px]">2.</span>
                <span>Click the verification link in the email</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[20px]">3.</span>
                <span>You'll be redirected back to login</span>
              </li>
            </ol>
          </div>
          
          {/* Important Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-900 font-medium mb-2">
              ⚠️ Important
            </p>
            <p className="text-xs text-yellow-800">
              The verification link will expire in 24 hours. You cannot log in until your email is verified.
            </p>
          </div>
          
          {/* Troubleshooting */}
          <div className="text-left mb-6">
            <p className="text-xs text-gray-600 font-medium mb-2">
              Didn't receive the email?
            </p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Check your spam or junk folder</li>
              <li>• Make sure you entered the correct email address</li>
              <li>• Wait a few minutes - emails can be delayed</li>
              <li>• Contact support if the issue persists</li>
            </ul>
          </div>
          
          {/* Actions */}
          <div className="space-y-3">
            
            <Link
              to="/register"
              className="block w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Register Different Account
            </Link>
          </div>
          
          {/* Help Link */}
          <div className="mt-6">
            <p className="text-xs text-gray-500">
              Need help?{" "}
              <a 
                href="mailto:support@carbonsentry.com" 
                className="text-[#1a8f70] hover:underline"
              >
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}