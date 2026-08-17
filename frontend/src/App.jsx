import AppRouter from "./routes/AppRouter.jsx";
import AppErrorBoundary from "./components/ui/AppErrorBoundary.jsx";

export default function App() {
  return (
    <AppErrorBoundary>
      <AppRouter />
    </AppErrorBoundary>
  );
}
