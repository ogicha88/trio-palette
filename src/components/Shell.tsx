import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { loginUrl } from "../lib/api";
import { useApp } from "../state";
import { IconClose, IconDrop, IconGoogle, IconGrid, IconHeart, IconSpark, IconUser } from "./icons";
import { spring } from "./ui";

export function Ambient() {
  const { ambient } = useApp();
  return (
    <div className="ambient" aria-hidden>
      {ambient.map((c, i) => (
        <motion.span key={i} className={`orb orb-${i}`} animate={{ backgroundColor: c }} transition={{ duration: 1.2, ease: "easeInOut" }} />
      ))}
    </div>
  );
}

export function TopBar() {
  const { user, setLoginSheet } = useApp();
  const [account, setAccount] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 8));

  return (
    <>
      <motion.header className={`topbar glass ${scrolled ? "scrolled" : ""}`} initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={spring}>
        <NavLink to="/" className="logo" aria-label="Trio ホーム">
          <span className="logo-dots">
            <i />
            <i />
            <i />
          </span>
          trio
        </NavLink>
        <motion.button
          className="glass glass-btn avatar-btn"
          whileTap={{ scale: 0.9 }}
          aria-label={user ? "アカウント" : "ログイン"}
          onClick={() => (user ? setAccount(true) : setLoginSheet(true))}
        >
          {user?.picture ? <img src={user.picture} alt="" referrerPolicy="no-referrer" /> : user ? <span className="avatar-initial">{user.name.slice(0, 1)}</span> : <IconUser />}
        </motion.button>
      </motion.header>
      <AccountSheet open={account} onClose={() => setAccount(false)} />
    </>
  );
}

const TABS = [
  { to: "/", label: "探す", icon: IconGrid },
  { to: "/colors", label: "色から", icon: IconDrop },
  { to: "/image", label: "イメージから", icon: IconSpark },
  { to: "/saved", label: "保存", icon: IconHeart },
];

export function TabBar() {
  const { pathname } = useLocation();
  const active = TABS.find((t) => (t.to === "/" ? pathname === "/" || pathname.startsWith("/p/") : pathname.startsWith(t.to)))?.to;
  return (
    <motion.nav className="tabbar glass liquid" aria-label="メインメニュー" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...spring, delay: 0.1 }}>
      {TABS.map((t) => {
        const on = t.to === active;
        const Icon = t.icon;
        return (
          <NavLink key={t.to} to={t.to} className={`tab ${on ? "on" : ""}`} aria-current={on ? "page" : undefined}>
            {on && <motion.span layoutId="tab-blob" className="tab-blob" transition={{ type: "spring", stiffness: 380, damping: 28 }} />}
            <motion.span className="tab-icon" animate={{ scale: on ? 1.08 : 1, y: on ? -1 : 0 }} transition={spring}>
              <Icon />
            </motion.span>
            <span className="tab-label">{t.label}</span>
          </NavLink>
        );
      })}
    </motion.nav>
  );
}

export function Toast() {
  const { toast } = useApp();
  return (
    <div className="toast-wrap" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            className="toast glass"
            initial={{ y: -30, opacity: 0, scale: 0.9, filter: "blur(6px)" }}
            animate={{ y: 0, opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ y: -20, opacity: 0, scale: 0.95 }}
            transition={spring}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Sheet({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: React.ReactNode; label: string }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className="sheet glass"
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => info.offset.y > 90 && onClose()}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="sheet-grip" />
            <button className="sheet-close" onClick={onClose} aria-label="閉じる">
              <IconClose />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function GoogleButton({ returnTo }: { returnTo?: string }) {
  const { googleEnabled } = useApp();
  return (
    <motion.a whileTap={{ scale: 0.96 }} className="google-btn" href={loginUrl(returnTo)} aria-disabled={!googleEnabled} data-testid="google-login">
      <IconGoogle />
      Googleでログイン
    </motion.a>
  );
}

export function LoginSheet() {
  const { loginSheet, setLoginSheet } = useApp();
  return (
    <Sheet open={loginSheet} onClose={() => setLoginSheet(false)} label="ログイン">
      <div className="sheet-body center">
        <div className="login-orbs" aria-hidden>
          <i />
          <i />
          <i />
        </div>
        <h3>ログイン</h3>
        <p className="muted small">保存とAI機能を使えます</p>
        <GoogleButton />
      </div>
    </Sheet>
  );
}

function AccountSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout, favorites } = useApp();
  if (!user) return null;
  return (
    <Sheet open={open} onClose={onClose} label="アカウント">
      <div className="sheet-body center">
        {user.picture ? <img className="account-pic" src={user.picture} alt="" referrerPolicy="no-referrer" /> : <span className="account-pic avatar-initial">{user.name.slice(0, 1)}</span>}
        <h3>{user.name}</h3>
        <p className="muted small">{user.email}</p>
        <p className="muted small">保存 {favorites.length}件</p>
        <button
          className="glass glass-btn wide"
          onClick={async () => {
            await logout();
            onClose();
          }}
        >
          ログアウト
        </button>
      </div>
    </Sheet>
  );
}
