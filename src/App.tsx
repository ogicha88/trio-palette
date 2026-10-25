import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Ambient, LoginSheet, TabBar, Toast, TopBar } from "./components/Shell";
import { PageSkeleton } from "./components/Skeleton";
import Explore from "./pages/Explore";
import { useApp } from "./state";

const Detail = lazy(() => import("./pages/Detail"));
const Colors = lazy(() => import("./pages/Colors"));
const ImageToColors = lazy(() => import("./pages/ImageToColors"));
const Saved = lazy(() => import("./pages/Saved"));

function LiquidFilter() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <filter id="liquid-glass" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="7" result="noise" />
        <feGaussianBlur in="noise" stdDeviation="2" result="soft" />
        <feDisplacementMap in="SourceGraphic" in2="soft" scale="38" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}

export default function App() {
  const { ready } = useApp();
  const location = useLocation();

  useEffect(() => {
    const brands = (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands ?? [];
    if (brands.some((b) => b.brand === "Chromium")) document.documentElement.classList.add("chromium");
  }, []);

  useEffect(() => {
    if (!location.pathname.startsWith("/p/")) window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  return (
    <MotionConfig reducedMotion="user">
      <LiquidFilter />
      <Ambient />
      <AnimatePresence mode="wait">
        {!ready ? (
          <PageSkeleton key="boot" withChrome />
        ) : (
          <motion.div key="app" className="shell" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <TopBar />
            <AnimatePresence mode="wait">
              <motion.main
                key={location.pathname}
                initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
                exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <Suspense fallback={<PageSkeleton />}>
                  <Routes location={location}>
                    <Route path="/" element={<Explore />} />
                    <Route path="/p/:id" element={<Detail />} />
                    <Route path="/colors" element={<Colors />} />
                    <Route path="/image" element={<ImageToColors />} />
                    <Route path="/saved" element={<Saved />} />
                    <Route path="*" element={<Explore />} />
                  </Routes>
                </Suspense>
              </motion.main>
            </AnimatePresence>
            <TabBar />
            <Toast />
            <LoginSheet />
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
