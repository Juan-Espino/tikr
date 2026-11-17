"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { Landing } from "./intro";

type Actions = {
  ready: boolean;
  build: () => void;
  example: () => void;
  prepareToLeave?: () => Promise<boolean>;
};
const LandingActions = createContext<
  ((actions: Actions | null) => void) | null
>(null);

// This visual surface lives above the guest/account provider switch. Auth and
// recovery can update its controls without remounting the headline or canvas.
export function LandingSurface({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [actions, setActions] = useState<Actions | null>(null);
  const publish = useMemo(() => (next: Actions | null) => setActions(next), []);
  return (
    <LandingActions.Provider value={publish}>
      {pathname === "/" && (
        <Landing
          pending={!actions?.ready}
          prepareToLeave={actions?.prepareToLeave}
          onBuild={() => actions?.build()}
          onExample={() => actions?.example()}
          onLogin={() => router.push("/sign-in")}
          onDashboard={() => router.push("/dashboard")}
        />
      )}
      {children}
    </LandingActions.Provider>
  );
}

export const useLandingActions = () => useContext(LandingActions);
