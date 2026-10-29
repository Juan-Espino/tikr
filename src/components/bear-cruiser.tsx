"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./bear-cruiser.module.css";

export function BearCruiser() {
  const [paused, setPaused] = useState(false);
  return (
    <div className="w-full max-w-lg">
      <div className={styles.stage} data-paused={paused} aria-hidden="true">
        <div className={styles.rider}>
          <div className={styles.character}>
            <Image
              src="/brand/bear-cruiser-standing.png"
              alt=""
              width={1280}
              height={1280}
              sizes="200px"
              className={`${styles.standing} h-auto w-full`}
            />
            <Image
              src="/brand/bear-cruiser-kneeling-fur.png"
              alt=""
              width={1280}
              height={1280}
              sizes="200px"
              className={`${styles.kneeling} h-auto w-full`}
            />
          </div>
        </div>
        <div className={styles.track} />
      </div>
      <button
        type="button"
        className={`${styles.control} text-muted-foreground text-xs underline underline-offset-4`}
        onClick={() => setPaused(!paused)}
        aria-pressed={paused}
      >
        {paused ? "Resume animation" : "Pause animation"}
      </button>
    </div>
  );
}
