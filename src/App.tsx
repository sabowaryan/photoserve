import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Pricing from "./pages/Pricing";
import Upgrade from "./pages/Upgrade";
import Legal from "./pages/Legal";
import GalleryCreate from "./pages/GalleryCreate";
import GalleryDetail from "./pages/GalleryDetail";
import GalleryView from "./pages/GalleryView";
import { Error404, Error500, Error403, Error401, Error503 } from "./pages/errors";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ErrorBoundary>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/gallery/new" element={<GalleryCreate />} />
              <Route path="/dashboard/gallery/:id" element={<GalleryDetail />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/upgrade" element={<Upgrade />} />
              <Route path="/legal/:page" element={<Legal />} />
              <Route path="/g/:slug" element={<GalleryView />} />
              {/* Error pages */}
              <Route path="/error/500" element={<Error500 />} />
              <Route path="/error/403" element={<Error403 />} />
              <Route path="/error/401" element={<Error401 />} />
              <Route path="/error/503" element={<Error503 />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<Error404 />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;