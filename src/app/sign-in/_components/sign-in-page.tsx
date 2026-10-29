"use client";

import { useRouter } from "next/navigation";

import { Login } from "~/components/intro";

import { useDemoPortfolios } from "~/providers/demo-portfolios-provider";
import { StorageNotice } from "~/components/app-shell";
export default function SignInPage() {
  const router = useRouter();
  const { draft, open } = useDemoPortfolios();
  return (
    <>
      <StorageNotice />{" "}
      <Login
        onLanding={() => {
          window.history.replaceState(
            window.history.state,
            "",
            window.location.pathname + window.location.search,
          );
          window.scrollTo(0, 0);
          router.push("/");
        }}
        onDashboard={() => (draft ? open(draft) : router.push("/dashboard"))}
      />
    </>
  );
}
