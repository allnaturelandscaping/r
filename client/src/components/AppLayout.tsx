import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  CalendarDays,
  LayoutDashboard,
  Users,
  LogOut,
  Scissors,
  Menu,
  X,
  ShieldCheck,
  Clock,
  XCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/clients", icon: Users, label: "Clientes" },
  { href: "/calendar", icon: CalendarDays, label: "Calendario" },
];

function NavItem({
  href,
  icon: Icon,
  label,
  active,
  onClick,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick}>
      <div
        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-200 ease-snappy group touch-target ${
          active
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        }`}
      >
        <Icon
          size={22}
          className={`shrink-0 transition-transform duration-200 ${active ? "" : "group-hover:scale-110"}`}
        />
        <span className="font-medium text-[15px] tracking-wide">{label}</span>
        {active && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary-foreground/60" />
        )}
      </div>
    </Link>
  );
}

// Ícono de Google SVG
function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Leer el parámetro ?error= de la URL al volver de Google
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      setAuthError(err);
      // Limpiar el parámetro de la URL sin recargar
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <Scissors size={28} className="text-primary-foreground" />
          </div>
          <Spinner className="text-primary" />
          <p className="text-muted-foreground text-sm font-medium">
            Cargando LawnPro...
          </p>
        </div>
      </div>
    );
  }

  // Pantalla: acceso pendiente de aprobación
  if (!isAuthenticated && authError === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-8 max-w-sm w-full px-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-3xl bg-yellow-100 flex items-center justify-center shadow-xl">
              <Clock size={38} className="text-yellow-600" />
            </div>
            <div className="text-center">
              <h1
                className="text-3xl font-bold text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                LawnPro
              </h1>
            </div>
          </div>
          <div className="w-full bg-card rounded-2xl border border-border p-8 shadow-lg flex flex-col gap-4 text-center">
            <h2 className="text-xl font-semibold text-foreground">
              Acceso pendiente
            </h2>
            <p className="text-muted-foreground text-sm">
              Tu cuenta de Google fue registrada correctamente. El administrador
              debe aprobar tu acceso antes de que puedas entrar.
            </p>
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => setAuthError(null)}
            >
              Volver al inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla: acceso rechazado
  if (!isAuthenticated && authError === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-8 max-w-sm w-full px-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-3xl bg-red-100 flex items-center justify-center shadow-xl">
              <XCircle size={38} className="text-red-600" />
            </div>
            <div className="text-center">
              <h1
                className="text-3xl font-bold text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                LawnPro
              </h1>
            </div>
          </div>
          <div className="w-full bg-card rounded-2xl border border-border p-8 shadow-lg flex flex-col gap-4 text-center">
            <h2 className="text-xl font-semibold text-foreground">
              Acceso denegado
            </h2>
            <p className="text-muted-foreground text-sm">
              Tu cuenta no tiene acceso a LawnPro. Contacta al administrador si
              crees que esto es un error.
            </p>
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => setAuthError(null)}
            >
              Volver al inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla: no autenticado → login con Google
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-8 max-w-sm w-full px-6">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center shadow-xl">
              <Scissors size={38} className="text-primary-foreground" />
            </div>
            <div className="text-center">
              <h1
                className="text-3xl font-bold text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                LawnPro
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Gestión profesional de cortes
              </p>
            </div>
          </div>

          {/* Card de login */}
          <div className="w-full bg-card rounded-2xl border border-border p-8 shadow-lg flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Bienvenido
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Inicia sesión con tu cuenta de Google para acceder
              </p>
            </div>

            {authError === "oauth_failed" && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                Ocurrió un error al iniciar sesión. Inténtalo de nuevo.
              </div>
            )}

            <Button
              size="lg"
              variant="outline"
              className="w-full touch-target text-base font-semibold gap-3 border-2"
              onClick={() => startLogin()}
            >
              <GoogleIcon size={20} />
              Continuar con Google
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "LP";

  const isAdmin = user?.role === "admin";

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={`${
        mobile
          ? "fixed inset-0 z-50 flex"
          : "hidden lg:flex w-72 shrink-0 flex-col"
      }`}
    >
      {mobile && (
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div
        className={`${
          mobile ? "relative z-10 w-72" : "w-full"
        } h-full bg-sidebar flex flex-col shadow-2xl`}
      >
        {/* Logo */}
        <div className="px-6 pt-8 pb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center shadow-md">
              <Scissors size={20} className="text-sidebar-primary-foreground" />
            </div>
            <div>
              <p
                className="text-sidebar-foreground font-bold text-lg leading-none"
                style={{ fontFamily: "var(--font-display)" }}
              >
                LawnPro
              </p>
              <p className="text-sidebar-foreground/50 text-xs mt-0.5">
                Landscaping Manager
              </p>
            </div>
          </div>
          {mobile && (
            <button
              onClick={() => setMobileOpen(false)}
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground p-1"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="mx-6 h-px bg-sidebar-border mb-4" />

        {/* Nav principal */}
        <nav className="flex-1 px-3 flex flex-col gap-1">
          <p className="text-sidebar-foreground/40 text-xs font-semibold uppercase tracking-widest px-4 mb-2">
            Navegación
          </p>
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={location === item.href}
              onClick={() => setMobileOpen(false)}
            />
          ))}

          {/* Sección admin */}
          {isAdmin && (
            <>
              <div className="mx-1 h-px bg-sidebar-border my-3" />
              <p className="text-sidebar-foreground/40 text-xs font-semibold uppercase tracking-widest px-4 mb-2">
                Administración
              </p>
              <NavItem
                href="/admin/users"
                icon={ShieldCheck}
                label="Usuarios"
                active={location === "/admin/users"}
                onClick={() => setMobileOpen(false)}
              />
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="px-3 pb-6 pt-4 border-t border-sidebar-border mt-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-sidebar-accent">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name ?? ""}
                className="w-9 h-9 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-sidebar-primary flex items-center justify-center shrink-0">
                <span className="text-sidebar-primary-foreground text-sm font-bold">
                  {initials}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sidebar-foreground text-sm font-semibold truncate">
                {user?.name ?? "Usuario"}
              </p>
              <p className="text-sidebar-foreground/50 text-xs truncate">
                {isAdmin ? "Administrador" : "Usuario"}
              </p>
            </div>
            <button
              onClick={() => logout()}
              className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors p-1.5 rounded-lg hover:bg-sidebar-border"
              title="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar desktop */}
      <Sidebar />

      {/* Sidebar mobile overlay */}
      {mobileOpen && <Sidebar mobile />}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-sidebar border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Scissors size={16} className="text-sidebar-primary-foreground" />
            </div>
            <span
              className="text-sidebar-foreground font-bold text-lg"
              style={{ fontFamily: "var(--font-display)" }}
            >
              LawnPro
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="text-sidebar-foreground p-2 rounded-lg hover:bg-sidebar-accent"
          >
            <Menu size={22} />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
