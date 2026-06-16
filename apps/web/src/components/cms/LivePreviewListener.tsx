"use client";

import { useRouter } from "next/navigation";
import { RefreshRouteOnSave } from "@payloadcms/live-preview-react";
import { getPreviewSiteUrl } from "@/lib/cms/generatePreviewPath";

export function LivePreviewListener() {
  const router = useRouter();
  const serverURL =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || getPreviewSiteUrl();

  return (
    <RefreshRouteOnSave
      refresh={() => router.refresh()}
      serverURL={serverURL}
    />
  );
}
