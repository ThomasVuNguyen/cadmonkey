
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";

  // Clear any hash fragments or paths from old v1 deployment
  // This keeps URLs clean: https://cadmonkey.web.app
  if (window.location.hash || window.location.pathname !== '/') {
    // Use replaceState to avoid adding to browser history
    window.history.replaceState(null, '', '/');
  }

  createRoot(document.getElementById("root")!).render(<App />);
  