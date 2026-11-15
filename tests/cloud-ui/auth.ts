import { useSyncExternalStore } from "react";
import { emit, session, state, subscribe, version } from "./state";
export const authClient = {
  useSession: () => {
    useSyncExternalStore(subscribe, version, version);
    return session();
  },
  getSession: async () => session(),
  signOut: async () => {
    state.account = "";
    emit();
    return { error: null };
  },
  signIn: { social: async () => ({ error: null }) },
};
