import { ForkKnife } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

interface MealPhotoProps {
  src?: string;
  alt: string;
  className?: string;
  aspect?: "square" | "video" | "wide";
}

const ASPECT_CLASS: Record<NonNullable<MealPhotoProps["aspect"]>, string> = {
  square: "aspect-square",
  video: "aspect-[4/3]",
  wide: "aspect-[16/10]",
};

export function MealPhoto({ src, alt, className, aspect = "square" }: MealPhotoProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-muted",
        ASPECT_CLASS[aspect],
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" decoding="async" className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground/50">
          <ForkKnife className="size-6" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
