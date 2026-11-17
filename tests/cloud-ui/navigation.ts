import { emit } from "./state";
const navigate = (url: string) => {
  history.pushState(null, "", url);
  emit();
};
const router = { push: navigate, replace: navigate };
export const useRouter = () => router;

export const usePathname = () => window.location.pathname;
