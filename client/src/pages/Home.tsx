import { useEffect } from "react";
import { useLocation } from "wouter";

// Home redirects to Dashboard (the main app entry point)
export default function Home() {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate("/");
  }, []);
  return null;
}

