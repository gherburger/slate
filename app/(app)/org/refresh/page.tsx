"use client";

import { useEffect } from "react";

export default function OrgRefreshPage() {
  useEffect(() => {
    window.location.href = "/org";
  }, []);

  return null;
}
