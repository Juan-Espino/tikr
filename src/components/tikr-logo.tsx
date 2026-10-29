import Image from "next/image";

export function TikrLogo() {
  return (
    <span className="inline-flex items-center gap-2 text-[17px] font-semibold tracking-[-0.04em]">
      <Image
        src="/brand/bear-aviator.png"
        alt=""
        width={32}
        height={32}
        className="size-8 rounded-md"
      />
      Tikr
    </span>
  );
}
