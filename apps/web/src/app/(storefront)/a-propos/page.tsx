import { getBrandPageData } from "@/lib/getBrandPageData";
import { BrandPageContent } from "./BrandPageContent";

export async function generateMetadata() {
  return {
    title: "À propos — Lénue Paris",
    description: "Découvrez l'histoire de Lénue Paris.",
  };
}

export default async function BrandPage() {
  const data = await getBrandPageData();

  return <BrandPageContent {...data} />;
}
