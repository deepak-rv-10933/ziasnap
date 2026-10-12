import { MealPhoto } from "@/components/meals/MealPhoto";

interface ImagePreviewProps {
  src: string;
}

export function ImagePreview({ src }: ImagePreviewProps) {
  return <MealPhoto src={src} alt="Your captured meal" aspect="video" className="w-full" />;
}
