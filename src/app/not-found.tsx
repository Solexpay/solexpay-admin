import { Compass } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-ui-frame p-4">
      <section className="ui-panel w-full max-w-lg">
        <div className="ui-panel-body px-4 py-14 text-center">
          <Compass size={36} className="mx-auto mb-3 text-ui-faint" />
          <h1 className="text-xl font-semibold text-ui-ink">Page not found</h1>
          <p className="mx-auto mt-1 max-w-md text-sm text-ui-muted">
            The link may be old or mistyped.
          </p>
          <Link href="/dashboard" className="ui-btn ui-btn-primary mt-5">
            Back to dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
