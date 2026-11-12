import styles from "./tikr-logo.module.css";

export function TikrLogo() {
  return (
    <span className="inline-flex items-center gap-2 text-[17px] font-semibold tracking-[-0.04em]">
      <span aria-hidden="true" className={styles.mark} />
      Tikr
    </span>
  );
}
