import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
vi.mock("../src/components/tikr-logo", () => ({ TikrLogo: () => "Tikr" }));
vi.mock("../src/components/wireframe-globe", () => ({
  WireframeGlobe: () => null,
}));
const session = vi.hoisted(() => ({
  data: null as null | {
    user: { name: string; email: string; image?: string; id?: string };
  },
  isPending: false,
  error: null as null | Error,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("../src/lib/auth-client", () => ({
  authClient: { useSession: () => session, signOut: vi.fn() },
}));
import { AccountMenu } from "../src/components/account-menu";
test("loading or failed session never renders cached private identity", () => {
  session.data = {
    user: { name: "Synthetic Private User", email: "private@example.test" },
  };
  session.isPending = true;
  const pending = renderToStaticMarkup(createElement(AccountMenu));
  expect(pending).toContain('role="status"');
  expect(pending).not.toContain("private@example.test");
  session.isPending = false;
  session.error = new Error("synthetic");
  const failed = renderToStaticMarkup(createElement(AccountMenu));
  expect(failed).toContain("Sign in");
  expect(failed).not.toContain("Synthetic Private User");
  session.error = null;
  const signedIn = renderToStaticMarkup(createElement(AccountMenu));
  expect(signedIn).toContain('aria-label="Open account"');
  expect(signedIn).toContain('aria-haspopup="dialog"');
  expect(signedIn).toContain('data-slot="avatar"');
  expect(signedIn).not.toContain("private@example.test");
});

import { Login } from "../src/components/intro";
test("pending sign-in disables provider action but keeps guest use available; errors are announced", () => {
  const props = {
    onLanding: vi.fn(),
    onDashboard: vi.fn(),
    onGoogle: vi.fn(),
    pending: true,
    error: "",
  };
  const loading = renderToStaticMarkup(createElement(Login, props));
  expect(loading).toMatch(/<button[^>]*disabled=""[^>]*>[\s\S]*?Connecting/);
  expect(loading).toContain('role="status"');
  expect(loading).toContain("Continue as guest");
  expect(loading).toContain("does not save them to the cloud");
  const error = renderToStaticMarkup(
    createElement(Login, {
      ...props,
      pending: false,
      error: "Synthetic denied login",
    }),
  );
  expect(error).toContain('role="alert"');
  expect(error).toContain("Synthetic denied login");
  expect(error).toContain("Continue with Google");
});
